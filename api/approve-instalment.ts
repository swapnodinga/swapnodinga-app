import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function fetchTransaction(supabase: any, id: number) {
  const tableNames = ["Installments", "installments"];

  for (const tableName of tableNames) {
    const { data, error } = await supabase
      .from(tableName)
      .select(`
        *,
        members:member_id (
          email,
          full_name
        )
      `)
      .eq("id", id)
      .single();

    if (!error && data) return { tx: data, tableName };
  }

  return { tx: null, tableName: null };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { id, status } = body || {};

    const numericId = Number(id);
    const { tx, tableName } = await fetchTransaction(supabase, numericId);

    if (!tx || !tableName) {
      throw new Error(`Transaction not found (id: ${id}). Tried tables: Installments, installments`);
    }

    const memberEmail = tx.members?.email;
    const memberName = tx.members?.full_name;

    if (!memberEmail) throw new Error("Could not find a unique email for this member");

    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        status,
        approved_at: status === "Approved" ? new Date().toISOString() : null,
      })
      .eq("id", numericId);

    if (updateError) throw updateError;

    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const localTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    await fetch(`${protocol}://${host}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_name: memberName,
        member_email: memberEmail,
        amount: tx.amount,
        month: tx.month,
        status,
        proof_url: tx.payment_proof_url,
        time: localTime,
      }),
    });

    if (tx.proofPath) {
      await supabase.storage.from("payments").remove([tx.proofPath]);
      await supabase.from(tableName).update({ payment_proof_url: null, proofPath: null }).eq("id", numericId);
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}