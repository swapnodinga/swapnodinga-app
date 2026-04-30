import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const { action, id, title, file_url, file_name, file_type, file_base64 } = req.body;

    // Get service role key - try multiple possible environment variable names
    const serviceRoleKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    const supabaseUrl = 
      process.env.SUPABASE_URL || 
      process.env.VITE_SUPABASE_URL;

    // Verify environment variables are set
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing environment variables:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      });
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Missing Supabase credentials"
      });
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === "delete") {
      // Delete notice by ID
      const { error } = await supabase
        .from("notices")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      return res.status(200).json({ 
        success: true, 
        message: "Notice deleted successfully" 
      });
    } 

    else if (action === "insert") {
      if (!title) {
        return res.status(400).json({ success: false, message: "Title is required" });
      }

      let finalFileUrl = file_url;

      if (!finalFileUrl) {
        if (!file_base64) {
          return res.status(400).json({ success: false, message: "PDF file is required" });
        }

        const uploadPath = `notices/${Date.now()}-${file_name || "notice.pdf"}`;
        const fileBuffer = Buffer.from(file_base64, "base64");

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(uploadPath, fileBuffer, {
            contentType: file_type || "application/pdf",
            upsert: false,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(uploadPath);
        finalFileUrl = publicUrlData.publicUrl;
      }

      const insertData = {
        title,
        file_url: finalFileUrl,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("notices")
        .insert([insertData]);

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

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
    console.error("Notice Management Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to manage notice",
      details: process.env.NODE_ENV === "development" ? err : undefined
    });
  }
}
