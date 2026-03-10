import { createClient } from "@supabase/supabase-js";

const jsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 
    "Content-Type": "application/json", 
    "Access-Control-Allow-Origin": "*" 
  }
});

export default async function handler(req: any, res?: any) {
  // 1. Handle CORS/Methods
  if (req.method === "OPTIONS") {
    return res ? res.status(204).end() : jsonResponse(null, 204);
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // 2. Extract JSON safely
    let reqData;
    if (typeof req.json === 'function') {
      reqData = await req.json();
    } else {
      reqData = req.body;
    }

    const { action, data, fd_id } = reqData;
    const payload = data || {};

    // 3. Logic for Add or Update
    if (action === "add" || action === "update") {
      const fdEntry = {
        society_id: payload.society_id || "SCS-001", 
        member_id: payload.member_id,
        amount: parseFloat(payload.amount || payload.principal_amount || 0), 
        interest_rate: parseFloat(payload.interest_rate || payload.rate_percent || 0), 
        tenure_months: parseInt(payload.tenure_months || 0),
        start_date: payload.start_date,
        month: payload.month, 
        year: payload.year,   
        status: payload.status || 'Active',
        slip_url: payload.slip_url || payload.deposit_slip_url || null, 
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
    // 4. Logic for Delete (Moved outside the add/update block)
    else if (action === "delete") {
      const { error } = await supabase.from("fixed_deposits").delete().eq("id", fd_id);
      if (error) throw error;
    }

    const successData = { success: true };
    return res ? res.status(200).json(successData) : jsonResponse(successData);

  } catch (e: any) {
    console.error("FD Error:", e.message);
    const errorData = { success: false, message: e.message };
    return res ? res.status(500).json(errorData) : jsonResponse(errorData, 500);
  }
}