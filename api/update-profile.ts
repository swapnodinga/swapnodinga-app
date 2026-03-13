import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // 1. Handle Preflight and CORS properly for Node.js
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Vercel automatically parses JSON bodies, so we just grab it
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { member_email, data } = body;

    if (!member_email) throw new Error("member_email is required");
    if (!data) throw new Error("Data object is required");

    // 3. Update the database
    const { error: updateError } = await supabase
      .from("members")
      .update(data)
      .eq("email", member_email);

    if (updateError) throw updateError;

    // 4. Fetch the newly updated data to send back
    const { data: updatedData, error: fetchError } = await supabase
      .from("members")
      .select("*")
      .eq("email", member_email)
      .single();

    if (fetchError) throw fetchError;

    // 5. CRITICAL FIX: Send the response using res.status().json()
    // This immediately closes the connection so the frontend updates instantly!
    return res.status(200).json({ success: true, data: updatedData });
    
  } catch (error: any) {
    console.error("API Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}