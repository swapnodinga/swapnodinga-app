import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Optional CORS support
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({
      success: false,
      message: "Supabase credentials missing",
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const email = body?.email?.trim();
    const password = body?.password;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    const { data: passwordValid, error: verifyError } = await supabase.rpc(
      "check_member_password",
      {
        p_email: email,
        p_password: password,
      }
    );

    if (verifyError) {
      return res
        .status(500)
        .json({ success: false, message: verifyError.message });
    }

    if (!passwordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const { data: member, error: fetchError } = await supabase
      .from("members")
      .select(
        "id, full_name, email, society_id, status, is_admin, profile_pic, phone, address, role, fixed_deposit_amount, fixed_deposit_interest, created_at, updated_at"
      )
      .eq("email", email)
      .single();

    if (fetchError || !member) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (member.status !== "active") {
      return res
        .status(403)
        .json({ success: false, message: "Account not active" });
    }

    return res.status(200).json({ success: true, user: member });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: err?.message || "Internal server error" });
  }
}
