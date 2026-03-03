import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  // Define standard headers for all responses to prevent CORS and JSON parse issues
  const commonHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle browser preflight (OPTIONS) requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: commonHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405, headers: commonHeaders,
    });
  }

  // Ensure you are using the SERVICE_ROLE_KEY to bypass Row Level Security 
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; 

  if (!url || !key) {
    return new Response(JSON.stringify({ success: false, message: "Supabase credentials missing" }), {
      status: 500, headers: commonHeaders,
    });
  }

  const supabase = createClient(url, key);

  try {
    const { action, fd_id, data } = await req.json();
    let error: any = null;

    if (action === "add") {
      // Data must include principal_amount, rate, tenure, and fd_slip_url [cite: 70]
      ({ error } = await supabase.from("fixed_deposits").insert([data]));
    } else if (action === "update") {
      if (!fd_id) throw new Error("fd_id required for update");
      ({ error } = await supabase.from("fixed_deposits").update(data).eq("id", Number(fd_id)));
    } else if (action === "delete") {
      if (!fd_id) throw new Error("fd_id required for deletion");
      ({ error } = await supabase.from("fixed_deposits").delete().eq("id", Number(fd_id)));
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: commonHeaders 
    });
  } catch (err: any) {
    console.error("API Error:", err.message);
    // Returning headers here prevents the "JSON.parse" error on the frontend 
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, 
      headers: commonHeaders 
    });
  }
}