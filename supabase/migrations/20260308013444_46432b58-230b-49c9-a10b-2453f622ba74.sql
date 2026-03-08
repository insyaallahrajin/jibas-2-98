-- RLS policy: ortu can read pembayaran of their children
CREATE POLICY "ortu_pembayaran_select" ON public.pembayaran
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ortu_siswa os
      WHERE os.user_id = auth.uid() AND os.siswa_id = pembayaran.siswa_id
    )
  );