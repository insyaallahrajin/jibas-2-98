import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatsCard } from "@/components/shared/StatsCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAngkatan, useDepartemen } from "@/hooks/useAkademikData";
import { UserPlus, Users, UserCheck, Clock } from "lucide-react";
import { toast } from "sonner";

export default function PSB() {
  const qc = useQueryClient();
  const { data: angkatanList = [] } = useAngkatan();
  const { data: departemenList = [] } = useDepartemen();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ nama: "", jenis_kelamin: "L", telepon: "", alamat: "", angkatan_id: "" });

  // Get calon siswa (status = 'calon')
  const { data: calonList = [], isLoading } = useQuery({
    queryKey: ["siswa", "calon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("siswa")
        .select("*, angkatan:angkatan_id(nama)")
        .in("status", ["calon", "diterima"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const calonCount = calonList.filter((s: any) => s.status === "calon").length;
  const diterimaCount = calonList.filter((s: any) => s.status === "diterima").length;

  const handleDaftar = async () => {
    if (!formData.nama) { toast.error("Nama wajib diisi"); return; }
    const { error } = await supabase.from("siswa").insert({
      nama: formData.nama,
      jenis_kelamin: formData.jenis_kelamin,
      telepon: formData.telepon || null,
      alamat: formData.alamat || null,
      angkatan_id: formData.angkatan_id || null,
      status: "calon",
    } as any);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["siswa"] });
    toast.success("Calon siswa berhasil didaftarkan");
    setDialogOpen(false);
    setFormData({ nama: "", jenis_kelamin: "L", telepon: "", alamat: "", angkatan_id: "" });
  };

  const handleTerima = async (id: string) => {
    await supabase.from("siswa").update({ status: "diterima" } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["siswa"] });
    toast.success("Siswa diterima");
  };

  const handleAktifkan = async (id: string) => {
    await supabase.from("siswa").update({ status: "aktif" } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["siswa"] });
    toast.success("Siswa diaktifkan");
  };

  const columns: DataTableColumn<Record<string, unknown>>[] = [
    { key: "nama", label: "Nama", sortable: true },
    { key: "jenis_kelamin", label: "JK", render: (v) => v === "L" ? "L" : "P" },
    { key: "telepon", label: "Telepon" },
    { key: "angkatan", label: "Angkatan", render: (v: any) => v?.nama || "-" },
    {
      key: "status", label: "Status",
      render: (v) => {
        const s = v as string;
        const colors: Record<string, string> = {
          calon: "bg-warning/15 text-warning border-warning/30",
          diterima: "bg-info/15 text-info border-info/30",
        };
        return <span className={`px-2 py-0.5 rounded-full text-xs border ${colors[s] || ""}`}>{s}</span>;
      },
    },
    {
      key: "id", label: "Aksi", className: "w-40",
      render: (_, row) => {
        const status = row.status as string;
        return (
          <div className="flex gap-1">
            {status === "calon" && (
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleTerima(row.id as string); }}>
                Terima
              </Button>
            )}
            {status === "diterima" && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAktifkan(row.id as string); }}>
                Aktifkan
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Penerimaan Siswa Baru (PSB)</h1>
          <p className="text-sm text-muted-foreground">Kelola pendaftaran dan penerimaan siswa baru</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Daftarkan Calon Siswa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Formulir Pendaftaran</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nama Lengkap *</Label>
                <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
              </div>
              <div>
                <Label>Jenis Kelamin</Label>
                <Select value={formData.jenis_kelamin} onValueChange={(v) => setFormData({ ...formData, jenis_kelamin: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Angkatan</Label>
                <Select value={formData.angkatan_id} onValueChange={(v) => setFormData({ ...formData, angkatan_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih angkatan" /></SelectTrigger>
                  <SelectContent>
                    {angkatanList.map((a) => <SelectItem key={a.id} value={a.id}>{a.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Telepon</Label>
                <Input value={formData.telepon} onChange={(e) => setFormData({ ...formData, telepon: e.target.value })} />
              </div>
              <div>
                <Label>Alamat</Label>
                <Textarea value={formData.alamat} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleDaftar}>Daftarkan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total Pendaftar" value={calonList.length} icon={Users} color="primary" />
        <StatsCard title="Menunggu" value={calonCount} icon={Clock} color="warning" />
        <StatsCard title="Diterima" value={diterimaCount} icon={UserCheck} color="success" />
      </div>

      <DataTable
        columns={columns}
        data={calonList as Record<string, unknown>[]}
        searchPlaceholder="Cari nama calon siswa..."
        loading={isLoading}
        pageSize={20}
      />
    </div>
  );
}
