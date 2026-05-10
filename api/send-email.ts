import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSettlementReportHtml, normalizeSettlementReport } from "../shared/settlement-report";

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

      const report = normalizeSettlementReport(settlement_data);
      const reportHtml = buildSettlementReportHtml(settlement_data);

      const subject = `Settlement Report - ${report.societyId || "Cooperative Society"}`;

      // Build a short apology message and report HTML to include in the email
      const apologyHtml = `
        <p>Dear ${member_name},</p>
        <p>We are sorry to see you leave the cooperative society. Please find your settlement report attached as a downloadable link below.</p>
        <p>You can expect to receive the payment within one week. If you have any questions, please reply to this email.</p>
        <p><strong>Member:</strong> ${report.memberName}</p>
        <p><strong>Society ID:</strong> ${report.societyId}</p>
        <hr />
      `;
      const reportDownloadHtml = reportHtml;

      let reportDownloadUrl = "";
      try {
        const reportFileName = `settlement-reports/${String(report.societyId || "member").replace(/[^a-zA-Z0-9_-]/g, "-")}-${Date.now()}.html`;
        const { error: uploadError } = await supabase.storage
          .from("payments")
          .upload(reportFileName, reportDownloadHtml, {
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

      const bodyHtml = `
        <div style="font-family: Arial, sans-serif; color:#111827; line-height:1.6;">
          ${apologyHtml}
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