import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const announcements = [
  {
    title: "Ujian Akhir Semester Genap 2025/2026",
    date: "28 Feb 2026",
    category: "Akademik",
    excerpt: "Ujian akhir semester genap akan dilaksanakan mulai tanggal 10-20 Maret 2026.",
  },
  {
    title: "Pembayaran SPP Bulan Maret",
    date: "25 Feb 2026",
    category: "Keuangan",
    excerpt: "Batas akhir pembayaran SPP bulan Maret adalah tanggal 10 Maret 2026.",
  },
  {
    title: "Pelatihan Guru Kurikulum Merdeka",
    date: "20 Feb 2026",
    category: "Kepegawaian",
    excerpt: "Pelatihan implementasi Kurikulum Merdeka untuk seluruh guru akan dilaksanakan pada 5 Maret 2026.",
  },
  {
    title: "Lomba Cerdas Cermat Antar Kelas",
    date: "18 Feb 2026",
    category: "Kegiatan",
    excerpt: "Pendaftaran lomba cerdas cermat dibuka hingga 28 Februari 2026.",
  },
];

export default function Buletin() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Buletin</h1>
        <p className="text-sm text-muted-foreground">Pengumuman dan informasi sekolah</p>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {a.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{a.date}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{a.excerpt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
