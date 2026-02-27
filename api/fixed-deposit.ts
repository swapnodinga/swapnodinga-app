import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return new Response(JSON.stringify({ success: false, message: "Supabase credentials missing" }), { status: 500, headers: { "Content-Type": "application/json" } });
  const supabase = createClient(url, key);
  try {
    const { action, fd_id, data } = await req.json();
    let error: any = null;
    if (action === "add") {
      ({ error } = await supabase.from("fixed_deposits").insert([data]));
    } else if (action === "update") {
      if (!fd_id) throw new Error("fd_id required");
      ({ error } = await supabase.from("fixed_deposits").update(data).eq("id", Number(fd_id)));
    } else if (action === "delete") {
      if (!fd_id) throw new Error("fd_id required");
      ({ error } = await supabase.from("fixed_deposits").delete().eq("id", Number(fd_id)));
    } else { throw new Error("Unknown action"); }
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
