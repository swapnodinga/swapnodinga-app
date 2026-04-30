import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const { action, id, title, file_url } = req.body;

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === "delete") {
      // Delete notice by ID
      const { error } = await supabase
        .from("notices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        message: "Notice deleted successfully" 
      });
    } 

    else if (action === "insert") {
      // Insert new notice
      const { error } = await supabase
        .from("notices")
        .insert([{ title, file_url }]);

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        message: "Notice created successfully" 
      });
    }

    else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid action" 
      });
    }

  } catch (err: any) {
    console.error("Notice Management Error:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to manage notice" 
    });
  }
}
