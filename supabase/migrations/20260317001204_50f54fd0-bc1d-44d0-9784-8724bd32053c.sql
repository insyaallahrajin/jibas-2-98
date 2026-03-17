CREATE OR REPLACE FUNCTION public.get_tarif_siswa(p_jenis_id uuid, p_siswa_id uuid, p_kelas_id uuid DEFAULT NULL::uuid, p_tahun_ajaran_id uuid DEFAULT NULL::uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT nominal FROM tarif_tagihan 
     WHERE jenis_id = p_jenis_id AND siswa_id = p_siswa_id AND kelas_id = p_kelas_id AND tahun_ajaran_id = p_tahun_ajaran_id AND aktif = true
     LIMIT 1),
    (SELECT nominal FROM tarif_tagihan 
     WHERE jenis_id = p_jenis_id AND siswa_id = p_siswa_id AND kelas_id IS NULL AND tahun_ajaran_id = p_tahun_ajaran_id AND aktif = true
     LIMIT 1),
    (SELECT nominal FROM tarif_tagihan 
     WHERE jenis_id = p_jenis_id AND siswa_id = p_siswa_id AND kelas_id IS NULL AND tahun_ajaran_id IS NULL AND aktif = true
     LIMIT 1),
    (SELECT nominal FROM tarif_tagihan 
     WHERE jenis_id = p_jenis_id AND siswa_id IS NULL AND kelas_id = p_kelas_id AND tahun_ajaran_id = p_tahun_ajaran_id AND aktif = true
     LIMIT 1),
    (SELECT nominal FROM tarif_tagihan 
     WHERE jenis_id = p_jenis_id AND siswa_id IS NULL AND kelas_id = p_kelas_id AND tahun_ajaran_id IS NULL AND aktif = true
     LIMIT 1),
    (SELECT nominal FROM tarif_tagihan 
     WHERE jenis_id = p_jenis_id AND siswa_id IS NULL AND kelas_id IS NULL AND tahun_ajaran_id = p_tahun_ajaran_id AND aktif = true
     LIMIT 1)
  )
$function$;