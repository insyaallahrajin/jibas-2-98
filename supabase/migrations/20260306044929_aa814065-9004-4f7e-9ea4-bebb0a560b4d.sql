-- 1. Tambah departemen_id ke tabel pegawai
--    NULL berarti pegawai yayasan (lintas lembaga, mis: admin, bendahara yayasan)
ALTER TABLE public.pegawai
  ADD COLUMN IF NOT EXISTS departemen_id uuid
  REFERENCES public.departemen(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pegawai_departemen ON public.pegawai(departemen_id);

-- 2. Buat tabel presensi_pegawai
CREATE TABLE public.presensi_pegawai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id uuid NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  departemen_id uuid REFERENCES public.departemen(id) ON DELETE SET NULL,
  tanggal date NOT NULL,
  status text NOT NULL DEFAULT 'H',
  jam_masuk time,
  jam_pulang time,
  keterangan text,
  dicatat_oleh uuid REFERENCES public.pegawai(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(pegawai_id, tanggal)
);

CREATE INDEX IF NOT EXISTS idx_presensi_pegawai_dept ON public.presensi_pegawai(departemen_id);
CREATE INDEX IF NOT EXISTS idx_presensi_pegawai_tgl ON public.presensi_pegawai(tanggal);

-- 3. Validasi status: H=Hadir, I=Izin, S=Sakit, A=Alpha, C=Cuti
CREATE OR REPLACE FUNCTION public.validate_presensi_pegawai_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('H', 'I', 'S', 'A', 'C') THEN
    RAISE EXCEPTION 'status presensi pegawai harus H, I, S, A, atau C';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_presensi_pegawai_status
  BEFORE INSERT OR UPDATE ON public.presensi_pegawai
  FOR EACH ROW EXECUTE FUNCTION public.validate_presensi_pegawai_status();

-- 4. Enable RLS
ALTER TABLE public.presensi_pegawai ENABLE ROW LEVEL SECURITY;

-- Admin: full CRUD
CREATE POLICY "admin_presensi_pegawai_all" ON public.presensi_pegawai
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Kepala sekolah: full CRUD
CREATE POLICY "kepsek_presensi_pegawai_all" ON public.presensi_pegawai
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'kepala_sekolah'))
  WITH CHECK (public.has_role(auth.uid(), 'kepala_sekolah'));

-- Pegawai: hanya bisa SELECT presensi milik sendiri
CREATE POLICY "pegawai_own_presensi_select" ON public.presensi_pegawai
  FOR SELECT TO authenticated
  USING (public.is_own_pegawai(auth.uid(), pegawai_id));