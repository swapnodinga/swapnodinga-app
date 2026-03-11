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
  // 1. Handle Preflight and Methods
  if (req.method === "OPTIONS") return jsonResponse(null, 204);
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Extract body properly
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

    const { member_email, data } = body;

    if (!member_email) throw new Error("member_email is required");
    if (!data) throw new Error("Data object is required");

    // 3. Update the database
    // We match by email to ensure the correct member is updated
    const { error } = await supabase
      .from("members")
      .update(data) // This will update 'profile_pic' or any other field in the data object
      .eq("email", member_email);

    if (error) throw error;

    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error("Profile Update Error:", error.message);
    return jsonResponse({ success: false, message: error.message }, 500);
  }
}