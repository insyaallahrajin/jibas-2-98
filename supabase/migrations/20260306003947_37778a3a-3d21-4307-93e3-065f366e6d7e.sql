
CREATE TABLE public.jenis_pengeluaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  keterangan text,
  aktif boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.pengeluaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis_id uuid REFERENCES public.jenis_pengeluaran(id),
  jumlah numeric(15,2) NOT NULL,
  tanggal date NOT NULL,
  keterangan text,
  petugas_id uuid REFERENCES public.pegawai(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.tabungan_siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid REFERENCES public.siswa(id) ON DELETE CASCADE UNIQUE,
  saldo numeric(15,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.transaksi_tabungan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid REFERENCES public.siswa(id),
  jenis text NOT NULL,
  jumlah numeric(15,2) NOT NULL,
  saldo_sesudah numeric(15,2),
  tanggal date NOT NULL,
  keterangan text,
  petugas_id uuid REFERENCES public.pegawai(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.jenis_pengeluaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabungan_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_tabungan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_jenis_pengeluaran" ON public.jenis_pengeluaran
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_keuangan_manage_jenis_pengeluaran" ON public.jenis_pengeluaran
  FOR ALL TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'))
  WITH CHECK (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'));

CREATE POLICY "kepsek_read_pengeluaran" ON public.pengeluaran
  FOR SELECT TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'));
CREATE POLICY "admin_keuangan_manage_pengeluaran" ON public.pengeluaran
  FOR ALL TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'))
  WITH CHECK (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'));

CREATE POLICY "admin_keuangan_manage_tabungan" ON public.tabungan_siswa
  FOR ALL TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'))
  WITH CHECK (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'));
CREATE POLICY "siswa_own_tabungan" ON public.tabungan_siswa
  FOR SELECT TO authenticated
  USING (public.is_own_siswa(auth.uid(), siswa_id));

CREATE POLICY "admin_keuangan_manage_transaksi" ON public.transaksi_tabungan
  FOR ALL TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'))
  WITH CHECK (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'));
CREATE POLICY "siswa_own_transaksi_tabungan" ON public.transaksi_tabungan
  FOR SELECT TO authenticated
  USING (public.is_own_siswa(auth.uid(), siswa_id));
