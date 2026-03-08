import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, namaBulan } from "@/hooks/useKeuangan";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TabArusKas({ departemenId }: { departemenId?: string }) {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const endM = bulan === 12 ? 1 : bulan + 1;
  const endY = bulan === 12 ? tahun + 1 : tahun;
  const endDate = `${endY}-${String(endM).padStart(2, "0")}-01`;

  const { data: pembayaranData, isLoading: l1 } = useQuery({
    queryKey: ["arus_kas_pembayaran", bulan, tahun, departemenId],
    queryFn: async () => {
      let q = supabase
        .from("pembayaran")
        .select("jumlah")
        .gte("tanggal_bayar", startDate)
        .lt("tanggal_bayar", endDate);
      if (departemenId) q = q.eq("departemen_id", departemenId);
      const { data, error } = await q;
      if (error) throw error;
      return data?.reduce((s, r) => s + Number(r.jumlah || 0), 0) || 0;
    },
  });

  const { data: pengeluaranData, isLoading: l2 } = useQuery({
    queryKey: ["arus_kas_pengeluaran", bulan, tahun, departemenId],
    queryFn: async () => {
      let q = supabase
        .from("pengeluaran" as any)
        .select("jumlah")
        .gte("tanggal", startDate)
        .lt("tanggal", endDate);
      if (departemenId) q = (q as any).eq("departemen_id", departemenId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any[])?.reduce((s: number, r: any) => s + Number(r.jumlah || 0), 0) || 0;
    },
  });

  const { data: tabunganData, isLoading: l3 } = useQuery({
    queryKey: ["arus_kas_tabungan", bulan, tahun],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaksi_tabungan" as any)
        .select("jenis, jumlah")
        .gte("tanggal", startDate)
        .lt("tanggal", endDate);
      if (error) throw error;
      let setor = 0, ambil = 0;
      (data as any[])?.forEach((r: any) => {
        if (r.jenis === "setor") setor += Number(r.jumlah || 0);
        else ambil += Number(r.jumlah || 0);
      });
      return { setor, ambil };
    },
  });

  const isLoading = l1 || l2 || l3;
  const totalPembayaran = pembayaranData || 0;
  const totalPengeluaran = pengeluaranData || 0;
  const setor = tabunganData?.setor || 0;
  const ambil = tabunganData?.ambil || 0;

  const totalMasuk = totalPembayaran + setor;
  const totalKeluar = totalPengeluaran + ambil;
  const arusBersih = totalMasuk - totalKeluar;

  const chartData = [
    { name: "Kas Masuk", value: totalMasuk, fill: "hsl(var(--success))" },
    { name: "Kas Keluar", value: totalKeluar, fill: "hsl(var(--destructive))" },
  ];

  return (
    <div className="space-y-4 pt-4">
      <div className="flex gap-3 items-end">
        <div>
          <Label>Bulan</Label>
          <Select value={String(bulan)} onValueChange={(v) => setBulan(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{namaBulan(i + 1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tahun</Label>
          <Input type="number" className="w-24" value={tahun} onChange={(e) => setTahun(Number(e.target.value))} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">LAPORAN ARUS KAS</h2>
                <p className="text-sm text-muted-foreground">Periode: {namaBulan(bulan)} {tahun}</p>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-2">KAS MASUK (Aktivitas Operasional)</h3>
                <div className="flex justify-between py-1 pl-4 text-sm">
                  <span>Penerimaan SPP/Pembayaran</span>
                  <span className="font-medium">{formatRupiah(totalPembayaran)}</span>
                </div>
                <div className="flex justify-between py-1 pl-4 text-sm">
                  <span>Setoran Tabungan Siswa</span>
                  <span className="font-medium">{formatRupiah(setor)}</span>
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Total Kas Masuk</span>
                  <span className="text-success">{formatRupiah(totalMasuk)}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-2">KAS KELUAR</h3>
                <div className="flex justify-between py-1 pl-4 text-sm">
                  <span>Pengeluaran Operasional</span>
                  <span className="font-medium">{formatRupiah(totalPengeluaran)}</span>
                </div>
                <div className="flex justify-between py-1 pl-4 text-sm">
                  <span>Penarikan Tabungan Siswa</span>
                  <span className="font-medium">{formatRupiah(ambil)}</span>
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Total Kas Keluar</span>
                  <span className="text-destructive">{formatRupiah(totalKeluar)}</span>
                </div>
              </div>

              <div className="border-t-2 border-double pt-3 flex justify-between font-bold text-lg">
                <span>ARUS KAS BERSIH</span>
                <span className={arusBersih >= 0 ? "text-success" : "text-destructive"}>
                  {formatRupiah(arusBersih)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`} />
                  <Tooltip formatter={(v: number) => formatRupiah(v)} />
                  <Bar dataKey="value" name="Jumlah" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
