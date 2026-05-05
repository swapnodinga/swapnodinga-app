import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    return res.status(500).json({ success: false, message: "Supabase credentials missing" });
  }

  const supabase = createClient(url, key);

  try {
    const { member_id } = req.body;
    if (!member_id) throw new Error("member_id required");

    const { error } = await supabase
      .from("members")
      .update({ status: "frozen" })
      .eq("id", Number(member_id));

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Member frozen successfully",
    });
  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unknown error" });
  }
}
