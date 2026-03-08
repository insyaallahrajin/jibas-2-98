import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { angkatan_id } = await req.json();
    if (!angkatan_id) {
      return new Response(JSON.stringify({ error: "angkatan_id diperlukan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get angkatan info
    const { data: angkatan } = await supabase
      .from("angkatan")
      .select("nama")
      .eq("id", angkatan_id)
      .single();

    if (!angkatan) {
      return new Response(JSON.stringify({ error: "Angkatan tidak ditemukan" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count existing students in this angkatan
    const { count } = await supabase
      .from("siswa")
      .select("*", { count: "exact", head: true })
      .eq("angkatan_id", angkatan_id);

    const seq = String((count || 0) + 1).padStart(4, "0");
    const nis = `${angkatan.nama}${seq}`;

    return new Response(JSON.stringify({ nis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
