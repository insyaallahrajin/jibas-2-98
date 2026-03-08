
-- =============================================
-- STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars-siswa', 'avatars-siswa', false),
  ('avatars-pegawai', 'avatars-pegawai', false),
  ('logos-sekolah', 'logos-sekolah', true),
  ('dokumen-buletin', 'dokumen-buletin', false),
  ('soal-cbe', 'soal-cbe', false),
  ('covers-buku', 'covers-buku', true),
  ('elearning', 'elearning', false);

-- =============================================
-- STORAGE RLS POLICIES
-- =============================================

-- avatars-siswa: admin can manage, siswa can upload own
CREATE POLICY "admin_avatars_siswa_all" ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars-siswa' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'avatars-siswa' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "auth_avatars_siswa_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars-siswa');

-- avatars-pegawai: admin can manage, pegawai can upload own
CREATE POLICY "admin_avatars_pegawai_all" ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars-pegawai' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'avatars-pegawai' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "auth_avatars_pegawai_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars-pegawai');

-- logos-sekolah: public read, admin manage
CREATE POLICY "public_logos_select" ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'logos-sekolah');

CREATE POLICY "admin_logos_manage" ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'logos-sekolah' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'logos-sekolah' AND has_role(auth.uid(), 'admin'));

-- dokumen-buletin: admin manage, auth read
CREATE POLICY "admin_buletin_manage" ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'dokumen-buletin' AND is_admin_or_kepala(auth.uid()))
  WITH CHECK (bucket_id = 'dokumen-buletin' AND is_admin_or_kepala(auth.uid()));

CREATE POLICY "auth_buletin_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'dokumen-buletin');

-- soal-cbe: admin/guru manage, siswa read during exam
CREATE POLICY "admin_guru_soal_manage" ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'soal-cbe' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'guru')))
  WITH CHECK (bucket_id = 'soal-cbe' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'guru')));

CREATE POLICY "auth_soal_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'soal-cbe');

-- covers-buku: public read, admin/pustakawan manage
CREATE POLICY "public_covers_select" ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'covers-buku');

CREATE POLICY "admin_pustakawan_covers_manage" ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'covers-buku' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pustakawan')))
  WITH CHECK (bucket_id = 'covers-buku' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pustakawan')));

-- elearning: admin/guru manage, auth read
CREATE POLICY "admin_guru_elearning_manage" ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'elearning' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'guru')))
  WITH CHECK (bucket_id = 'elearning' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'guru')));

CREATE POLICY "auth_elearning_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'elearning');
