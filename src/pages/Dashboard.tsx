import { Users, GraduationCap, Wallet, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const stats = [
  { label: "Total Siswa", value: "1.245", icon: GraduationCap, change: "+12" },
  { label: "Total Guru", value: "86", icon: Users, change: "+2" },
  { label: "Pembayaran Bulan Ini", value: "Rp 245jt", icon: Wallet, change: "+8%" },
  { label: "Buku Perpustakaan", value: "12.450", icon: BookOpen, change: "+150" },
];

const attendanceData = [
  { hari: "Sen", hadir: 1180, izin: 35, alpa: 30 },
  { hari: "Sel", hadir: 1200, izin: 25, alpa: 20 },
  { hari: "Rab", hadir: 1150, izin: 50, alpa: 45 },
  { hari: "Kam", hadir: 1190, izin: 30, alpa: 25 },
  { hari: "Jum", hadir: 1170, izin: 40, alpa: 35 },
];

const genderData = [
  { name: "Laki-laki", value: 620 },
  { name: "Perempuan", value: 625 },
];

const COLORS = ["hsl(210, 80%, 30%)", "hsl(38, 92%, 50%)"];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang di JIBAS — Ringkasan informasi sekolah
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="stat-card">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                  <p className="text-xs text-success mt-1">{s.change}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kehadiran Siswa Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,90%)" />
                <XAxis dataKey="hari" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="hadir" fill="hsl(210,80%,30%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="izin" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alpa" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Komposisi Siswa</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={2}
                >
                  {genderData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {genderData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[i] }}
                  />
                  <span className="text-muted-foreground">
                    {d.name}: {d.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
