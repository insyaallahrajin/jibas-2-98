import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonitorPlay, FileText, Clock, CheckCircle } from "lucide-react";

const stats = [
  { label: "Ujian Aktif", value: "3", icon: MonitorPlay },
  { label: "Bank Soal", value: "1.250", icon: FileText },
  { label: "Terjadwal", value: "5", icon: Clock },
  { label: "Selesai", value: "42", icon: CheckCircle },
];

export default function CBE() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CBE</h1>
        <p className="text-sm text-muted-foreground">Computer-Based Examination — Ujian berbasis komputer</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="stat-card">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manajemen Ujian</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Modul ujian online akan tersedia setelah database terhubung.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
