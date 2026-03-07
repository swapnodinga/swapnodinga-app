import { createClient } from "@supabase/supabase-js";

const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

export default async function handler(req: any) {
  if (req.method === "OPTIONS") return jsonResponse(null, 204);

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Fix for "req.json is not a function"
    let data;
    try {
      data = await req.json();
    } catch (e) {
      data = req.body;
    }

    // Fix for missing society_id
    // Replace "YOUR_ACTUAL_SOCIETY_ID" with the real ID from your societies table
    const societyId = data.society_id || "YOUR_ACTUAL_SOCIETY_ID";

    const { error } = await supabase.from("fixed_deposits").insert([{
      society_id: societyId,
      member_id: data.member_id,
      principal_amount: parseFloat(data.principal_amount),
      rate_percent: parseFloat(data.rate_percent),
      tenure_months: parseInt(data.tenure_months),
      start_date: data.start_date,
      deposit_slip_url: data.deposit_slip_url || null,
    }]);

    if (error) throw error;
    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error("FD Error:", error.message);
    return jsonResponse({ success: false, message: error.message }, 500);
  }
}