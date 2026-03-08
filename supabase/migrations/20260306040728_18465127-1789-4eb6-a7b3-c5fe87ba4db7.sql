
-- 1. Update validate_user_role to accept 'kasir'
CREATE OR REPLACE FUNCTION public.validate_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IS NOT NULL AND NEW.role NOT IN (
    'admin', 'kepala_sekolah', 'guru', 'keuangan', 'siswa', 'pustakawan', 'kasir'
  ) THEN
    RAISE EXCEPTION 'role tidak valid';
  END IF;
  RETURN NEW;
END; $$;

-- 2. RLS: kasir can SELECT pembayaran
CREATE POLICY "kasir_read_pembayaran" ON public.pembayaran
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'kasir'));

-- 3. RLS: kasir can INSERT pembayaran
CREATE POLICY "kasir_insert_pembayaran" ON public.pembayaran
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'kasir'));
