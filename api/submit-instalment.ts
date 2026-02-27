import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return new Response(JSON.stringify({ success: false, message: "Supabase credentials missing" }), { status: 500, headers: { "Content-Type": "application/json" } });
  const supabase = createClient(url, key);
  try {
    const { member_id, memberName, society_id, amount, payment_proof_url, proofPath, month } = await req.json();
    if (!member_id || !amount || !month) return new Response(JSON.stringify({ success: false, message: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
    const { error } = await supabase.from("Installments").insert([{ member_id, memberName, society_id, amount: Number(amount), payment_proof_url, proofPath, month, status: "Pending", created_at: new Date().toISOString() }]);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
