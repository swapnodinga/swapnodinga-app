import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // 2. Strict Method Check
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY; 
    
    if (!url || !key) {
      console.error("Missing Environment Variables");
      return new Response(JSON.stringify({ success: false, message: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabase = createClient(url, key);
    const body = await req.json();
    const { member_id, memberName, society_id, amount, payment_proof_url, proofPath, month } = body;

    // 3. Validation
    if (!member_id || !amount || !month) {
      return new Response(JSON.stringify({ success: false, message: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 4. Database Insert
    const { error } = await supabase.from("Installments").insert([{
      member_id,
      memberName,
      society_id,
      amount: Number(amount),
      payment_proof_url,
      proofPath,
      month,
      status: "Pending",
      created_at: new Date().toISOString(),
    }]);

    if (error) {
      console.error("Supabase Insert Error:", error.message);
      return new Response(JSON.stringify({ success: false, message: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 5. SUCCESS RESPONSE (This clears the PROCESSING state)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      },
    });

  } catch (err: any) {
    console.error("Global API Error:", err.message);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}