
-- Fix: Set view to SECURITY INVOKER so RLS of querying user applies
ALTER VIEW public.v_rekap_keuangan_lembaga SET (security_invoker = on);
