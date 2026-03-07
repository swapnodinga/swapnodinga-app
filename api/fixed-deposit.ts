import { createClient } from "@supabase/supabase-js";

const jsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 
    "Content-Type": "application/json", 
    "Access-Control-Allow-Origin": "*" 
  }
});

export default async function handler(req: any) {
  if (req.method === "OPTIONS") return jsonResponse(null, 204);

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Safety check for request body to prevent crash
    let data = req.body;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    } else if (!data && typeof req.json === 'function') {
      data = await req.json();
    }

    // Alignment with CSV schema
    const societyId = data.society_id || "SCS-001"; 

    const { error } = await supabase.from("fixed_deposits").insert([{
      society_id: societyId, // Required
      member_id: data.member_id,
      amount: parseFloat(data.amount || data.principal_amount), // CSV Header: amount
      interest_rate: parseFloat(data.interest_rate || data.rate_percent), // CSV Header: interest_rate
      tenure_months: parseInt(data.tenure_months),
      start_date: data.start_date,
      status: 'Active',
      slip_url: data.slip_url || data.deposit_slip_url || null, // CSV Header: slip_url
      mtdr_no: data.mtdr_no || null
    }]);

    if (error) throw error;
    return jsonResponse({ success: true });
  } catch (e: any) {
    console.error("FD Error:", e.message);
    return jsonResponse({ success: false, message: e.message }, 500);
  }
}