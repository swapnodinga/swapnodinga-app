import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return new Response(JSON.stringify({ success: false, message: "Supabase credentials missing" }), { status: 500, headers: { "Content-Type": "application/json" } });
  const supabase = createClient(url, key);
  try {
    const { member_id } = await req.json();
    if (!member_id) throw new Error("member_id required");
    const { error } = await supabase.from("members").update({ status: "active" }).eq("id", Number(member_id));
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
