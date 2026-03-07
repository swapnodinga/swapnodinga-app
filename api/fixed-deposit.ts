import { createClient } from "@supabase/supabase-js";

const jsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
});

export default async function handler(req: any) {
  if (req.method === "OPTIONS") return jsonResponse(null, 204);

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Resilient parsing to handle different Vercel environments
    let data;
    try {
      data = await req.json();
    } catch (e) {
      data = req.body;
    }

    // Use your specific Society ID found in the database
    const societyId = data.society_id || "SCS-001";

    const { error } = await supabase.from("fixed_deposits").insert([{
      society_id: societyId,
      member_id: data.member_id,
      amount: parseFloat(data.amount || data.principal_amount), // Matches CSV column
      interest_rate: parseFloat(data.interest_rate || data.rate_percent), // Matches CSV column
      tenure_months: parseInt(data.tenure_months),
      start_date: data.start_date,
      status: 'Active', // Matches CSV status
      slip_url: data.deposit_slip_url || null,
      mtdr_no: data.mtdr_no || null
    }]);

    if (error) throw error;
    return jsonResponse({ success: true });
  } catch (e: any) {
    console.error("FD Error:", e.message);
    return jsonResponse({ success: false, message: e.message }, 500);
  }
}