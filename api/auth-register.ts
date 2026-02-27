import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return new Response(JSON.stringify({ success: false, message: "Supabase credentials missing" }), { status: 500, headers: { "Content-Type": "application/json" } });
  const supabase = createClient(url, key);
  try {
    const { full_name, email, password } = await req.json();
    if (!full_name || !email || !password) throw new Error("All fields required");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    const { data: existing } = await supabase.from("members").select("id").eq("email", email.trim());
    if (existing && existing.length > 0) return new Response(JSON.stringify({ success: false, message: "Email already registered" }), { status: 409, headers: { "Content-Type": "application/json" } });
    const { data: currentMembers } = await supabase.from("members").select("id");
    const lastId = currentMembers && currentMembers.length > 0 ? Math.max(...currentMembers.map((m: any) => m.id)) : 0;
    const newId = lastId + 1;
    const { data: hashedPassword, error: hashError } = await supabase.rpc("hash_password", { raw_password: password });
    if (hashError || !hashedPassword) throw new Error("Failed to hash password");
    const { error: insertError } = await supabase.from("members").insert([{ id: newId, full_name: full_name.trim(), email: email.trim(), password: hashedPassword, society_id: `SCS-${String(newId).padStart(3, "0")}`, status: "pending", fixed_deposit_amount: 0, fixed_deposit_interest: 0, is_admin: false }]);
    if (insertError) throw insertError;
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
