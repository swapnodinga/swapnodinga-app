import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });

  const path = String(req.query.path || "").trim();
  const filename = String(req.query.filename || "settlement-report.html").trim();

  if (!path) {
    return res.status(400).json({ success: false, message: "path query parameter is required" });
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase.storage.from("payments").download(path);

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: error?.message || "Report file not found",
      });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/\"/g, "")}"`);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(buffer);
  } catch (err: any) {
    console.error("Download settlement report error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to download report" });
  }
}