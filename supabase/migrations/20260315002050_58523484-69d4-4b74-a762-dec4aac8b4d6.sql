-- Insert akun liabilitas baru: Titipan Tabungan Siswa
INSERT INTO akun_rekening (kode, nama, jenis, saldo_normal, saldo_awal, aktif, keterangan)
VALUES ('2-1003', 'Titipan Tabungan Siswa', 'liabilitas', 'kredit', 0, true, 'Akun dana titipan tabungan siswa');

-- Insert pengaturan akun: Piutang Siswa (default ke akun Piutang SPP 1-1003)
INSERT INTO pengaturan_akun (kode_setting, label, keterangan, akun_id)
VALUES (
  'piutang_siswa',
  'Akun Piutang Siswa',
  'Akun untuk mencatat tagihan siswa yang belum dibayar (sisi debit saat tagihan dibuat)',
  (SELECT id FROM akun_rekening WHERE kode = '1-1003' LIMIT 1)
);

-- Insert pengaturan akun: Tabungan Siswa (default ke akun baru 2-1003)
INSERT INTO pengaturan_akun (kode_setting, label, keterangan, akun_id)
VALUES (
  'tabungan_siswa',
  'Akun Tabungan/Titipan Siswa',
  'Akun liabilitas untuk dana titipan tabungan siswa',
  (SELECT id FROM akun_rekening WHERE kode = '2-1003' LIMIT 1)
);