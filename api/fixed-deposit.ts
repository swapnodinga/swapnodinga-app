import { createClient } from "@supabase/supabase-js";

const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export default async function handler(req: any) {
  if (req.method === "OPTIONS") return jsonResponse(null, 204);
  if (req.method !== "POST") return jsonResponse({ success: false, message: "Method Not Allowed" }, 405);

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) throw new Error("Missing environment variables");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resilient body parsing to prevent "req.json is not a function"
    let data;
    if (typeof req.json === 'function') {
      data = await req.json();
    } else {
      data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    const { error } = await supabase.from("fixed_deposits").insert([{
      society_id: data.society_id,
      member_id: data.member_id,
      amount: parseFloat(data.principal_amount),
      interest_rate: parseFloat(data.rate_percent),
      tenure_months: parseInt(data.tenure_months),
      start_date: data.start_date,
      mtdr_no: data.mtdr_no || null,
      slip_url: data.deposit_slip_url || null,
      status: 'Active'
    }]);

    if (error) throw error;
    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error("FD Error:", error.message);
    return jsonResponse({ success: false, message: error.message }, 500);
  }
}