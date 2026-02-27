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

    const supabase = createClient(url!, key!);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { id, status } = body || {};

    // 1. Update status and fetch full transaction data
    const { data: tx, error: updateError } = await supabase
      .from("Installments")
      .update({ status, approved_at: status === "Approved" ? new Date().toISOString() : null })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. Fetch Member Email and Name [cite: 2025-12-31]
    const { data: member } = await supabase
      .from("members")
      .select("email, name")
      .eq("id", tx.member_id)
      .single();

    // 3. Trigger EmailJS with CORRECT Variables
    if (member?.email && process.env.EMAILJS_PRIVATE_KEY) {
      const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          accessToken: process.env.EMAILJS_PRIVATE_KEY, // Critical for backend
          template_params: {
            to_email: member.email,        // Matches {{to_email}} in Dashboard
            member_name: member.name,      // Matches {{member_name}} in Dashboard
            status: status,                // Matches {{status}} in Dashboard
            amount: tx.amount,              // Matches {{amount}} in Dashboard
            month: tx.month,               // Matches {{month}} in Dashboard
            time: new Date().toLocaleString() // Matches {{time}} in Dashboard
          },
        }),
      });
      
      const result = await emailResponse.text();
      console.log("EmailJS Server Response:", result);
    }

    // 4. Delete Proof from Bucket & Clear DB path [cite: 2025-12-31]
    if (tx.proofPath) {
      await supabase.storage.from("payment-proofs").remove([tx.proofPath]);
      await supabase.from("Installments").update({ payment_proof_url: null, proofPath: null }).eq("id", id);
    }

    return res.status(200).json({ success: true, transaction: tx });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}