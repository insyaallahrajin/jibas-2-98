-- Fix view v_tagihan_belum_bayar: tipe 'sekali' should only show bulan=0, not 1-12
CREATE OR REPLACE VIEW public.v_tagihan_belum_bayar
WITH (security_invoker=on) AS
SELECT s.id AS siswa_id,
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
    CASE WHEN (p.id IS NOT NULL) THEN true ELSE false END AS sudah_bayar,
    p.id AS pembayaran_id,
    p.tanggal_bayar
FROM siswa s
  JOIN kelas_siswa ks ON ks.siswa_id = s.id AND ks.aktif = true
  JOIN kelas k ON k.id = ks.kelas_id
  JOIN departemen d ON d.id = k.departemen_id
  JOIN jenis_pembayaran jp ON jp.departemen_id = d.id AND jp.aktif = true
  JOIN tahun_ajaran ta ON ta.aktif = true
  CROSS JOIN LATERAL (
    SELECT b.bulan FROM generate_series(
      CASE WHEN jp.tipe = 'sekali' THEN 0 ELSE 1 END,
      CASE WHEN jp.tipe = 'sekali' THEN 0 ELSE 12 END
    ) AS b(bulan)
  ) bulan_series
  LEFT JOIN pembayaran p ON p.siswa_id = s.id AND p.jenis_id = jp.id AND p.bulan = bulan_series.bulan AND p.tahun_ajaran_id = ta.id
WHERE s.status = 'aktif'
  AND (
    (jp.tipe = 'sekali') OR 
    (bulan_series.bulan <= EXTRACT(month FROM CURRENT_DATE)::int)
  );

-- Add ortu RLS policy for presensi_siswa
CREATE POLICY "ortu_presensi_siswa_select"
ON public.presensi_siswa
FOR SELECT
TO authenticated
USING (is_ortu_of(auth.uid(), siswa_id));

-- Add ortu RLS policy for penilaian
CREATE POLICY "ortu_penilaian_select"
ON public.penilaian
FOR SELECT
TO authenticated
USING (is_ortu_of(auth.uid(), siswa_id));

-- Add ortu RLS policy for presensi_kbm
CREATE POLICY "ortu_presensi_kbm_select"
ON public.presensi_kbm
FOR SELECT
TO authenticated
USING (is_ortu_of(auth.uid(), siswa_id));

-- Add ortu RLS policy for nilai_kd (for CBE module)
CREATE POLICY "ortu_nilai_kd_select"
ON public.nilai_kd
FOR SELECT
TO authenticated
USING (is_ortu_of(auth.uid(), siswa_id));

-- Add ortu RLS policy for komentar_rapor
CREATE POLICY "ortu_komentar_rapor_select"
ON public.komentar_rapor
FOR SELECT
TO authenticated
USING (is_ortu_of(auth.uid(), siswa_id));
