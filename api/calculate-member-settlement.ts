import { createClient } from "@supabase/supabase-js";

interface DeductionInput {
  type: "late_fine" | "admin_fee" | "custom";
  amount: number;
  description: string;
}

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
    const { departing_member_id, deductions } = req.body;
    if (!departing_member_id) throw new Error("departing_member_id required");

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("id", Number(departing_member_id))
      .single();

    if (memberError || !member) throw new Error("Member not found: " + (memberError?.message || "unknown"));

    const { data: installments, error: instError } = await supabase
      .from("Installments")
      .select("*")
      .eq("member_id", Number(departing_member_id))
      .eq("status", "Approved");

    if (instError) throw new Error("Error fetching installments: " + instError.message);

    const totalInstallments = installments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
    const deductionsTotal = deductions?.reduce((sum: number, d: DeductionInput) => sum + d.amount, 0) || 0;
    const netTransferAmount = totalInstallments - deductionsTotal;

    return res.status(200).json({
      success: true,
      departing_member: member,
      total_installments: totalInstallments,
      calculated_interest: 0,
      subtotal: totalInstallments,
      deductions: deductionsTotal,
      deductions_breakdown: deductions || [],
      net_transfer_amount: netTransferAmount,
      fixed_deposits: [],
    });
  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unknown error" });
  }
}
