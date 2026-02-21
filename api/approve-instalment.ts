import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    return new Response(JSON.stringify({ success: false, message: "Supabase credentials missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(url, key);

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return new Response(JSON.stringify({ success: false, message: "Missing id or status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
