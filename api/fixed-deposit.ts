import { createClient } from "@supabase/supabase-js";

const jsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 
    "Content-Type": "application/json", 
    "Access-Control-Allow-Origin": "*" 
  }
});

export default async function handler(req: any, res?: any) {
  if (req.method === "OPTIONS") return res ? res.status(204).end() : jsonResponse(null, 204);

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    let reqData;
    if (typeof req.json === 'function') {
      reqData = await req.json();
    } else {
      reqData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    const { action, data, fd_id } = reqData;
    // THIS LINE MUST BE HERE (OUTSIDE THE IF BLOCKS)
    const payload = data || {}; 

    if (action === "add" || action === "update") {
      const fdEntry = {
        society_id: payload.society_id || "SCS-001", 
        member_id: payload.member_id,
        amount: parseFloat(payload.amount || payload.principal_amount || 0), 
        interest_rate: parseFloat(payload.interest_rate || 0), 
        tenure_months: parseInt(payload.tenure_months || 0),
        start_date: payload.start_date,
        month: payload.month, 
        year: payload.year,   
        status: payload.status || 'Active',
        slip_url: payload.slip_url || null, 
        mtdr_no: payload.mtdr_no || null
      };

      if (action === "add") {
        const { error } = await supabase.from("fixed_deposits").insert([fdEntry]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fixed_deposits").update(fdEntry).eq("id", fd_id);
        if (error) throw error;
      }
    } 
    else if (action === "delete") {
      const { error } = await supabase.from("fixed_deposits").delete().eq("id", fd_id);
      if (error) throw error;
    }

    return res ? res.status(200).json({ success: true }) : jsonResponse({ success: true });
  } catch (err: any) {
    return res ? res.status(500).json({ success: false, message: err.message }) : jsonResponse({ success: false, message: err.message }, 500);
  }
}