import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Fungsi hitung SHA512 untuk verifikasi signature Midtrans
async function sha512(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  // Midtrans webhook hanya mengirim POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const notification = await req.json();
    console.log("Midtrans notification:", JSON.stringify(notification));

    const {
      order_id,
      transaction_id,
      gross_amount,
      transaction_status,
      payment_type,
      signature_key,
      status_code,
      fraud_status,
    } = notification;

    // 1. Verifikasi signature Midtrans
    const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY")!;
    const expectedSignature = await sha512(
      `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`
    );

    if (signature_key !== expectedSignature) {
      console.error("Signature mismatch!", {
        expected: expectedSignature,
        got: signature_key,
      });
      return new Response("Invalid signature", { status: 403 });
    }

    // 2. Ambil data transaksi dari DB
    const { data: transaksi, error: txFetchError } = await supabase
      .from("transaksi_midtrans")
      .select("*, transaksi_midtrans_item(*)")
      .eq("order_id", order_id)
      .single();

    if (txFetchError || !transaksi) {
      console.error("Transaksi tidak ditemukan:", order_id);
      return new Response("Order not found", { status: 404 });
    }

    // 3. Tentukan status berdasarkan transaction_status
    let newStatus = transaksi.status;
    let paidAt = null;

    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      if (transaction_status === "capture" && fraud_status !== "accept") {
        newStatus = "failed";
      } else {
        newStatus = "paid";
        paidAt = new Date().toISOString();
      }
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "failure"
    ) {
      newStatus = "failed";
    } else if (transaction_status === "expire") {
      newStatus = "expired";
    } else if (transaction_status === "pending") {
      newStatus = "pending";
    }

    // 4. Update status transaksi di DB
    const { error: updateError } = await supabase
      .from("transaksi_midtrans")
      .update({
        status: newStatus,
        payment_type: payment_type,
        midtrans_transaction_id: transaction_id,
        midtrans_payment_status: transaction_status,
        fraud_status: fraud_status || null,
        paid_at: paidAt,
        metadata: notification,
      })
      .eq("order_id", order_id);

    if (updateError) throw updateError;

    // 5. Jika PAID → buat record pembayaran untuk setiap item
    if (newStatus === "paid") {
      const items = transaksi.transaksi_midtrans_item || [];
      const today = new Date().toISOString().split("T")[0];

      for (const item of items) {
        // Cek double payment (idempotency)
        const { data: existing } = await supabase
          .from("pembayaran")
          .select("id")
          .eq("siswa_id", item.siswa_id)
          .eq("jenis_id", item.jenis_id)
          .eq("bulan", item.bulan)
          .maybeSingle();

        if (existing) {
          console.log(`Skip: tagihan sudah ada untuk item ${item.id}`);
          continue;
        }

        // Insert ke tabel pembayaran
        const { data: newPembayaran, error: payError } = await supabase
          .from("pembayaran")
          .insert({
            siswa_id: item.siswa_id,
            jenis_id: item.jenis_id,
            bulan: item.bulan,
            jumlah: item.jumlah,
            tanggal_bayar: today,
            departemen_id: item.departemen_id || null,
            tahun_ajaran_id: item.tahun_ajaran_id || null,
            keterangan: `Online Payment - ${order_id} via ${payment_type}`,
          })
          .select()
          .single();

        if (payError) {
          console.error("Gagal insert pembayaran:", payError);
          continue;
        }

        // Update item: simpan pembayaran_id
        await supabase
          .from("transaksi_midtrans_item")
          .update({ pembayaran_id: newPembayaran.id })
          .eq("id", item.id);
      }

      // ─── AUTO-JURNAL untuk transaksi Midtrans ───

      // 1. Ambil setting akun sistem
      const { data: pengaturanAkunData } = await supabase
        .from("pengaturan_akun")
        .select("kode_setting, akun_id");

      const pengaturanAkun = pengaturanAkunData || [];
      const bankMidtransId = pengaturanAkun.find(
        (p: any) => p.kode_setting === "bank_midtrans"
      )?.akun_id;

      // 2. Ambil akun pendapatan untuk setiap item (grouping by jenis)
      const itemsByJenis = new Map<
        string,
        { akun_id: string | null; total: number; nama: string }
      >();

      for (const item of items) {
        const { data: jenis } = await supabase
          .from("jenis_pembayaran")
          .select("nama, akun_pendapatan_id")
          .eq("id", item.jenis_id)
          .single();

        const existing = itemsByJenis.get(item.jenis_id);
        if (existing) {
          existing.total += Number(item.jumlah);
        } else {
          itemsByJenis.set(item.jenis_id, {
            akun_id: jenis?.akun_pendapatan_id || null,
            total: Number(item.jumlah),
            nama: jenis?.nama || "Pembayaran",
          });
        }
      }

      // 3. Cek apakah semua akun tersedia
      const bisaAutoJurnal =
        bankMidtransId &&
        Array.from(itemsByJenis.values()).every((j) => j.akun_id !== null);

      if (!bisaAutoJurnal) {
        console.warn("Auto-jurnal dilewati: akun sistem belum dikonfigurasi");
      } else {
        try {
          const tanggalBayar = new Date().toISOString().split("T")[0];
          const tahunBayar = new Date().getFullYear();

          const { data: nomorJurnal, error: rpcError } = await supabase.rpc(
            "generate_nomor_jurnal",
            { p_prefix: "JP", p_tahun: tahunBayar }
          );

          if (rpcError) throw rpcError;
          if (!nomorJurnal) throw new Error("Gagal mendapatkan nomor jurnal");

          const totalAmount = Number(transaksi.total_amount);

          // 4. Buat jurnal header
          const { data: jurnal, error: jErr } = await supabase
            .from("jurnal")
            .insert({
              nomor: nomorJurnal,
              tanggal: tanggalBayar,
              keterangan: `Online Payment Midtrans - ${order_id}`,
              referensi: order_id,
              total_debit: totalAmount,
              total_kredit: totalAmount,
              status: "posted",
            })
            .select()
            .single();

          if (jErr) throw jErr;

          // 5. Buat jurnal detail
          const details: any[] = [
            {
              jurnal_id: jurnal.id,
              akun_id: bankMidtransId,
              keterangan: `Penerimaan online payment ${order_id} via ${payment_type}`,
              debit: totalAmount,
              kredit: 0,
              urutan: 1,
            },
          ];

          let urutan = 2;
          for (const [_jenisId, jenis] of itemsByJenis) {
            details.push({
              jurnal_id: jurnal.id,
              akun_id: jenis.akun_id!,
              keterangan: `Pendapatan ${jenis.nama} (${order_id})`,
              debit: 0,
              kredit: jenis.total,
              urutan: urutan++,
            });
          }

          const { error: detailErr } = await supabase
            .from("jurnal_detail")
            .insert(details);

          if (detailErr) throw detailErr;

          // 6. Update transaksi_midtrans dengan jurnal_id (via metadata)
          await supabase
            .from("transaksi_midtrans")
            .update({
              metadata: {
                ...notification,
                jurnal_id: jurnal.id,
                jurnal_nomor: nomorJurnal,
              },
            })
            .eq("order_id", order_id);

          console.log(
            `Auto-jurnal berhasil: ${nomorJurnal} untuk ${order_id}`
          );
        } catch (jurnalErr: any) {
          console.error("Auto-jurnal Midtrans gagal:", jurnalErr);
        }
      }

      // 7. Kirim notifikasi ke orang tua
      try {
        await supabase.from("notifikasi_ortu").insert({
          user_id: transaksi.user_id,
          judul: "Pembayaran Berhasil",
          pesan: `Pembayaran ${items.length} tagihan senilai Rp ${Number(
            transaksi.total_amount
          ).toLocaleString("id-ID")} berhasil diproses via ${payment_type}. Order: ${order_id}`,
          tipe: "pembayaran",
          url: `/portal/pembayaran?order=${order_id}`,
          dibaca: false,
        });
      } catch (notifErr) {
        console.error("Insert notifikasi gagal:", notifErr);
      }

      console.log(
        `Pembayaran sukses: ${order_id}, ${items.length} item diproses`
      );
    }

    // 8. Return 200 OK ke Midtrans
    return new Response(
      JSON.stringify({ message: "OK", order_id, status: newStatus }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ message: "Error logged", error: error.message }),
      { status: 200 }
    );
  }
});
