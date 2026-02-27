import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    return new Response(JSON.stringify({ success: false, message: "Supabase credentials missing" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(url, key);

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return new Response(JSON.stringify({ success: false, message: "Missing id or status" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { data, error } = await supabase
      .from("Installments")
      .update({
        status: status,
        approved_at: status === "Approved" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, transaction: data }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
