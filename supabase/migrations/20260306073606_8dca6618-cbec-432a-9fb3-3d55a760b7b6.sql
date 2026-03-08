
-- Drop old transaksi_midtrans (from previous migration, empty table)
DROP TABLE IF EXISTS public.transaksi_midtrans CASCADE;

-- 1. Update validate_user_role to accept 'ortu'
CREATE OR REPLACE FUNCTION public.validate_user_role()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IS NOT NULL AND NEW.role NOT IN (
    'admin','kepala_sekolah','guru','keuangan','kasir','pustakawan','siswa','ortu'
  ) THEN
    RAISE EXCEPTION 'role tidak valid: %', NEW.role;
  END IF;
  RETURN NEW;
END; $$;

-- 2. Tabel relasi orang tua → anak
CREATE TABLE public.ortu_siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  siswa_id uuid NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  hubungan text DEFAULT 'ortu',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, siswa_id)
);

-- 3. Tabel transaksi Midtrans
CREATE TABLE public.transaksi_midtrans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES public.users_profile(id),
  total_amount numeric(15,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  snap_token text,
  payment_type text,
  midtrans_transaction_id text,
  midtrans_payment_status text,
  fraud_status text,
  paid_at timestamptz,
  expired_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Tabel detail item dalam 1 transaksi Midtrans
CREATE TABLE public.transaksi_midtrans_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id uuid NOT NULL REFERENCES public.transaksi_midtrans(id) ON DELETE CASCADE,
  siswa_id uuid NOT NULL REFERENCES public.siswa(id),
  jenis_id uuid NOT NULL REFERENCES public.jenis_pembayaran(id),
  bulan int NOT NULL,
  jumlah numeric(15,2) NOT NULL,
  nama_item text NOT NULL,
  departemen_id uuid REFERENCES public.departemen(id),
  tahun_ajaran_id uuid REFERENCES public.tahun_ajaran(id),
  pembayaran_id uuid REFERENCES public.pembayaran(id),
  created_at timestamptz DEFAULT now()
);

-- 5. Tabel notifikasi tagihan untuk orang tua
CREATE TABLE public.notifikasi_ortu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  siswa_id uuid REFERENCES public.siswa(id),
  judul text NOT NULL,
  pesan text NOT NULL,
  tipe text DEFAULT 'tagihan',
  dibaca boolean DEFAULT false,
  url text,
  created_at timestamptz DEFAULT now()
);

-- 6. Indexes
CREATE INDEX idx_ortu_siswa_user ON public.ortu_siswa(user_id);
CREATE INDEX idx_ortu_siswa_siswa ON public.ortu_siswa(siswa_id);
CREATE INDEX idx_transaksi_midtrans_user ON public.transaksi_midtrans(user_id);
CREATE INDEX idx_transaksi_midtrans_status ON public.transaksi_midtrans(status);
CREATE INDEX idx_transaksi_midtrans_order ON public.transaksi_midtrans(order_id);
CREATE INDEX idx_transaksi_item_transaksi ON public.transaksi_midtrans_item(transaksi_id);
CREATE INDEX idx_transaksi_item_siswa ON public.transaksi_midtrans_item(siswa_id);
CREATE INDEX idx_notifikasi_user ON public.notifikasi_ortu(user_id, dibaca);

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_transaksi_midtrans_updated
  BEFORE UPDATE ON public.transaksi_midtrans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Enable RLS
ALTER TABLE public.ortu_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_midtrans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_midtrans_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi_ortu ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
CREATE POLICY "Ortu lihat anak sendiri" ON public.ortu_siswa
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admin kelola ortu_siswa" ON public.ortu_siswa
  FOR ALL TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()))
  WITH CHECK (public.is_admin_or_kepala(auth.uid()));

CREATE POLICY "Ortu insert anaknya" ON public.ortu_siswa
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User lihat transaksi sendiri" ON public.transaksi_midtrans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User buat transaksi" ON public.transaksi_midtrans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin lihat semua transaksi" ON public.transaksi_midtrans
  FOR SELECT TO authenticated USING (public.is_admin_or_kepala(auth.uid()));

CREATE POLICY "Service update transaksi" ON public.transaksi_midtrans
  FOR UPDATE USING (true);

CREATE POLICY "User lihat item transaksinya" ON public.transaksi_midtrans_item
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transaksi_midtrans t
      WHERE t.id = transaksi_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "User insert item" ON public.transaksi_midtrans_item
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service update item" ON public.transaksi_midtrans_item
  FOR UPDATE USING (true);

CREATE POLICY "Admin lihat semua item" ON public.transaksi_midtrans_item
  FOR SELECT TO authenticated USING (public.is_admin_or_kepala(auth.uid()));

CREATE POLICY "User lihat notif sendiri" ON public.notifikasi_ortu
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User update notif sendiri" ON public.notifikasi_ortu
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admin insert notif" ON public.notifikasi_ortu
  FOR INSERT TO authenticated WITH CHECK (true);

-- 10. Helper function
CREATE OR REPLACE FUNCTION public.is_ortu_of(p_user_id uuid, p_siswa_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ortu_siswa
    WHERE user_id = p_user_id AND siswa_id = p_siswa_id
  )
$$;

-- 11. View: tagihan belum bayar per siswa
CREATE OR REPLACE VIEW public.v_tagihan_belum_bayar AS
SELECT
  s.id AS siswa_id,
  s.nis,
  s.nama AS nama_siswa,
  s.jenis_kelamin,
  k.nama AS kelas_nama,
  d.id AS departemen_id,
  d.nama AS departemen_nama,
  d.kode AS departemen_kode,
  jp.id AS jenis_id,
  jp.nama AS jenis_nama,
  jp.nominal,
  ta.id AS tahun_ajaran_id,
  ta.nama AS tahun_ajaran_nama,
  bulan_series.bulan,
  CASE WHEN p.id IS NOT NULL THEN true ELSE false END AS sudah_bayar,
  p.id AS pembayaran_id,
  p.tanggal_bayar
FROM siswa s
JOIN kelas_siswa ks ON ks.siswa_id = s.id AND ks.aktif = true
JOIN kelas k ON k.id = ks.kelas_id
JOIN departemen d ON d.id = k.departemen_id
JOIN jenis_pembayaran jp ON jp.departemen_id = d.id AND jp.aktif = true
JOIN tahun_ajaran ta ON ta.aktif = true
CROSS JOIN generate_series(1, 12) AS bulan_series(bulan)
LEFT JOIN pembayaran p ON
  p.siswa_id = s.id AND
  p.jenis_id = jp.id AND
  p.bulan = bulan_series.bulan AND
  p.tahun_ajaran_id = ta.id
WHERE s.status = 'aktif'
  AND bulan_series.bulan <= EXTRACT(MONTH FROM CURRENT_DATE);
