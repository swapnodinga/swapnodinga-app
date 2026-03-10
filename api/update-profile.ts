import { createClient } from "@supabase/supabase-js";

const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      "Content-Type": "application/json", 
      "Access-Control-Allow-Origin": "*" 
    },
  });
};

export default async function handler(req: any) {
  // 1. Handle Preflight
  if (req.method === "OPTIONS") return jsonResponse(null, 204);
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Flexible JSON Parsing (Handles Vercel Edge vs Node)
    let body;
    try {
      if (typeof req.json === 'function') {
        body = await req.json();
      } else {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      }
    } catch (e) {
      throw new Error("Invalid JSON payload");
    }

    // 3. Extract data based on your SocietyContext call
    // SocietyContext sends: { member_email: string, data: { profile_pic: string, ... } }
    const { member_email, data } = body;

    if (!member_email) throw new Error("member_email is required");

    // 4. Update the database
    // We use .eq('email', ...) to match your request for email-based unique keys
    const { error } = await supabase
      .from("members")
      .update(data) // Updates profile_pic or any other fields passed in 'data'
      .eq("email", member_email);

    if (error) throw error;

    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error("Profile Update Error:", error.message);
    return jsonResponse({ success: false, message: error.message }, 500);
  }
}