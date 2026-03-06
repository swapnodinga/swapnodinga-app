// pages/api/update-profile.ts
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

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return jsonResponse({ success: false, message: "Method Not Allowed" }, 405);
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    // Use the SERVICE_ROLE_KEY for server-side operations
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, profile_pic_url } = await req.json();

    if (!user_id || !profile_pic_url) {
      return jsonResponse({ success: false, message: "Missing required fields: user_id or profile_pic_url" }, 400);
    }

    // Perform the update on the profile_public table
    const { data: updateData, error: updateError } = await supabase
      .from("profile_public")
      .update({ profile_pic_url: profile_pic_url })
      .eq("user_id", user_id);

    if (updateError) {
      throw updateError;
    }

    return jsonResponse({ success: true, data: updateData });
  } catch (error: any) {
    console.error("Update Profile Error:", error.message);
    return jsonResponse({ success: false, message: error.message || "An unexpected error occurred" }, 500);
  }
}