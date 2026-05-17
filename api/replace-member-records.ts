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

    // 1) Transfer installments/transactions.
    const { error: installmentsErr } = await supabase
      .from("Installments")
      .update({
        member_id: newId,
        memberName: newMember.full_name,
        society_id: newMember.society_id,
      })
      .eq("member_id", oldId);

    if (installmentsErr) {
      return res.status(500).json({ success: false, message: installmentsErr.message });
    }

    // 2) Transfer fixed deposits.
    const { error: fdErr } = await supabase
      .from("fixed_deposits")
      .update({
        member_id: newId,
        society_id: newMember.society_id,
      })
      .eq("member_id", oldId);

    if (fdErr) {
      return res.status(500).json({ success: false, message: fdErr.message });
    }

    // 3) Mark old member as replaced/deactivated. Includes fallback for not-yet-migrated columns.
    let { error: oldUpdateErr } = await supabase
      .from("members")
      .update({
        status: "deactivated",
        replaced_by_member_id: newId,
        replaced_at: new Date().toISOString(),
      })
      .eq("id", oldId);

    if (oldUpdateErr?.message?.toLowerCase().includes("replaced_")) {
      ({ error: oldUpdateErr } = await supabase
        .from("members")
        .update({ status: "deactivated" })
        .eq("id", oldId));
    }

    if (oldUpdateErr) {
      return res.status(500).json({ success: false, message: oldUpdateErr.message });
    }

    // 4) Ensure new member is active and tagged as full_replacement if column exists.
    let { error: newUpdateErr } = await supabase
      .from("members")
      .update({
        status: "active",
        onboarding_type: "full_replacement",
      })
      .eq("id", newId);

    if (newUpdateErr?.message?.toLowerCase().includes("onboarding_type")) {
      ({ error: newUpdateErr } = await supabase
        .from("members")
        .update({ status: "active" })
        .eq("id", newId));
    }

    if (newUpdateErr) {
      return res.status(500).json({ success: false, message: newUpdateErr.message });
    }

    return res.status(200).json({
      success: true,
      message: "Member records transferred successfully",
      summary: {
        old_member_id: oldId,
        new_member_id: newId,
        old_member_name: oldMember.full_name,
        new_member_name: newMember.full_name,
        notes: notes || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Unknown error" });
  }
}
