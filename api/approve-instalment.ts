import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: any, res: any) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    const supabase = createClient(url, key);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { id, status } = body || {};

    if (!id || !status) return res.status(400).json({ success: false, message: "Missing id or status" });

    // 1. Update Status and fetch data for the email
    const { data: tx, error: updateError } = await supabase
      .from("Installments")
      .update({ 
        status, 
        approved_at: status === "Approved" ? new Date().toISOString() : null 
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. Fetch Member Email (required for EmailJS)
    const { data: member } = await supabase
      .from("members")
      .select("email, name")
      .eq("id", tx.member_id)
      .single();

    // 3. Trigger EmailJS REST API [cite: 2025-12-31]
    if (member?.email && process.env.EMAILJS_PUBLIC_KEY) {
      try {
        await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            template_params: {
              to_email: member.email,
              user_name: member.name,
              status: status,
              amount: tx.amount,
              month: tx.month,
              transaction_id: tx.id
            },
          }),
        });
      } catch (emailErr) {
        console.error("EmailJS failed but status was updated:", emailErr);
      }
    }

    // 4. Delete Proof from Bucket & Clear DB path [cite: 2025-12-31]
    if (tx.proofPath) {
      // Remove from storage
      await supabase.storage.from("payment-proofs").remove([tx.proofPath]);
      
      // Update DB to clear the proof link as per your requirement [cite: 2025-12-31]
      await supabase
        .from("Installments")
        .update({ payment_proof_url: null, proofPath: null })
        .eq("id", id);
    }

    return res.status(200).json({ success: true, transaction: tx });

  } catch (err: any) {
    console.error("Handler error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unknown error" });
  }
}