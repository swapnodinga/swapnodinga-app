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
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { id, status } = body || {};

    if (!id) throw new Error("ID is required");

    // 1. UPDATE THE STATUS IMMEDIATELY (Most Important Step)
    const { data: tx, error: updateError } = await supabase
      .from("Installments")
      .update({ 
        status, 
        approved_at: status === "Approved" ? new Date().toISOString() : null 
      })
      .eq("id", Number(id))
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. FETCH MEMBER DATA SEPARATELY (Safely)
    const { data: member } = await supabase
      .from("members")
      .select("email, full_name")
      .eq("id", tx.member_id)
      .single();

    // 3. TRIGGER NOTIFICATION (Non-blocking)
    if (member?.email) {
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host;
      
      fetch(`${protocol}://${host}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_name: member.full_name,
          member_email: member.email,
          amount: tx.amount,
          month: tx.month,
          status: status,
          time: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
        }),
      }).catch(e => console.error("Email notification failed, but payment was approved."));
    }

    // 4. CLEANUP STORAGE (If Approved)
    if (status === "Approved" && tx.proofPath) {
      await supabase.storage.from("payments").remove([tx.proofPath]);
      await supabase.from("Installments")
        .update({ payment_proof_url: null, proofPath: null })
        .eq("id", id);
    }

    return res.status(200).json({ success: true, message: `Payment ${status} successfully` });

  } catch (error: any) {
    console.error("Critical API Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}