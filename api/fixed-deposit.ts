import { createClient } from "@supabase/supabase-js";

const jsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
});

export default async function handler(req: any) {
  if (req.method === "OPTIONS") return jsonResponse(null, 204);

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Resilient body parsing
    const body = await req.json().catch(() => req.body);
    const data = typeof body === 'string' ? JSON.parse(body) : body;

    // FIX: Provide a fallback society_id if data.society_id is null
    const finalSocietyId = data.society_id || "default_society_id_here"; 

    const { error } = await supabase.from("fixed_deposits").insert([{
      society_id: finalSocietyId, 
      member_id: data.member_id,
      principal_amount: parseFloat(data.principal_amount),
      rate_percent: parseFloat(data.rate_percent),
      tenure_months: parseInt(data.tenure_months),
      start_date: data.start_date,
      deposit_slip_url: data.deposit_slip_url || null
    }]);

    if (error) throw error;
    return jsonResponse({ success: true });
  } catch (e: any) {
    console.error("FD Error:", e.message);
    return jsonResponse({ success: false, message: e.message }, 500);
  }
}