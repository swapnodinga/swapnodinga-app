import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(url!, key!);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { id, status } = body || {};

    // 1. Update status and fetch full transaction data [cite: 2025-12-31]
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

    console.log("Found member email:", member?.email); // Check Vercel logs for this!

    // 3. Trigger External Send Email API
    if (member?.email) {
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host;
      
      // We use internal fetch to keep logic separate as requested
      await fetch(`${protocol}://${host}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_name: member.name,
          member_email: member.email,
          amount: tx.amount,
          month: tx.month,
          status: status
        }),
      });
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