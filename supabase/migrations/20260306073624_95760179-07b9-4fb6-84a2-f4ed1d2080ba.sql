
-- Fix search_path on functions
CREATE OR REPLACE FUNCTION public.validate_user_role()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.role IS NOT NULL AND NEW.role NOT IN (
    'admin','kepala_sekolah','guru','keuangan','kasir','pustakawan','siswa','ortu'
  ) THEN
    RAISE EXCEPTION 'role tidak valid: %', NEW.role;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Fix security definer view by using security_invoker
ALTER VIEW public.v_tagihan_belum_bayar SET (security_invoker = on);
