import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, BookOpen, Calendar, ClipboardList } from "lucide-react";

const subModules = [
  { title: "Data Siswa", desc: "Kelola data siswa dan orang tua", icon: GraduationCap },
  { title: "Mata Pelajaran", desc: "Daftar mata pelajaran dan kurikulum", icon: BookOpen },
  { title: "Jadwal Pelajaran", desc: "Atur jadwal kelas dan guru", icon: Calendar },
  { title: "Penilaian & Rapor", desc: "Input nilai dan cetak rapor", icon: ClipboardList },
];

export default function Akademik() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Akademik</h1>
        <p className="text-sm text-muted-foreground">Manajemen data akademik sekolah</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="siswa">Data Siswa</TabsTrigger>
          <TabsTrigger value="mapel">Mata Pelajaran</TabsTrigger>
          <TabsTrigger value="jadwal">Jadwal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {subModules.map((m) => (
              <Card key={m.title} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{m.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="siswa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Siswa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Modul data siswa akan tersedia setelah database terhubung.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapel" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mata Pelajaran</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Modul mata pelajaran akan tersedia setelah database terhubung.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jadwal" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Pelajaran</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Modul jadwal akan tersedia setelah database terhubung.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
