import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSiswaDetail, useSiswaDetailOrangtua, useCreateSiswa, useUpdateSiswa } from "@/hooks/useSiswa";
import { useAngkatan, useDepartemen, useTingkat, useKelas, useTahunAjaran } from "@/hooks/useAkademikData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FileUpload } from "@/components/shared/FileUpload";
import { FormSection } from "@/components/shared/FormSection";
import { ArrowLeft, CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


const siswaSchema = z.object({
  nis: z.string().optional(),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  jenis_kelamin: z.enum(["L", "P"], { required_error: "Pilih jenis kelamin" }),
  tempat_lahir: z.string().optional(),
  tanggal_lahir: z.date().optional(),
  agama: z.string().optional(),
  alamat: z.string().optional(),
  telepon: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  foto_url: z.string().optional(),
  status: z.string().default("aktif"),
  angkatan_id: z.string().optional(),
  departemen_id: z.string().optional(),
  tingkat_id: z.string().optional(),
  kelas_id: z.string().optional(),
  tahun_ajaran_id: z.string().optional(),
  nama_ayah: z.string().optional(),
  nama_ibu: z.string().optional(),
  pekerjaan_ayah: z.string().optional(),
  pekerjaan_ibu: z.string().optional(),
  telepon_ortu: z.string().optional(),
  alamat_ortu: z.string().optional(),
});

type SiswaForm = z.infer<typeof siswaSchema>;

const agamaOptions = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
const pekerjaanOptions = ["PNS", "TNI/Polri", "Wiraswasta", "Karyawan Swasta", "Petani", "Nelayan", "Buruh", "Guru/Dosen", "Dokter", "Lainnya"];

export default function FormSiswa() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const createSiswa = useCreateSiswa();
  const updateSiswa = useUpdateSiswa();
  const { data: siswa } = useSiswaDetail(id || "");
  const { data: orangtua } = useSiswaDetailOrangtua(id || "");
  const { data: angkatanList = [] } = useAngkatan();
  const { data: departemenList = [] } = useDepartemen();
  const { data: tahunAjaranList = [] } = useTahunAjaran();

  const form = useForm<SiswaForm>({
    resolver: zodResolver(siswaSchema),
    defaultValues: { status: "aktif" },
  });

  const watchDept = form.watch("departemen_id");
  const watchTingkat = form.watch("tingkat_id");
  const { data: tingkatList = [] } = useTingkat(watchDept);
  const { data: kelasList = [] } = useKelas(watchTingkat);

  // Populate form on edit
  useEffect(() => {
    if (isEdit && siswa) {
      const activeKelas = siswa.kelas_siswa?.find((ks) => ks.aktif);
      form.reset({
        nis: siswa.nis || "",
        nama: siswa.nama,
        jenis_kelamin: (siswa.jenis_kelamin as "L" | "P") || undefined,
        tempat_lahir: siswa.tempat_lahir || "",
        tanggal_lahir: siswa.tanggal_lahir ? new Date(siswa.tanggal_lahir) : undefined,
        agama: siswa.agama || "",
        alamat: siswa.alamat || "",
        telepon: siswa.telepon || "",
        email: siswa.email || "",
        foto_url: siswa.foto_url || "",
        status: siswa.status || "aktif",
        angkatan_id: siswa.angkatan_id || "",
        departemen_id: activeKelas?.kelas?.departemen?.id || "",
        tingkat_id: activeKelas?.kelas?.tingkat?.id || "",
        kelas_id: activeKelas?.kelas?.id || "",
        tahun_ajaran_id: activeKelas?.tahun_ajaran?.id || "",
        nama_ayah: orangtua?.nama_ayah || "",
        nama_ibu: orangtua?.nama_ibu || "",
        pekerjaan_ayah: orangtua?.pekerjaan_ayah || "",
        pekerjaan_ibu: orangtua?.pekerjaan_ibu || "",
        telepon_ortu: orangtua?.telepon_ortu || "",
        alamat_ortu: orangtua?.alamat_ortu || "",
      });
    }
  }, [siswa, orangtua, isEdit]);

  const onSubmit = async (values: SiswaForm) => {
    const siswaData: Record<string, unknown> = {
      nama: values.nama,
      nis: values.nis || null,
      jenis_kelamin: values.jenis_kelamin,
      tempat_lahir: values.tempat_lahir || null,
      tanggal_lahir: values.tanggal_lahir ? format(values.tanggal_lahir, "yyyy-MM-dd") : null,
      agama: values.agama || null,
      alamat: values.alamat || null,
      telepon: values.telepon || null,
      email: values.email || null,
      foto_url: values.foto_url || null,
      status: values.status,
      angkatan_id: values.angkatan_id || null,
    };

    const detailData: Record<string, unknown> = {
      nama_ayah: values.nama_ayah || null,
      nama_ibu: values.nama_ibu || null,
      pekerjaan_ayah: values.pekerjaan_ayah || null,
      pekerjaan_ibu: values.pekerjaan_ibu || null,
      telepon_ortu: values.telepon_ortu || null,
      alamat_ortu: values.alamat_ortu || null,
    };

    if (isEdit) {
      await updateSiswa.mutateAsync({ id: id!, siswa: siswaData, detail: detailData });
      navigate(`/akademik/siswa/${id}`);
    } else {
      const kelasData = values.kelas_id && values.tahun_ajaran_id
        ? { kelas_id: values.kelas_id, tahun_ajaran_id: values.tahun_ajaran_id, aktif: true }
        : undefined;
      await createSiswa.mutateAsync({ siswa: siswaData, detail: detailData, kelas_siswa: kelasData });
      navigate("/akademik/siswa");
    }
  };




  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? "Edit Siswa" : "Tambah Siswa Baru"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? `Mengedit data ${siswa?.nama || ""}` : "Isi data siswa baru"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="pribadi" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pribadi">Data Pribadi</TabsTrigger>
              <TabsTrigger value="akademik">Data Akademik</TabsTrigger>
              <TabsTrigger value="orangtua">Data Orang Tua</TabsTrigger>
            </TabsList>

            <TabsContent value="pribadi">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <FormSection title="Foto Siswa">
                    <FileUpload
                      bucket="avatars-siswa"
                      accept="image/*"
                      maxSize={2}
                      value={form.watch("foto_url")}
                      onChange={(url) => form.setValue("foto_url", url || "")}
                    />
                  </FormSection>

                  <FormSection title="Identitas">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField control={form.control} name="nis" render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIS</FormLabel>
                          <FormControl><Input placeholder="Nomor Induk Siswa" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="nama" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap *</FormLabel>
                          <FormControl><Input placeholder="Nama lengkap siswa" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="jenis_kelamin" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jenis Kelamin *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="L">Laki-laki</SelectItem>
                              <SelectItem value="P">Perempuan</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="agama" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agama</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih agama" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {agamaOptions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="tempat_lahir" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempat Lahir</FormLabel>
                          <FormControl><Input placeholder="Kota kelahiran" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="tanggal_lahir" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Tanggal Lahir</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "dd/MM/yyyy") : "Pilih tanggal"}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </FormSection>

                  <FormSection title="Kontak">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField control={form.control} name="telepon" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telepon</FormLabel>
                          <FormControl><Input placeholder="08xxxxxxxxxx" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" placeholder="email@contoh.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="alamat" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat</FormLabel>
                        <FormControl><Textarea placeholder="Alamat lengkap" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </FormSection>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="akademik">
              <Card>
                <CardContent className="pt-6">
                  <FormSection title="Data Akademik">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField control={form.control} name="angkatan_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Angkatan</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih angkatan" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {angkatanList.map((a) => <SelectItem key={a.id} value={a.id}>{a.nama}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="aktif">Aktif</SelectItem>
                              <SelectItem value="alumni">Alumni</SelectItem>
                              <SelectItem value="pindah">Pindah</SelectItem>
                              <SelectItem value="keluar">Keluar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="departemen_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departemen</FormLabel>
                          <Select onValueChange={(v) => { field.onChange(v); form.setValue("tingkat_id", ""); form.setValue("kelas_id", ""); }} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih departemen" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {departemenList.map((d) => <SelectItem key={d.id} value={d.id}>{d.nama}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="tingkat_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tingkat</FormLabel>
                          <Select onValueChange={(v) => { field.onChange(v); form.setValue("kelas_id", ""); }} value={field.value} disabled={!watchDept}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih tingkat" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {tingkatList.map((t) => <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="kelas_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kelas</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!watchTingkat}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {kelasList.map((k) => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="tahun_ajaran_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tahun Ajaran</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih tahun ajaran" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {tahunAjaranList.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.nama} {t.aktif ? "(Aktif)" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </FormSection>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orangtua">
              <Card>
                <CardContent className="pt-6">
                  <FormSection title="Data Orang Tua / Wali">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField control={form.control} name="nama_ayah" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Ayah</FormLabel>
                          <FormControl><Input placeholder="Nama ayah" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="nama_ibu" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Ibu</FormLabel>
                          <FormControl><Input placeholder="Nama ibu" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="pekerjaan_ayah" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pekerjaan Ayah</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih pekerjaan" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {pekerjaanOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="pekerjaan_ibu" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pekerjaan Ibu</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih pekerjaan" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {pekerjaanOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="telepon_ortu" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telepon Orang Tua</FormLabel>
                          <FormControl><Input placeholder="08xxxxxxxxxx" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="alamat_ortu" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat Orang Tua</FormLabel>
                        <FormControl><Textarea placeholder="Alamat orang tua" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </FormSection>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Sticky save button */}
          <div className="sticky bottom-0 bg-background border-t py-4 mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
            <Button type="submit" disabled={createSiswa.isPending || updateSiswa.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? "Simpan Perubahan" : "Simpan Siswa"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
