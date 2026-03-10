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

    // 1. Fetch Installment and JOIN with Members table to get the Email
    // We use the 'unique' email from the related member record
    const { data: tx, error: fetchError } = await supabase
      .from("Installments")
      .select(`
        *,
        members:member_id (
          email,
          full_name
        )
      `)
      .eq("id", Number(id))
      .single();

    if (fetchError || !tx) throw new Error("Transaction not found");

    const memberEmail = tx.members?.email;
    const memberName = tx.members?.full_name;

    if (!memberEmail) throw new Error("Could not find a unique email for this member");

    // 2. Update the status
    const { error: updateError } = await supabase
      .from("Installments")
      .update({ 
        status, 
        approved_at: status === "Approved" ? new Date().toISOString() : null 
      })
      .eq("id", Number(id));

    if (updateError) throw updateError;

    // 3. Trigger Email using the member's unique email
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const localTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    await fetch(`${protocol}://${host}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_name: memberName,
        member_email: memberEmail, // Using the unique email here
        amount: tx.amount,
        month: tx.month,
        status: status,
        proof_url: tx.payment_proof_url,
        time: localTime
      }),
    });

    // 4. Cleanup storage
    if (tx.proofPath) {
      await supabase.storage.from("payments").remove([tx.proofPath]);
      await supabase.from("Installments").update({ payment_proof_url: null, proofPath: null }).eq("id", id);
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}