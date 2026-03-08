
-- =============================================
-- HELPER SECURITY DEFINER FUNCTIONS
-- =============================================

-- Check if a guru teaches a specific class (via jadwal)
CREATE OR REPLACE FUNCTION public.guru_teaches_class(_user_id uuid, _kelas_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM jadwal j
    JOIN users_profile up ON up.pegawai_id = j.pegawai_id
    WHERE up.id = _user_id AND j.kelas_id = _kelas_id
  )
$$;

-- Check if a guru teaches a specific mapel
CREATE OR REPLACE FUNCTION public.guru_teaches_mapel(_user_id uuid, _mapel_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pegawai_mapel pm
    JOIN users_profile up ON up.pegawai_id = pm.pegawai_id
    WHERE up.id = _user_id AND pm.mapel_id = _mapel_id
  )
$$;

-- Check if a siswa record belongs to the current user
CREATE OR REPLACE FUNCTION public.is_own_siswa(_user_id uuid, _siswa_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users_profile WHERE id = _user_id AND siswa_id = _siswa_id
  )
$$;

-- Check if a pegawai record belongs to the current user
CREATE OR REPLACE FUNCTION public.is_own_pegawai(_user_id uuid, _pegawai_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users_profile WHERE id = _user_id AND pegawai_id = _pegawai_id
  )
$$;

-- Get siswa_id for current user
CREATE OR REPLACE FUNCTION public.get_my_siswa_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT siswa_id FROM users_profile WHERE id = _user_id
$$;

-- Get pegawai_id for current user
CREATE OR REPLACE FUNCTION public.get_my_pegawai_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pegawai_id FROM users_profile WHERE id = _user_id
$$;

-- =============================================
-- DROP OLD BASIC POLICIES
-- =============================================

-- siswa
DROP POLICY IF EXISTS "Admin manage siswa" ON siswa;
DROP POLICY IF EXISTS "Auth read siswa" ON siswa;

-- penilaian
DROP POLICY IF EXISTS "Admin guru manage penilaian" ON penilaian;
DROP POLICY IF EXISTS "Auth read penilaian" ON penilaian;

-- pembayaran
DROP POLICY IF EXISTS "Admin keuangan manage pembayaran" ON pembayaran;
DROP POLICY IF EXISTS "Auth read pembayaran" ON pembayaran;

-- pegawai
DROP POLICY IF EXISTS "Admin manage pegawai" ON pegawai;
DROP POLICY IF EXISTS "Auth read pegawai" ON pegawai;

-- presensi_siswa
DROP POLICY IF EXISTS "Admin guru manage presensi" ON presensi_siswa;
DROP POLICY IF EXISTS "Auth read presensi" ON presensi_siswa;

-- =============================================
-- SISWA TABLE POLICIES
-- =============================================

-- Admin: full CRUD
CREATE POLICY "admin_siswa_all" ON siswa FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Kepala Sekolah: SELECT all
CREATE POLICY "kepsek_siswa_select" ON siswa FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'kepala_sekolah'));

-- Guru: SELECT students in classes they teach
CREATE POLICY "guru_siswa_select" ON siswa FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'guru') AND EXISTS (
      SELECT 1 FROM kelas_siswa ks
      JOIN jadwal j ON j.kelas_id = ks.kelas_id
      JOIN users_profile up ON up.pegawai_id = j.pegawai_id
      WHERE up.id = auth.uid() AND ks.siswa_id = siswa.id AND ks.aktif = true
    )
  );

-- Siswa: SELECT own record only
CREATE POLICY "siswa_own_select" ON siswa FOR SELECT
  TO authenticated
  USING (is_own_siswa(auth.uid(), id));

-- =============================================
-- PENILAIAN TABLE POLICIES
-- =============================================

-- Admin: full CRUD
CREATE POLICY "admin_penilaian_all" ON penilaian FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Kepala Sekolah: SELECT all
CREATE POLICY "kepsek_penilaian_select" ON penilaian FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'kepala_sekolah'));

-- Guru: INSERT/UPDATE for subjects they teach
CREATE POLICY "guru_penilaian_insert" ON penilaian FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'guru') AND guru_teaches_mapel(auth.uid(), mapel_id)
  );

CREATE POLICY "guru_penilaian_update" ON penilaian FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'guru') AND guru_teaches_mapel(auth.uid(), mapel_id)
  )
  WITH CHECK (
    has_role(auth.uid(), 'guru') AND guru_teaches_mapel(auth.uid(), mapel_id)
  );

CREATE POLICY "guru_penilaian_select" ON penilaian FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'guru') AND guru_teaches_mapel(auth.uid(), mapel_id)
  );

-- Siswa: SELECT own grades only
CREATE POLICY "siswa_penilaian_select" ON penilaian FOR SELECT
  TO authenticated
  USING (is_own_siswa(auth.uid(), siswa_id));

-- =============================================
-- PEMBAYARAN TABLE POLICIES
-- =============================================

-- Admin: full CRUD
CREATE POLICY "admin_pembayaran_all" ON pembayaran FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Keuangan: full CRUD
CREATE POLICY "keuangan_pembayaran_all" ON pembayaran FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'keuangan'))
  WITH CHECK (has_role(auth.uid(), 'keuangan'));

-- Kepala Sekolah: SELECT all
CREATE POLICY "kepsek_pembayaran_select" ON pembayaran FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'kepala_sekolah'));

-- Siswa: SELECT own payment records
CREATE POLICY "siswa_pembayaran_select" ON pembayaran FOR SELECT
  TO authenticated
  USING (is_own_siswa(auth.uid(), siswa_id));

-- =============================================
-- PEGAWAI TABLE POLICIES
-- =============================================

-- Admin: full CRUD
CREATE POLICY "admin_pegawai_all" ON pegawai FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Kepala Sekolah: SELECT all, UPDATE own
CREATE POLICY "kepsek_pegawai_select" ON pegawai FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'kepala_sekolah'));

CREATE POLICY "kepsek_pegawai_update_own" ON pegawai FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'kepala_sekolah') AND is_own_pegawai(auth.uid(), id)
  )
  WITH CHECK (
    has_role(auth.uid(), 'kepala_sekolah') AND is_own_pegawai(auth.uid(), id)
  );

-- Guru: SELECT all (can see colleagues)
CREATE POLICY "guru_pegawai_select" ON pegawai FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'guru'));

-- =============================================
-- PRESENSI_SISWA TABLE POLICIES
-- =============================================

-- Admin: full CRUD
CREATE POLICY "admin_presensi_all" ON presensi_siswa FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Kepala Sekolah: SELECT all
CREATE POLICY "kepsek_presensi_select" ON presensi_siswa FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'kepala_sekolah'));

-- Guru: INSERT/UPDATE for classes they teach
CREATE POLICY "guru_presensi_insert" ON presensi_siswa FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'guru') AND guru_teaches_class(auth.uid(), kelas_id)
  );

CREATE POLICY "guru_presensi_update" ON presensi_siswa FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'guru') AND guru_teaches_class(auth.uid(), kelas_id)
  )
  WITH CHECK (
    has_role(auth.uid(), 'guru') AND guru_teaches_class(auth.uid(), kelas_id)
  );

CREATE POLICY "guru_presensi_select" ON presensi_siswa FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'guru') AND guru_teaches_class(auth.uid(), kelas_id)
  );

-- Siswa: SELECT own attendance
CREATE POLICY "siswa_presensi_select" ON presensi_siswa FOR SELECT
  TO authenticated
  USING (is_own_siswa(auth.uid(), siswa_id));
