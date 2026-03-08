
CREATE OR REPLACE FUNCTION public.generate_nomor_jurnal(p_prefix text, p_tahun int)
RETURNS text LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_prefix text := p_prefix || '-' || p_tahun || '-';
  v_last   text;
  v_num    int := 1;
BEGIN
  SELECT nomor INTO v_last
  FROM public.jurnal
  WHERE nomor LIKE v_prefix || '%'
  ORDER BY nomor DESC LIMIT 1;

  IF v_last IS NOT NULL THEN
    v_num := CAST(RIGHT(v_last, 3) AS int) + 1;
  END IF;

  RETURN v_prefix || LPAD(v_num::text, 3, '0');
END; $$;
