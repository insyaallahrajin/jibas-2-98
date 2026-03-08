
-- Fix search_path for validation functions
ALTER FUNCTION public.validate_pegawai_jk() SET search_path = public;
ALTER FUNCTION public.validate_siswa_jk() SET search_path = public;
ALTER FUNCTION public.validate_presensi_status() SET search_path = public;
ALTER FUNCTION public.validate_user_role() SET search_path = public;
