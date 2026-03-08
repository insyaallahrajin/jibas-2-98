import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/shared/ExportButton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/hooks/useKeuangan";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface AkunNeraca {
  kode: string;
  nama: string;
  jenis: string;
  saldo: number;
}

export default function TabNeracaAkuntansi() {
  const [tanggal, setTanggal] = useState<Date>(new Date());
  const tanggalStr = format(tanggal, "yyyy-MM-dd");

  const { data: akunList } = useQuery({
    queryKey: ["akun_rekening_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("akun_rekening")
        .select("id, kode, nama, jenis, saldo_normal, saldo_awal")
        .eq("aktif", true)
        .order("kode");
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["neraca_akuntansi", tanggalStr],
    enabled: !!akunList,
    queryFn: async () => {
      const { data: details, error } = await supabase
        .from("jurnal_detail")
        .select("debit, kredit, akun_id, jurnal:jurnal_id!inner(tanggal, status)")
        .eq("jurnal.status", "posted")
        .lte("jurnal.tanggal", tanggalStr);
      if (error) throw error;

      const mutasiMap = new Map<string, { debit: number; kredit: number }>();
      (details as any[])?.forEach((row: any) => {
        const id = row.akun_id;
        if (!id) return;
        if (!mutasiMap.has(id)) mutasiMap.set(id, { debit: 0, kredit: 0 });
        const m = mutasiMap.get(id)!;
        m.debit += Number(row.debit || 0);
        m.kredit += Number(row.kredit || 0);
      });

      const result: AkunNeraca[] = [];
      akunList?.forEach((akun) => {
        if (!["aset", "liabilitas", "ekuitas"].includes(akun.jenis)) return;
        const mutasi = mutasiMap.get(akun.id) || { debit: 0, kredit: 0 };
        let saldo = Number(akun.saldo_awal || 0);
        if (akun.saldo_normal === "debit") {
          saldo += mutasi.debit - mutasi.kredit;
        } else {
          saldo += mutasi.kredit - mutasi.debit;
        }
        result.push({ kode: akun.kode, nama: akun.nama, jenis: akun.jenis, saldo });
      });
      return result.sort((a, b) => a.kode.localeCompare(b.kode));
    },
  });

  const aset = data?.filter((a) => a.jenis === "aset") || [];
  const liabilitas = data?.filter((a) => a.jenis === "liabilitas") || [];
  const ekuitas = data?.filter((a) => a.jenis === "ekuitas") || [];
  const totalAset = aset.reduce((s, a) => s + a.saldo, 0);
  const totalLiabilitas = liabilitas.reduce((s, a) => s + a.saldo, 0);
  const totalEkuitas = ekuitas.reduce((s, a) => s + a.saldo, 0);
  const totalLE = totalLiabilitas + totalEkuitas;
  const seimbang = Math.abs(totalAset - totalLE) < 1;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex gap-3 items-end justify-between">
        <div>
          <Label>Per Tanggal</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !tanggal && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(tanggal, "dd MMMM yyyy", { locale: idLocale })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={tanggal} onSelect={(d) => d && setTanggal(d)} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <ExportButton
          data={(data || []) as any}
          filename={`neraca-${tanggalStr}`}
          columns={[
            { key: "kode", label: "Kode" },
            { key: "nama", label: "Nama Akun" },
            { key: "jenis", label: "Jenis" },
            { key: "saldo", label: "Saldo" },
          ]}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">NERACA</h2>
                <p className="text-sm text-muted-foreground">Per Tanggal: {format(tanggal, "dd MMMM yyyy", { locale: idLocale })}</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Kiri: Aset */}
                <div>
                  <h3 className="font-semibold mb-2">ASET</h3>
                  {aset.map((a) => (
                    <div key={a.kode} className="flex justify-between py-1 pl-4 text-sm">
                      <span>{a.kode} {a.nama}</span>
                      <span className="font-medium">{formatRupiah(a.saldo)}</span>
                    </div>
                  ))}
                  {aset.length === 0 && <p className="text-sm text-muted-foreground pl-4">Tidak ada data</p>}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>Total Aset</span><span>{formatRupiah(totalAset)}</span>
                  </div>
                  <div className="border-t-2 border-double mt-4 pt-2 flex justify-between font-bold text-base">
                    <span>TOTAL ASET</span><span>{formatRupiah(totalAset)}</span>
                  </div>
                </div>

                {/* Kanan: Liabilitas + Ekuitas */}
                <div>
                  <h3 className="font-semibold mb-2">LIABILITAS</h3>
                  {liabilitas.map((a) => (
                    <div key={a.kode} className="flex justify-between py-1 pl-4 text-sm">
                      <span>{a.kode} {a.nama}</span>
                      <span className="font-medium">{formatRupiah(a.saldo)}</span>
                    </div>
                  ))}
                  {liabilitas.length === 0 && <p className="text-sm text-muted-foreground pl-4">Tidak ada data</p>}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>Total Liabilitas</span><span>{formatRupiah(totalLiabilitas)}</span>
                  </div>

                  <h3 className="font-semibold mb-2 mt-4">EKUITAS</h3>
                  {ekuitas.map((a) => (
                    <div key={a.kode} className="flex justify-between py-1 pl-4 text-sm">
                      <span>{a.kode} {a.nama}</span>
                      <span className="font-medium">{formatRupiah(a.saldo)}</span>
                    </div>
                  ))}
                  {ekuitas.length === 0 && <p className="text-sm text-muted-foreground pl-4">Tidak ada data</p>}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>Total Ekuitas</span><span>{formatRupiah(totalEkuitas)}</span>
                  </div>

                  <div className="border-t-2 border-double mt-4 pt-2 flex justify-between font-bold text-base">
                    <span>TOTAL L + E</span><span>{formatRupiah(totalLE)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            {seimbang ? (
              <Badge variant="default" className="bg-success text-success-foreground text-sm px-4 py-1">
                ✓ Neraca Seimbang
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-sm px-4 py-1">
                ⚠ Neraca Tidak Seimbang (selisih: {formatRupiah(Math.abs(totalAset - totalLE))})
              </Badge>
            )}
          </div>
        </>
      )}
    </div>
  );
}
