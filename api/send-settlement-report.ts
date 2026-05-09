import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const { member_email, member_name, settlement_data, html_content } = req.body;

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

    const subject = `Settlement Report - ${settlement_data.society_id || "Cooperative Society"}`;

    // Generate email HTML if not provided
    const emailHtml = html_content || generateSettlementEmailHTML(member_name, settlement_data);

    // Send via EmailJS (matching the existing send-email.ts pattern)
    const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_SETTLEMENT_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: member_email,
          member_name: member_name,
          subject: subject,
          html_content: emailHtml,
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

// Generate HTML email content for settlement report
function generateSettlementEmailHTML(memberName: string, settlement: any): string {
  const netAmount = settlement.net_settlement_amount ?? 
    (settlement.total_inflow - settlement.total_selected_deductions);

  const deductionsHTML = settlement.deductions ? 
    Object.entries(settlement.deductions)
      .map(([key, value]: [string, any]) => {
        if (!value.selected) return '';
        const label = key
          .replace(/_/g, ' ')
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px; color: #374151;">${label}</td>
            <td style="padding: 8px; text-align: right; font-weight: 500;">৳${value.amount?.toLocaleString() || 0}</td>
          </tr>
        `;
      })
      .join('')
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
          .header { background: linear-gradient(135deg, #059669 0%, #0891b2 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 24px; border-radius: 0 0 8px 8px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 14px; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; }
          .member-info { background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
          .member-info p { margin: 4px 0; font-size: 14px; }
          .member-info .member-name { font-size: 16px; font-weight: bold; color: #1f2937; }
          .member-info .member-id { font-size: 12px; color: #6b7280; font-family: monospace; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .summary-row.total { font-weight: bold; border-bottom: 2px solid #e5e7eb; font-size: 16px; }
          .summary-label { color: #4b5563; }
          .summary-value { font-weight: 600; font-family: monospace; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          table th { text-align: left; padding: 8px; background: #f3f4f6; font-weight: bold; font-size: 12px; color: #6b7280; }
          .net-amount { background: #d1fae5; padding: 16px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px solid #10b981; }
          .net-amount .label { font-size: 12px; text-transform: uppercase; font-weight: bold; color: #047857; }
          .net-amount .value { font-size: 32px; font-weight: bold; color: #065f46; font-family: monospace; }
          .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Settlement Report</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Generated on ${new Date().toLocaleDateString('en-GB')}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="member-info">
                <p class="member-name">${memberName}</p>
                <p class="member-id">${settlement.society_id || 'N/A'}</p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Summary</div>
              <div class="summary-row">
                <span class="summary-label">Member Contributions</span>
                <span class="summary-value">৳${(settlement.contribution_total || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Earned Dividends</span>
                <span class="summary-value">৳${(settlement.earned_dividends || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              ${settlement.fixed_deposits_total_maturity ? `
              <div class="summary-row">
                <span class="summary-label">Fixed Deposits (Maturity)</span>
                <span class="summary-value">৳${(settlement.fixed_deposits_total_maturity || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              ` : ''}
              <div class="summary-row total">
                <span class="summary-label">Total Inflow</span>
                <span class="summary-value">৳${(settlement.total_inflow || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
            </div>

            ${settlement.deductions && Object.values(settlement.deductions).some((d: any) => d.selected) ? `
            <div class="section">
              <div class="section-title">Deductions</div>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${deductionsHTML}
                  <tr style="font-weight: bold; border-top: 2px solid #e5e7eb;">
                    <td style="padding: 8px;">Total Deductions</td>
                    <td style="padding: 8px; text-align: right;">৳${(settlement.total_selected_deductions || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            ` : ''}

            <div class="net-amount">
              <div class="label">Net Settlement Amount Payable</div>
              <div class="value">৳${Math.max(0, netAmount).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
            </div>

            <div class="footer">
              <p>This is an automated settlement report. Please contact the cooperative society for any queries.</p>
              <p style="margin-top: 8px; color: #9ca3af;">Generated on ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
