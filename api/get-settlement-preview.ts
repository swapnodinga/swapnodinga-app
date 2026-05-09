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
    const { member_id } = body || {};

    if (!member_id) {
      return res.status(400).json({ success: false, message: "member_id required" });
    }

    console.log(`[get-settlement-preview] Calculating for member ${member_id}`);

    // 1. Fetch member info
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("id, full_name, society_id")
      .eq("id", Number(member_id))
      .single();

    if (memberError || !memberData) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    // 2. Get member's approved installments (contribution total)
    const { data: memberInstallments } = await supabase
      .from("Installments")
      .select("amount, status")
      .eq("member_id", Number(member_id));

    const approvedInstallments = (memberInstallments || []).filter((i: any) =>
      i.status?.toLowerCase() === "approved"
    );
    const memberContribution = approvedInstallments.reduce(
      (sum: number, i: any) => sum + Number(i.amount || 0),
      0
    );

    // 3. Get unpaid (pending) installments
    const pendingInstallments = (memberInstallments || []).filter((i: any) =>
      i.status?.toLowerCase() === "pending"
    );
    const unpaidAmount = pendingInstallments.reduce(
      (sum: number, i: any) => sum + Number(i.amount || 0),
      0
    );

    // 4. Calculate member's dividend share
    // Get all members and their contributions to calculate society pool
    const { data: allMembers } = await supabase.from("members").select("id");
    const { data: allInstallments } = await supabase
      .from("Installments")
      .select("member_id, amount, status");

    const totalSocietyContribution = (allInstallments || [])
      .filter((i: any) => i.status?.toLowerCase() === "approved")
      .reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

    // Get total realized interest from fixed deposits
    const { data: fixedDeposits } = await supabase
      .from("fixed_deposits")
      .select("*");

    let totalRealizedInterest = 0;
    const today = new Date();

    (fixedDeposits || []).forEach((fd: any) => {
      const start = new Date(fd.start_date);
      const tenure = Number(fd.tenure_months) || 3;
      const maturity = new Date(start);
      maturity.setMonth(maturity.getMonth() + tenure);

      // Only add interest if the cycle is finished
      if (maturity <= today) {
        const interest = (Number(fd.amount) * Number(fd.interest_rate) * tenure) / 1200;
        totalRealizedInterest += interest;
      }
    });

    // Calculate member's share of dividend
    const memberEquityShare =
      totalSocietyContribution > 0
        ? (memberContribution / totalSocietyContribution) * totalRealizedInterest
        : 0;

    // 5. Get member's fixed deposits
    const { data: memberFDs } = await supabase
      .from("fixed_deposits")
      .select("*")
      .eq("member_id", Number(member_id));

    const memberFDDetails = (memberFDs || []).map((fd: any) => {
      const start = new Date(fd.start_date);
      const tenure = Number(fd.tenure_months) || 3;
      const maturity = new Date(start);
      maturity.setMonth(maturity.getMonth() + tenure);

      const interest = (Number(fd.amount) * Number(fd.interest_rate) * tenure) / 1200;
      const isMatured = maturity <= today;
      const maturityAmount = Number(fd.amount) + interest;

      return {
        id: fd.id,
        amount: Number(fd.amount),
        interest_rate: Number(fd.interest_rate),
        tenure_months: Number(fd.tenure_months),
        start_date: fd.start_date,
        status: isMatured ? "MATURED" : "ACTIVE",
        calculated_interest: interest,
        maturity_amount: isMatured ? maturityAmount : Number(fd.amount),
        maturity_date: maturity.toISOString().split("T")[0]
      };
    });

    // 6. Calculate deductions
    const CLOSING_FEE = 500; // Fixed closing fee
    const EARLY_EXIT_PENALTY_PERCENT = 5; // 5% of contribution if exiting early

    // Check if member has active FDs (early exit scenario)
    const hasActiveFDs = memberFDDetails.some((fd: any) => fd.status === "ACTIVE");
    const earlyExitPenalty = hasActiveFDs ? (memberContribution * EARLY_EXIT_PENALTY_PERCENT) / 100 : 0;

    const totalDeductions = unpaidAmount + CLOSING_FEE + earlyExitPenalty;

    // 7. Calculate net transfer amount
    const totalFDMaturity = memberFDDetails.reduce(
      (sum: number, fd: any) => sum + fd.maturity_amount,
      0
    );
    const netTransferAmount =
      memberContribution + memberEquityShare + totalFDMaturity - totalDeductions;

    const preview = {
      member_id: Number(member_id),
      member_name: memberData.full_name,
      society_id: memberData.society_id,
      contribution_total: memberContribution,
      earned_dividends: memberEquityShare,
      fixed_deposits: memberFDDetails,
      fixed_deposits_total_maturity: totalFDMaturity,
      deductions: {
        unpaid_installments: unpaidAmount,
        closing_fee: CLOSING_FEE,
        early_exit_penalty: earlyExitPenalty,
        total: totalDeductions
      },
      calculated_interest: memberEquityShare,
      net_transfer_amount: Math.max(0, netTransferAmount),
      summary: {
        inflow: memberContribution + memberEquityShare + totalFDMaturity,
        outflow: totalDeductions,
        net_payout: Math.max(0, netTransferAmount)
      }
    };

    console.log(`[get-settlement-preview] Preview calculated:`, preview);
    return res.status(200).json({ success: true, data: preview });
  } catch (err: any) {
    console.error("[get-settlement-preview] Handler error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unknown error" });
  }
}
