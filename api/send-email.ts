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

      // Extract report info directly from settlement_data
      const reportHtml = settlement_data?.report_html || "Settlement Report - No HTML generated";
      const formatAmount = (value: any) => `৳${Math.round(Number(value || 0)).toLocaleString("en-US")}`;
      const societyId = settlement_data?.society_id || settlement_data?.societyId || "N/A";
      const memberNameReport = settlement_data?.member_name || settlement_data?.memberName || member_name;
      const contributionTotal = Number(settlement_data?.contribution_total || 0);
      const earnedDividends = Number(settlement_data?.earned_dividends || 0);
      const totalInflow = Number(settlement_data?.total_inflow || 0);
      const totalDeductions = Number(
        settlement_data?.total_selected_deductions ??
        settlement_data?.total_deductions ??
        0
      );
      const netAmount = Number(
        settlement_data?.net_settlement_amount ??
        settlement_data?.net_transfer_amount ??
        Math.max(0, totalInflow - totalDeductions)
      );

      const subject = `Settlement Report - ${societyId || "Cooperative Society"}`;

      // Build a short apology message and report HTML to include in the email
      const apologyHtml = `
        <p>Dear ${member_name},</p>
        <p>We are sorry to see you leave the cooperative society. Please find your settlement report attached as a downloadable link below.</p>
        <p>You can expect to receive the payment within one week. If you have any questions, please reply to this email.</p>
        <p><strong>Member:</strong> ${memberNameReport}</p>
        <p><strong>Society ID:</strong> ${societyId}</p>
        <hr />
      `;
      const reportDownloadHtml = reportHtml;

      let reportDownloadUrl = settlement_data?.report_download_url || "";
      
      // If no download URL provided, try to upload the report
      if (!reportDownloadUrl && reportHtml) {
        try {
          const reportFileName = `settlement-reports/${String(societyId).replace(/[^a-zA-Z0-9_-]/g, "-")}-${Date.now()}.html`;
          const { error: uploadError } = await supabase.storage
            .from("payments")
            .upload(reportFileName, reportHtml, {
              contentType: "text/html",
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
      }

      const bodyHtml = `
        <div style="font-family: Arial, sans-serif; color:#111827; line-height:1.6;">
          ${apologyHtml}
          <div style="margin:20px 0; padding:18px; border:1px solid #dbe4ef; border-radius:14px; background:#f8fafc;">
            <p style="margin:0 0 12px; font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#64748b;">Report Summary</p>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr>
                <td style="padding:8px 0; color:#64748b;">Member</td>
                <td style="padding:8px 0; text-align:right; font-weight:700;">${memberNameReport}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#64748b;">Society ID</td>
                <td style="padding:8px 0; text-align:right; font-weight:700; font-family:monospace;">${societyId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#64748b;">Contributions</td>
                <td style="padding:8px 0; text-align:right; font-weight:700; font-family:monospace;">${formatAmount(contributionTotal)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#64748b;">Dividends</td>
                <td style="padding:8px 0; text-align:right; font-weight:700; font-family:monospace;">${formatAmount(earnedDividends)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#64748b;">Total Inflow</td>
                <td style="padding:8px 0; text-align:right; font-weight:700; font-family:monospace;">${formatAmount(totalInflow)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#64748b;">Total Deductions</td>
                <td style="padding:8px 0; text-align:right; font-weight:700; font-family:monospace; color:#b91c1c;">${formatAmount(totalDeductions)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0 0; color:#64748b; font-weight:700;">Net Settlement Amount</td>
                <td style="padding:8px 0 0; text-align:right; font-weight:900; font-family:monospace; color:#059669;">${formatAmount(netAmount)}</td>
              </tr>
            </table>
          </div>
          ${reportDownloadUrl ? `
            <div style="margin-top:24px; text-align:center; border-top:1px solid #e5e7eb; padding-top:24px;">
              <a href="${reportDownloadUrl}" download="settlement-report-${societyId}.html" style="display:inline-block; background:#10b981; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:9999px; font-weight:700; font-size:14px; border:none; cursor:pointer;">
                Download Report
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