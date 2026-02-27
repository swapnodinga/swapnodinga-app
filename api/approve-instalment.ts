import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: any, res: any) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.error("Missing env vars:", { url: !!url, key: !!key });
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    const supabase = createClient(url, key);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { id, status } = body || {};

    if (!id || !status) {
      return res.status(400).json({ success: false, message: "Missing id or status" });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const { data, error } = await supabase
      .from("Installments")
      .update({ status, approved_at: status === "Approved" ? new Date().toISOString() : null })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, transaction: data });
  } catch (err: any) {
    console.error("Handler error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unknown error" });
  }
}
