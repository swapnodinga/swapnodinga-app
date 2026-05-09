import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const { member_email, member_name, settlement_data } = req.body;

    if (!member_email || !member_name || !settlement_data) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: member_email, member_name, settlement_data" 
      });
    }

    // Format time for Bangladesh (UTC+6)
    const localTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      dateStyle: "medium",
      timeStyle: "short"
    });

    const netAmount = settlement_data.net_settlement_amount ?? 
      (settlement_data.total_inflow - settlement_data.total_selected_deductions);

    // Calculate total deductions for display
    let totalDeductionAmount = 0;
    let deductionSummary = [];
    try {
      if (settlement_data.deductions && typeof settlement_data.deductions === 'object') {
        Object.entries(settlement_data.deductions).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object' && value.selected) {
            totalDeductionAmount += Number(value.amount || 0);
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            deductionSummary.push(`${label}: ৳${Number(value.amount || 0).toLocaleString('en-US', {maximumFractionDigits: 0})}`);
          }
        });
      }
    } catch (e) {
      console.error('Error processing deductions:', e);
    }

    const subject = `Settlement Report - ${settlement_data.society_id || "Cooperative Society"}`;

    // Send via EmailJS using a simpler template params format
    const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: member_email,
          member_name: member_name,
          subject: subject,
          society_id: settlement_data.society_id || 'N/A',
          contributions: Number(settlement_data.contribution_total || 0).toLocaleString('en-US', {maximumFractionDigits: 0}),
          dividends: Number(settlement_data.earned_dividends || 0).toLocaleString('en-US', {maximumFractionDigits: 0}),
          fixed_deposits: Number(settlement_data.fixed_deposits_total_maturity || 0).toLocaleString('en-US', {maximumFractionDigits: 0}),
          total_inflow: Number(settlement_data.total_inflow || 0).toLocaleString('en-US', {maximumFractionDigits: 0}),
          total_deductions: totalDeductionAmount.toLocaleString('en-US', {maximumFractionDigits: 0}),
          net_amount: Math.max(0, Math.round(netAmount)).toLocaleString('en-US', {maximumFractionDigits: 0}),
          time: localTime
        },
      }),
    });

    const result = await emailRes.text();
    if (!emailRes.ok) {
      console.error("EmailJS Error:", result);
      throw new Error(`Email service error: ${result}`);
    }

    return res.status(200).json({ 
      success: true, 
      message: `Settlement report sent to ${member_email}`,
      recipient: member_email,
      sent_at: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Settlement Email API Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

