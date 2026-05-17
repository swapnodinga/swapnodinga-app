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

  const supabase = createClient(url as string, key as string);

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { old_member_id, new_member_id, notes } = body || {};

    if (!old_member_id || !new_member_id) {
      return res.status(400).json({
        success: false,
        message: "old_member_id and new_member_id are required",
      });
    }

    const oldId = Number(old_member_id);
    const newId = Number(new_member_id);

    if (!Number.isFinite(oldId) || !Number.isFinite(newId) || oldId <= 0 || newId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid member IDs" });
    }

    if (oldId === newId) {
      return res.status(400).json({ success: false, message: "Old and new member cannot be the same" });
    }

    const { data: oldMember, error: oldErr } = await supabase
      .from("members")
      .select("id, full_name, society_id, status")
      .eq("id", oldId)
      .single();

    if (oldErr || !oldMember) {
      return res.status(404).json({ success: false, message: "Old member not found" });
    }

    const { data: newMember, error: newErr } = await supabase
      .from("members")
      .select("id, full_name, society_id, status")
      .eq("id", newId)
      .single();

    if (newErr || !newMember) {
      return res.status(404).json({ success: false, message: "New member not found" });
    }

    // Call transactional Postgres function to perform the replacement atomically
    const dryRun = Boolean(req.query?.dry_run === '1' || req.query?.dry_run === 'true' || req.body?.dry_run === true);
    const adminId = req.body?.admin_id ? Number(req.body.admin_id) : null;

    const { data, error } = await supabase.rpc('replace_member_records', {
      p_old_id: oldId,
      p_new_id: newId,
      p_admin_id: adminId,
      p_notes: notes || null,
      p_dry_run: dryRun,
    });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, message: 'Member replacement executed', result: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Unknown error" });
  }
}
