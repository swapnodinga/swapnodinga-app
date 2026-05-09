import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const { member_name, member_email, amount, month, status, proof_url, email_type, settlement_data } = req.body;

    // Format time for Bangladesh (UTC+6)
    const localTime = new Date().toLocaleString("en-US", { 
      timeZone: "Asia/Dhaka",
      dateStyle: "medium",
      timeStyle: "short"
    });

    // Handle settlement report emails
    if (email_type === "settlement") {
      if (!settlement_data) {
        return res.status(400).json({ 
          success: false, 
          message: "settlement_data required for settlement email type" 
        });
      }

      // Calculate net amount
      const netAmount = settlement_data.net_settlement_amount || 
        (settlement_data.total_inflow - settlement_data.total_selected_deductions);

      // Calculate total deductions
      let totalDeductionAmount = 0;
      if (settlement_data.deductions && typeof settlement_data.deductions === 'object') {
        try {
          Object.entries(settlement_data.deductions).forEach(([_key, value]: [string, any]) => {
            if (value && typeof value === 'object' && value.selected && value.amount) {
              totalDeductionAmount += Number(value.amount);
            }
          });
        } catch (e) {
          console.error('Error calculating deductions:', e);
        }
      }

      const subject = `Settlement Report - ${settlement_data.society_id || "Cooperative Society"}`;

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
            society_id: settlement_data.society_id || "N/A",
            contributions: String(Math.round(settlement_data.contribution_total || 0)),
            dividends: String(Math.round(settlement_data.earned_dividends || 0)),
            fixed_deposits: String(Math.round(settlement_data.fixed_deposits_total_maturity || 0)),
            total_inflow: String(Math.round(settlement_data.total_inflow || 0)),
            total_deductions: String(Math.round(totalDeductionAmount)),
            net_amount: String(Math.round(Math.max(0, netAmount))),
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
    }

    // Handle regular instalment/transaction emails (default)
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
          amount: amount,
          month: month,
          status: status,
          proof_url: proof_url || "No proof attached",
          time: localTime
        },
      }),
    });

    const result = await emailRes.text();
    if (!emailRes.ok) throw new Error(result);

    return res.status(200).json({ success: true, message: "Email sent" });
  } catch (err: any) {
    console.error("Email API Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}