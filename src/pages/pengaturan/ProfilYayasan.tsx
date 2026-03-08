import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileUpload } from "@/components/shared/FileUpload";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";
import { Save, Building2, Plus, Pencil } from "lucide-react";

type DeptRow = Record<string, unknown> & {
  id: string; kode: string | null; nama: string; keterangan: string | null; aktif: boolean | null;
};

export default function ProfilYayasan() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil & Lembaga</h1>
        <p className="text-sm text-muted-foreground">Kelola identitas yayasan dan data lembaga</p>
      </div>
      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Profil Yayasan</TabsTrigger>
          <TabsTrigger value="lembaga">Data Lembaga</TabsTrigger>
        </TabsList>
        <TabsContent value="profil"><TabProfil isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="lembaga"><TabLembaga isAdmin={isAdmin} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ============ TAB PROFIL YAYASAN ============ */
function TabProfil({ isAdmin }: { isAdmin: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string | null>>({});
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("sekolah").select("*").maybeSingle().then(({ data }) => {
      if (data) {
        setId(data.id);
        setForm({
          nama: data.nama, alamat: data.alamat, kota: data.kota,
          telepon: data.telepon, email: data.email,
          kepala_sekolah: data.kepala_sekolah, npsn: data.npsn,
          akreditasi: data.akreditasi, logo_url: data.logo_url,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    const payload = {
      nama: form.nama || null, alamat: form.alamat || null,
      kota: form.kota || null, telepon: form.telepon || null,
      email: form.email || null, kepala_sekolah: form.kepala_sekolah || null,
      npsn: form.npsn || null, akreditasi: form.akreditasi || null,
      logo_url: form.logo_url || null,
    };

    let error;
    if (id) {
      ({ error } = await supabase.from("sekolah").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("sekolah").insert(payload));
    }

    setSaving(false);
    if (error) toast.error("Gagal menyimpan: " + error.message);
    else toast.success("Profil yayasan berhasil disimpan");
  };

  const set = (key: string, val: string | null) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) return <div className="py-8 text-center text-muted-foreground">Memuat...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Profil Yayasan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="shrink-0">
            <Label className="mb-2 block">Logo Yayasan</Label>
            <FileUpload bucket="logos-sekolah" value={form.logo_url || undefined} onChange={(url) => set("logo_url", url)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 flex-1">
            <Field label="Nama Yayasan" value={form.nama} onChange={(v) => set("nama", v)} />
            <Field label="Ketua Yayasan" value={form.kepala_sekolah} onChange={(v) => set("kepala_sekolah", v)} />
            <Field label="Alamat" value={form.alamat} onChange={(v) => set("alamat", v)} />
            <Field label="Kota" value={form.kota} onChange={(v) => set("kota", v)} />
            <Field label="Telepon" value={form.telepon} onChange={(v) => set("telepon", v)} />
            <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
            <Field label="NPSN" value={form.npsn} onChange={(v) => set("npsn", v)} />
            <Field label="Akreditasi" value={form.akreditasi} onChange={(v) => set("akreditasi", v)} />
          </div>
        </div>
        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value?: string | null; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ============ TAB DATA LEMBAGA ============ */
function TabLembaga({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState<DeptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeptRow | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: d } = await supabase.from("departemen").select("*").order("kode");
    setData((d as DeptRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (row: DeptRow) => { setEditing(row); setDialogOpen(true); };

  const columns: DataTableColumn<DeptRow>[] = [
    { key: "kode", label: "Kode", sortable: true },
    { key: "nama", label: "Nama", sortable: true },
    { key: "keterangan", label: "Keterangan" },
    {
      key: "aktif", label: "Status",
      render: (_val: unknown, row: DeptRow) => (
        <Badge variant={row.aktif ? "default" : "secondary"}>{row.aktif ? "Aktif" : "Nonaktif"}</Badge>
      ),
    },
    ...(isAdmin ? [{
      key: "_aksi", label: "Aksi",
      render: (_val: unknown, row: DeptRow) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    } satisfies DataTableColumn<DeptRow>] : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchable
        actions={isAdmin ? (
          <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Tambah Lembaga</Button>
        ) : undefined}
      />
      {dialogOpen && (
        <DialogLembaga
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={editing}
          onSaved={fetchData}
        />
      )}
    </>
  );
}

function DialogLembaga({ open, onOpenChange, initial, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  initial: DeptRow | null; onSaved: () => void;
}) {
  const [kode, setKode] = useState(initial?.kode || "");
  const [nama, setNama] = useState(initial?.nama || "");
  const [keterangan, setKeterangan] = useState(initial?.keterangan || "");
  const [aktif, setAktif] = useState(initial?.aktif ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nama.trim()) { toast.error("Nama lembaga wajib diisi"); return; }
    setSaving(true);
    const payload = { kode: kode || null, nama, keterangan: keterangan || null, aktif };
    let error;
    if (initial) {
      ({ error } = await supabase.from("departemen").update(payload).eq("id", initial.id));
    } else {
      ({ error } = await supabase.from("departemen").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error("Gagal menyimpan: " + error.message); return; }
    toast.success(initial ? "Lembaga diperbarui" : "Lembaga ditambahkan");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Lembaga" : "Tambah Lembaga"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Kode *</Label><Input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="SD" /></div>
          <div className="space-y-1.5"><Label>Nama *</Label><Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Sekolah Dasar" /></div>
          <div className="space-y-1.5"><Label>Keterangan</Label><Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} /></div>
          <div className="flex items-center gap-3">
            <Switch checked={aktif} onCheckedChange={setAktif} />
            <Label>Aktif</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
