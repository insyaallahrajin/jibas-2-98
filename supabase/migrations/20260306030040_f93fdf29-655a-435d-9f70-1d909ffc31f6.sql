-- Fix SECURITY DEFINER view warning by setting SECURITY INVOKER
ALTER VIEW public.v_rekap_keuangan_lembaga SET (security_invoker = on);