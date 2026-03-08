
-- Tabel untuk menyimpan transaksi dari Midtrans
CREATE TABLE public.transaksi_midtrans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  payment_type text,
  total_amount numeric NOT NULL DEFAULT 0,
  siswa_id uuid REFERENCES public.siswa(id),
  items jsonb,
  jurnal_id uuid REFERENCES public.jurnal(id),
  midtrans_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.transaksi_midtrans ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "admin_keuangan_manage_transaksi_midtrans" ON public.transaksi_midtrans
  FOR ALL TO authenticated
  USING (is_admin_or_kepala(auth.uid()) OR has_role(auth.uid(), 'keuangan'))
  WITH CHECK (is_admin_or_kepala(auth.uid()) OR has_role(auth.uid(), 'keuangan'));

CREATE POLICY "siswa_own_transaksi_midtrans" ON public.transaksi_midtrans
  FOR SELECT TO authenticated
  USING (is_own_siswa(auth.uid(), siswa_id));
