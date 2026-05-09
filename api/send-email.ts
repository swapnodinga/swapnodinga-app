import { createClient } from "@supabase/supabase-js";
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

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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

      // Build a short apology message and report HTML to include in the email
      const apologyHtml = `
        <p>Dear ${member_name},</p>
        <p>We are sorry to see you leave the cooperative society. Please find your settlement report below and review the details.</p>
        <p>You can expect to receive the payment within one week. If you have any questions, please reply to this email.</p>
        <hr />
      `;

      const reportRows = [] as string[];
      try {
        reportRows.push(`<tr><td>Contributions</td><td style="text-align:right">৳${String(Math.round(settlement_data.contribution_total || 0))}</td></tr>`);
        reportRows.push(`<tr><td>Dividends</td><td style="text-align:right">৳${String(Math.round(settlement_data.earned_dividends || 0))}</td></tr>`);
        if (settlement_data.fixed_deposits_total_maturity) {
          reportRows.push(`<tr><td>Fixed Deposits (Maturity)</td><td style="text-align:right">৳${String(Math.round(settlement_data.fixed_deposits_total_maturity || 0))}</td></tr>`);
        }
        reportRows.push(`<tr><td><strong>Total Inflow</strong></td><td style="text-align:right"><strong>৳${String(Math.round(settlement_data.total_inflow || 0))}</strong></td></tr>`);

        if (settlement_data.deductions && typeof settlement_data.deductions === 'object') {
          Object.entries(settlement_data.deductions).forEach(([k, v]: [string, any]) => {
            if (v && v.selected) {
              const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
              reportRows.push(`<tr><td>${label}</td><td style="text-align:right">৳${String(Math.round(v.amount || 0))}</td></tr>`);
            }
          });
        }

        reportRows.push(`<tr><td><strong>Total Deductions</strong></td><td style="text-align:right"><strong>৳${String(Math.round(totalDeductionAmount))}</strong></td></tr>`);
        reportRows.push(`<tr><td><strong>Net Settlement Amount Payable</strong></td><td style="text-align:right"><strong>৳${String(Math.round(Math.max(0, netAmount)))}</strong></td></tr>`);
      } catch (e) {
        console.error('Error building report rows:', e);
      }

      const reportHtml = `
        <div style="font-family: Arial, sans-serif; color:#111827; margin:20px 0;">
          <h3 style="margin:16px 0 12px; font-size:18px; color:#0f172a; border-bottom:2px solid #10b981; padding-bottom:8px;">Settlement Report</h3>
          <p style="margin:8px 0; font-weight:bold;"><strong>Member:</strong> ${member_name}</p>
          <p style="margin:8px 0; font-weight:bold;"><strong>Society ID:</strong> ${settlement_data.society_id || 'N/A'}</p>
          <table style="width:100%; border-collapse:collapse; margin-top:16px; border:1px solid #ddd;">
            <tbody>
              ${reportRows.map((row: string) => `<tr style="border:1px solid #ddd; background:#f9fafb;">${row.replace(/<tr>/g, '').replace(/<\/tr>/g, '')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;

      const downloadableSettlementHtml = `
        <html>
          <head>
            <meta charSet="utf-8" />
            <title>Settlement Report - ${member_name}</title>
          </head>
          <body style="font-family: Arial, sans-serif; color:#111827; padding:24px;">
            ${apologyHtml}
            ${reportHtml}
          </body>
        </html>
      `;

      let reportDownloadUrl = "";
      try {
        const reportFileName = `settlement-reports/${String(settlement_data.society_id || "member").replace(/[^a-zA-Z0-9_-]/g, "-")}-${Date.now()}.html`;
        const { error: uploadError } = await supabase.storage
          .from("payments")
          .upload(reportFileName, new Blob([downloadableSettlementHtml], { type: "application/octet-stream" }), {
            contentType: "application/octet-stream",
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicData } = supabase.storage.from("payments").getPublicUrl(reportFileName);
          reportDownloadUrl = publicData.publicUrl;
        } else {
          console.error("Settlement report upload failed:", uploadError.message);
        }
      } catch (uploadErr) {
        console.error("Settlement report upload error:", uploadErr);
      }

      const bodyHtml = `
        <div style="font-family: Arial, sans-serif; color:#111827; line-height:1.6;">
          ${apologyHtml}
          ${reportHtml}
          ${reportDownloadUrl ? `
            <div style="margin-top:24px; text-align:center; border-top:1px solid #e5e7eb; padding-top:24px;">
              <p style="margin:0 0 12px; font-weight:700; color:#0f172a; font-size:14px;">Settlement Report</p>
              <a href="${reportDownloadUrl}" style="display:inline-block; background:#10b981; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:9999px; font-weight:700; font-size:14px; border:none;">
                Download Settlement Report
              </a>
            </div>
          ` : ''}
        </div>
      `;

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
            apology_message: apologyHtml,
            report_html: reportHtml,
            report_download_url: reportDownloadUrl,
            body_html: bodyHtml,
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
    // Build a simple HTML body so a single EmailJS template can be reused
    const paymentHtml = `
      <div style="font-family: Arial, sans-serif; color:#111827;">
        <h2>Payment Notification</h2>
        <p>Dear ${member_name},</p>
        <p>Your payment request has been processed. Please find the details below:</p>
        <table style="width:100%; border-collapse:collapse; margin-top:12px;">
          <tbody>
            <tr><td style="padding:8px;">Amount:</td><td style="padding:8px; text-align:right;">৳${String(amount || '')}</td></tr>
            <tr><td style="padding:8px;">Month:</td><td style="padding:8px; text-align:right;">${String(month || '')}</td></tr>
            <tr><td style="padding:8px;">Status:</td><td style="padding:8px; text-align:right;">${String(status || '')}</td></tr>
          </tbody>
        </table>
        ${proof_url ? `
          <div style="margin-top:20px; text-align:center;">
            <p style="margin:0 0 12px; font-weight:700; color:#0f172a;">Payment Proof</p>
            <a href="${proof_url}" style="display:inline-block; background:#10b981; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:9999px; font-weight:700; font-size:14px;">
              Download Payment Proof
            </a>
          </div>
        ` : ''}
      </div>
    `;

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
          subject: `Payment ${status || "Update"} - ${month || "N/A"}`,
          amount: amount,
          month: month,
          status: status,
          proof_url: proof_url || "No proof attached",
          time: localTime,
          body_html: paymentHtml
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