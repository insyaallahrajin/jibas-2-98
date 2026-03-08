
-- Akun Rekening (Chart of Accounts)
CREATE TABLE public.akun_rekening (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text NOT NULL UNIQUE,
  nama text NOT NULL,
  jenis text NOT NULL,
  saldo_normal text NOT NULL,
  saldo_awal numeric(15,2) DEFAULT 0,
  keterangan text,
  aktif boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Header Jurnal Umum
CREATE TABLE public.jurnal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor text UNIQUE,
  tanggal date NOT NULL,
  keterangan text NOT NULL,
  referensi text,
  total_debit numeric(15,2) DEFAULT 0,
  total_kredit numeric(15,2) DEFAULT 0,
  status text DEFAULT 'draft',
  dibuat_oleh uuid REFERENCES public.pegawai(id),
  created_at timestamptz DEFAULT now()
);

-- Detail/Baris Jurnal
CREATE TABLE public.jurnal_detail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurnal_id uuid REFERENCES public.jurnal(id) ON DELETE CASCADE,
  akun_id uuid REFERENCES public.akun_rekening(id),
  keterangan text,
  debit numeric(15,2) DEFAULT 0,
  kredit numeric(15,2) DEFAULT 0,
  urutan int DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.akun_rekening ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_detail ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "auth_read_akun" ON public.akun_rekening
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_keuangan_manage_akun" ON public.akun_rekening
  FOR ALL TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'))
  WITH CHECK (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'));

CREATE POLICY "admin_keuangan_read_jurnal" ON public.jurnal
  FOR SELECT TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'));

CREATE POLICY "admin_keuangan_manage_jurnal" ON public.jurnal
  FOR ALL TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'))
  WITH CHECK (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'));

CREATE POLICY "admin_keuangan_read_jurnal_detail" ON public.jurnal_detail
  FOR SELECT TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'));

CREATE POLICY "admin_keuangan_manage_jurnal_detail" ON public.jurnal_detail
  FOR ALL TO authenticated
  USING (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'))
  WITH CHECK (public.is_admin_or_kepala(auth.uid()) OR public.has_role(auth.uid(), 'keuangan'));

-- Seed data akun rekening standar sekolah
INSERT INTO public.akun_rekening (kode, nama, jenis, saldo_normal) VALUES
  ('1-1001', 'Kas Tunai', 'aset', 'debit'),
  ('1-1002', 'Kas Bank', 'aset', 'debit'),
  ('1-1003', 'Piutang SPP', 'aset', 'debit'),
  ('1-1004', 'Perlengkapan Kantor', 'aset', 'debit'),
  ('1-2001', 'Peralatan Sekolah', 'aset', 'debit'),
  ('2-1001', 'Utang Usaha', 'liabilitas', 'kredit'),
  ('2-1002', 'Utang Gaji', 'liabilitas', 'kredit'),
  ('3-1001', 'Modal Yayasan', 'ekuitas', 'kredit'),
  ('3-1002', 'Saldo Tahun Lalu', 'ekuitas', 'kredit'),
  ('4-1001', 'Pendapatan SPP', 'pendapatan', 'kredit'),
  ('4-1002', 'Pendapatan Uang Pangkal', 'pendapatan', 'kredit'),
  ('4-1003', 'Pendapatan Kegiatan', 'pendapatan', 'kredit'),
  ('4-1004', 'Pendapatan Lainnya', 'pendapatan', 'kredit'),
  ('5-1001', 'Beban Gaji Guru', 'beban', 'debit'),
  ('5-1002', 'Beban Gaji Staf', 'beban', 'debit'),
  ('5-1003', 'Beban Listrik & Air', 'beban', 'debit'),
  ('5-1004', 'Beban ATK', 'beban', 'debit'),
  ('5-1005', 'Beban Pemeliharaan', 'beban', 'debit'),
  ('5-1006', 'Beban Kegiatan Siswa', 'beban', 'debit'),
  ('5-1007', 'Beban Lainnya', 'beban', 'debit');
