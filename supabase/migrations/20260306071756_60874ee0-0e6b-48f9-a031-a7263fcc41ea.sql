
-- 1. Tambah kolom akun ke jenis_pembayaran
ALTER TABLE public.jenis_pembayaran
  ADD COLUMN IF NOT EXISTS akun_pendapatan_id uuid
    REFERENCES public.akun_rekening(id) ON DELETE SET NULL;

-- 2. Tambah kolom akun ke jenis_pengeluaran
ALTER TABLE public.jenis_pengeluaran
  ADD COLUMN IF NOT EXISTS akun_beban_id uuid
    REFERENCES public.akun_rekening(id) ON DELETE SET NULL;

-- 3. Tabel pengaturan akun sistem
CREATE TABLE IF NOT EXISTS public.pengaturan_akun (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_setting text NOT NULL UNIQUE,
  akun_id uuid REFERENCES public.akun_rekening(id) ON DELETE SET NULL,
  label text NOT NULL,
  keterangan text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.pengaturan_akun (kode_setting, label, keterangan)
VALUES
  ('kas_tunai', 'Akun Kas Tunai',
   'Akun yang di-debit saat menerima pembayaran tunai/manual (Kasir)'),
  ('bank_midtrans', 'Akun Bank Online Payment',
   'Akun yang di-debit saat pembayaran online via Midtrans berhasil'),
  ('kas_pengeluaran', 'Akun Kas Pengeluaran',
   'Akun yang di-kredit saat ada pengeluaran')
ON CONFLICT (kode_setting) DO NOTHING;

-- 4. Tambah kolom referensi jurnal ke pembayaran & pengeluaran
ALTER TABLE public.pembayaran
  ADD COLUMN IF NOT EXISTS jurnal_id uuid
    REFERENCES public.jurnal(id) ON DELETE SET NULL;

ALTER TABLE public.pengeluaran
  ADD COLUMN IF NOT EXISTS jurnal_id uuid
    REFERENCES public.jurnal(id) ON DELETE SET NULL;

-- 5. RLS untuk pengaturan_akun
ALTER TABLE public.pengaturan_akun ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read pengaturan_akun"
  ON public.pengaturan_akun FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage pengaturan_akun"
  ON public.pengaturan_akun FOR ALL TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()))
  WITH CHECK (public.is_admin_or_kepala(auth.uid()));

-- 6. Function: generate nomor jurnal otomatis
CREATE OR REPLACE FUNCTION public.generate_nomor_jurnal(p_prefix text, p_tahun int)
RETURNS text LANGUAGE plpgsql AS $$
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
