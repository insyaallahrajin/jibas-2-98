import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAngkatan() {
  return useQuery({
    queryKey: ["angkatan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("angkatan")
        .select("*, departemen:departemen_id(id, nama)")
        .order("nama", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useDepartemen() {
  return useQuery({
    queryKey: ["departemen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departemen")
        .select("*")
        .eq("aktif", true)
        .order("nama");
      if (error) throw error;
      return data;
    },
  });
}

export function useTingkat(departemenId?: string) {
  return useQuery({
    queryKey: ["tingkat", departemenId],
    queryFn: async () => {
      let q = supabase.from("tingkat").select("*").eq("aktif", true).order("urutan");
      if (departemenId) q = q.eq("departemen_id", departemenId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });
}

export function useKelas(tingkatId?: string) {
  return useQuery({
    queryKey: ["kelas", tingkatId],
    queryFn: async () => {
      let q = supabase.from("kelas").select("*, tingkat:tingkat_id(id, nama), departemen:departemen_id(id, nama)").eq("aktif", true).order("nama");
      if (tingkatId) q = q.eq("tingkat_id", tingkatId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });
}

export function useTahunAjaran() {
  return useQuery({
    queryKey: ["tahun_ajaran"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tahun_ajaran")
        .select("*")
        .order("nama", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSemester(tahunAjaranId?: string) {
  return useQuery({
    queryKey: ["semester", tahunAjaranId],
    queryFn: async () => {
      let q = supabase.from("semester").select("*").order("urutan");
      if (tahunAjaranId) q = q.eq("tahun_ajaran_id", tahunAjaranId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}
