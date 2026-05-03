import { createClient } from "@supabase/supabase-js";

interface DeductionInput {
  type: "late_fine" | "admin_fee" | "custom";
  amount: number;
  description: string;
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, message: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    return new Response(
      JSON.stringify({ success: false, message: "Supabase credentials missing" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(url, key);

  try {
    const { departing_member_id, deductions } = await req.json();
    if (!departing_member_id) throw new Error("departing_member_id required");

    const { data: member } = await supabase
      .from("members")
      .select("*")
      .eq("id", Number(departing_member_id))
      .single();

    if (!member) throw new Error("Member not found");

    const { data: installments } = await supabase
      .from("Installments")
      .select("*")
      .eq("member_id", Number(departing_member_id))
      .eq("status", "Approved");

    const { data: fixedDeposits } = await supabase
      .from("fixed_deposits")
      .select("*")
      .eq("member_id", Number(departing_member_id))
      .in("status", ["Active", "Matured"]);

    const totalInstallments = installments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
    let calculatedInterest = 0;

    if (totalInstallments > 0 && fixedDeposits && fixedDeposits.length > 0) {
      const { data: allInstallments } = await supabase
        .from("Installments")
        .select("*")
        .eq("status", "Approved");

      const societyTotal = allInstallments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
      let totalRealizedInterest = 0;

      fixedDeposits?.forEach((fd: any) => {
        if (fd.status === "Matured") {
          const interest = (fd.amount * fd.interest_rate * fd.tenure_months) / (12 * 100);
          totalRealizedInterest += interest;
        }
      });

      if (societyTotal > 0) {
        calculatedInterest = (totalRealizedInterest / societyTotal) * totalInstallments;
      }
    }

    const subtotal = totalInstallments + calculatedInterest;
    const deductionsTotal = deductions?.reduce((sum: number, d: DeductionInput) => sum + d.amount, 0) || 0;
    const netTransferAmount = subtotal - deductionsTotal;

    return new Response(
      JSON.stringify({
        success: true,
        departing_member: member,
        total_installments: totalInstallments,
        calculated_interest: calculatedInterest,
        subtotal: subtotal,
        deductions: deductionsTotal,
        deductions_breakdown: deductions || [],
        net_transfer_amount: netTransferAmount,
        fixed_deposits: fixedDeposits || [],
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
