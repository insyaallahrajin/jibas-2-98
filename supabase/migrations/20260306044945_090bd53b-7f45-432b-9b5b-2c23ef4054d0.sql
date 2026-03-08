CREATE OR REPLACE FUNCTION public.validate_presensi_pegawai_status()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('H', 'I', 'S', 'A', 'C') THEN
    RAISE EXCEPTION 'status presensi pegawai harus H, I, S, A, atau C';
  END IF;
  RETURN NEW;
END; $$;