import { createClient } from "@supabase/supabase-js";

const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
};

export default async function handler(req: any) {
  if (req.method === "OPTIONS") return jsonResponse(null, 204);

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) throw new Error("Missing environment variables");
    const supabase = createClient(supabaseUrl, supabaseKey);

    let data;
    if (typeof req.json === 'function') {
      data = await req.json();
    } else {
      data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    const { error } = await supabase
      .from("members")
      .update({ profile_pic: data.profile_pic_url })
      .eq("auth_id", data.user_id);

    if (error) throw error;
    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error("Profile Error:", error.message);
    return jsonResponse({ success: false, message: error.message }, 500);
  }
}