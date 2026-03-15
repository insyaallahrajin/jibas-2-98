

## Perbaikan: Pesan Alert Dinamis + Kelas Bergantung pada Lembaga

### Masalah
1. Pesan alert statis "untuk semua siswa aktif" padahal sudah ada filter siswa/kelas/lembaga
2. Dropdown Kelas pada form tarif tidak difilter berdasarkan Lembaga — user bisa pilih kelas dari lembaga lain

### Rencana

**File: `src/pages/keuangan/TabTarifTagihan.tsx`**

**1. Tambah state `deptId` untuk form tarif** (bukan hanya `genDeptId` untuk generate)
- Tambah dropdown Lembaga **sebelum** dropdown Kelas di form tarif
- Filter `kelasList` berdasarkan `departemen_id` yang dipilih
- Reset `kelasId` saat lembaga berubah

**2. Pesan alert dinamis** (baris 353)
- Jika `siswaId` dipilih: "untuk **siswa [nama]**"
- Jika `kelasId` dipilih: "untuk **siswa di kelas [nama]**"  
- Jika `genDeptId` dipilih: "untuk **siswa di lembaga [kode]**"
- Default: "untuk **semua siswa aktif di tahun ajaran terpilih**"
- Selalu tambahkan: "Siswa yang sudah punya tagihan akan di-skip."

**3. Pada bagian generate, pindah dropdown Lembaga ke atas dan filter kelas form juga berdasarkan lembaga yang sama**
- Dropdown Kelas di form (baris 306-313): filter `kelasList` by selected lembaga/departemen
- Reset kelasId ketika lembaga berubah

