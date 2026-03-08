
-- =============================================
-- ADD LEMBAGA (departemen_id) TO FINANCIAL TABLES
-- =============================================

-- 1. Tambah departemen_id ke jenis_pembayaran
ALTER TABLE public.jenis_pembayaran
  ADD COLUMN IF NOT EXISTS departemen_id uuid REFERENCES public.departemen(id) ON DELETE SET NULL;

-- 2. Tambah departemen_id ke pembayaran
ALTER TABLE public.pembayaran
  ADD COLUMN IF NOT EXISTS departemen_id uuid REFERENCES public.departemen(id) ON DELETE SET NULL;

-- 3. Tambah departemen_id ke jenis_pengeluaran
ALTER TABLE public.jenis_pengeluaran
  ADD COLUMN IF NOT EXISTS departemen_id uuid REFERENCES public.departemen(id) ON DELETE SET NULL;

-- 4. Tambah departemen_id ke pengeluaran
ALTER TABLE public.pengeluaran
  ADD COLUMN IF NOT EXISTS departemen_id uuid REFERENCES public.departemen(id) ON DELETE SET NULL;

-- 5. Tambah departemen_id ke jurnal
ALTER TABLE public.jurnal
  ADD COLUMN IF NOT EXISTS departemen_id uuid REFERENCES public.departemen(id) ON DELETE SET NULL;

-- 6. Tambah departemen_id ke akun_rekening
ALTER TABLE public.akun_rekening
  ADD COLUMN IF NOT EXISTS departemen_id uuid REFERENCES public.departemen(id) ON DELETE SET NULL;

-- 7. Tambah departemen_id ke users_profile
ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS departemen_id uuid REFERENCES public.departemen(id) ON DELETE SET NULL;

-- 8. Seed data departemen jika belum ada
INSERT INTO public.departemen (nama, kode, keterangan, aktif)
SELECT nama, kode, keterangan, true
FROM (VALUES
  ('TK', 'TK', 'Taman Kanak-Kanak'),
  ('SD', 'SD', 'Sekolah Dasar'),
  ('SMP', 'SMP', 'Sekolah Menengah Pertama'),
  ('SMA', 'SMA', 'Sekolah Menengah Atas'),
  ('MTQ', 'MTQ', 'Madrasah / Tahfidz Al-Quran')
) AS v(nama, kode, keterangan)
WHERE NOT EXISTS (
  SELECT 1 FROM public.departemen WHERE kode = v.kode
);

-- 9. Buat index untuk performa query filter per lembaga
CREATE INDEX IF NOT EXISTS idx_pembayaran_departemen ON public.pembayaran(departemen_id);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_departemen ON public.pengeluaran(departemen_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_departemen ON public.jurnal(departemen_id);
CREATE INDEX IF NOT EXISTS idx_jenis_pembayaran_departemen ON public.jenis_pembayaran(departemen_id);

-- 10. Buat VIEW konsolidasi keuangan per lembaga
CREATE OR REPLACE VIEW public.v_rekap_keuangan_lembaga AS
SELECT
  d.id AS departemen_id,
  d.nama AS lembaga,
  d.kode,
  COALESCE(SUM(p.jumlah), 0) AS total_pembayaran,
  EXTRACT(YEAR FROM CURRENT_DATE)::int AS tahun
FROM public.departemen d
LEFT JOIN public.pembayaran p ON p.departemen_id = d.id
  AND EXTRACT(YEAR FROM p.tanggal_bayar) = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE d.aktif = true
GROUP BY d.id, d.nama, d.kode;
