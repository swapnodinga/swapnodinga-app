import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    return res.status(500).json({ success: false, message: "Supabase credentials missing" });
  }

  const supabase = createClient(url, key);

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { member_id, status, onboarding_type } = body || {};

    if (!member_id) {
      return res.status(400).json({ success: false, message: "member_id required" });
    }

    const normalizedStatus = String(status || "").toLowerCase().trim();
    if (!["active", "frozen", "deactivated"].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Valid status is required" });
    }

    console.log(`[set-member-status] Updating member ${member_id} => ${normalizedStatus}`);

    const updatePayload: Record<string, any> = { status: normalizedStatus };
    if (normalizedStatus === "active") {
      updatePayload.onboarding_type = onboarding_type === "full_replacement" ? "full_replacement" : "fresh_start";
    }

    const { error } = await supabase
      .from("members")
      .update(updatePayload)
      .eq("id", Number(member_id));

    if (error) {
      console.error("[set-member-status] Supabase update error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("[set-member-status] Handler error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unknown error" });
  }
}
