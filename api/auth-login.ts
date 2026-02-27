import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return new Response(JSON.stringify({ success: false, message: "Supabase credentials missing" }), { status: 500, headers: { "Content-Type": "application/json" } });
  const supabase = createClient(url, key);
  try {
    const { email, password } = await req.json();
    if (!email || !password) throw new Error("Email and password required");
    const { data: passwordValid, error: verifyError } = await supabase.rpc("check_member_password", { p_email: email.trim(), p_password: password });
    if (verifyError) throw verifyError;
    if (!passwordValid) return new Response(JSON.stringify({ success: false, message: "Invalid credentials" }), { status: 401, headers: { "Content-Type": "application/json" } });
    const { data: member, error: fetchError } = await supabase.from("members").select("id, full_name, email, society_id, status, is_admin, profile_pic, phone, address, role, fixed_deposit_amount, fixed_deposit_interest, created_at, updated_at").eq("email", email.trim()).single();
    if (fetchError || !member) throw new Error("Invalid credentials");
    if (member.status !== "active") return new Response(JSON.stringify({ success: false, message: "Account not active" }), { status: 403, headers: { "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ success: true, user: member }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
