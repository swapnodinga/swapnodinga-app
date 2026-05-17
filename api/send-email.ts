import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const getBaseUrl = () => {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

const formatMoney = (value: any) => `Tk ${Math.round(Number(value || 0)).toLocaleString("en-US")}`;

const getLogoBuffer = () => {
  const logoPath = path.join(process.cwd(), "client", "src", "assets", "generated_images", "SwapnoDinga_Logo_Update.png");

  try {
    return fs.readFileSync(logoPath);
  } catch {
    return null;
  }
};

const buildSettlementPdfBuffer = async (data: {
  memberName: string;
  societyId: string;
  contributionTotal: number;
  earnedDividends: number;
  totalInflow: number;
  totalDeductions: number;
  netAmount: number;
  deductions: Array<{ label: string; amount: number }>;
}) => {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks: Buffer[] = [];
    const logoBuffer = getLogoBuffer();

    doc.on("data", (chunk: Buffer | Uint8Array) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (logoBuffer) {
      doc.image(logoBuffer, 250, 42, { width: 100 });
      doc.moveDown(5.5);
      doc.fontSize(10).font("Helvetica-Oblique").fillColor("#2d5a4a").text("Sobar Jonno Somoyon, Swapnodinga-r Ayojon", { align: "center" });
      doc.moveDown(0.6);
      doc.fontSize(22).font("Helvetica-Bold").fillColor("#111827").text("Settlement Report", { align: "center" });
      doc.moveDown(0.4);
      doc.fontSize(11).font("Helvetica").fillColor("#64748b").text("Cooperative Society member settlement summary", { align: "center" });
      doc.moveDown(1);
    } else {
      doc.fontSize(22).font("Helvetica-Bold").text("Settlement Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica").fillColor("#64748b").text("Cooperative Society member settlement summary", { align: "center" });
      doc.moveDown(1.2);
    }

    doc.fillColor("#111827").fontSize(13).font("Helvetica-Bold").text(`Member: ${data.memberName}`);
    doc.font("Helvetica-Bold").text(`Society ID: ${data.societyId}`);
    doc.moveDown(1);

    const summaryRows = [
      ["Contributions", formatMoney(data.contributionTotal)],
      ["Dividends", formatMoney(data.earnedDividends)],
      ["Total Inflow", formatMoney(data.totalInflow)],
    ];

    summaryRows.forEach(([label, value]) => {
      doc.fontSize(12).font("Helvetica").fillColor("#475569").text(label, { continued: true });
      doc.fillColor("#111827").font("Helvetica-Bold").text(value, { align: "right" });
      doc.moveDown(0.4);
    });

    doc.moveDown(0.6);
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#dbe4ef").stroke();
    doc.moveDown(0.8);

    doc.fontSize(13).font("Helvetica-Bold").fillColor("#b91c1c").text("Deductions");
    doc.moveDown(0.4);

    data.deductions.forEach((deduction) => {
      doc.fontSize(11).font("Helvetica").fillColor("#334155").text(deduction.label, { continued: true });
      doc.fillColor("#b91c1c").font("Helvetica-Bold").text(formatMoney(deduction.amount), { align: "right" });
      doc.moveDown(0.25);
    });

    doc.moveDown(0.2);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#991b1c").text("Total Deductions", { continued: true });
    doc.fillColor("#b91c1c").text(formatMoney(data.totalDeductions), { align: "right" });

    doc.moveDown(0.7);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#065f46").text("Net Settlement Amount", { continued: true });
    doc.fillColor("#059669").text(formatMoney(data.netAmount), { align: "right" });

    doc.moveDown(1);
    doc.fontSize(10).fillColor("#64748b").text(`Generated on ${new Date().toLocaleString("en-GB")}`, { align: "center" });

    doc.moveDown(0.8);
    doc.fontSize(9).fillColor("#64748b").text("This is system auto generated report, please contact with swapnodinga admin, if you notice any mismatch", {
      align: "center",
      width: 420,
      lineGap: 2,
    });

    doc.end();
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET" && req.query.download === "1") {
    const path = String(req.query.path || "").trim();
    const filename = String(req.query.filename || "settlement-report.html").trim();

    if (!path) {
      return res.status(400).json({ success: false, message: "path query parameter is required" });
    }

    try {
      const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data, error } = await supabase.storage.from("payments").download(path);

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: error?.message || "Report file not found",
        });
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      const isPdf = filename.toLowerCase().endsWith(".pdf") || path.toLowerCase().endsWith(".pdf");

      res.setHeader("Content-Type", isPdf ? "application/pdf" : "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/\"/g, "")}"`);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).send(buffer);
    } catch (err: any) {
      console.error("Download settlement report error:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to download report" });
    }
  }
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
      const societyId = settlement_data?.society_id || settlement_data?.societyId || "N/A";
      const memberNameReport = settlement_data?.member_name || settlement_data?.memberName || member_name;
      const contributionTotal = Number(settlement_data?.contribution_total || 0);
      const earnedDividends = Number(settlement_data?.earned_dividends || 0);
      const totalInflow = Number(settlement_data?.total_inflow || 0);
      const deductionsList = Array.isArray(settlement_data?.deductions)
        ? settlement_data.deductions
            .filter((entry: any) => entry && entry.selected !== false)
            .map((entry: any) => ({ label: String(entry.label || entry.key || "Deduction"), amount: Number(entry.amount || 0) }))
        : [];
      const totalDeductions = Number(
        settlement_data?.total_selected_deductions ??
        settlement_data?.total_deductions ??
        deductionsList.reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0) ??
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
      const reportSummaryForPdf = {
        memberName: memberNameReport,
        societyId,
        contributionTotal,
        earnedDividends,
        totalInflow,
        totalDeductions,
        netAmount,
        deductions: deductionsList.length > 0
          ? deductionsList
          : [
              { label: "Unpaid Installments", amount: Number(settlement_data?.unpaid_installments || 0) },
              { label: "Closing Fee", amount: Number(settlement_data?.closing_fee || 0) },
              { label: "Disclosure Fee", amount: Number(settlement_data?.disclosure_fee || 0) },
              { label: "Society Fee", amount: Number(settlement_data?.society_fee || 0) },
              { label: "Early Settlement Fee", amount: Number(settlement_data?.early_settlement_fee || 0) },
            ],
      };

      let reportDownloadUrl = settlement_data?.report_download_url || "";
      
      // If no download URL provided, generate and upload a PDF report
      if (!reportDownloadUrl) {
        try {
          const pdfBuffer = await buildSettlementPdfBuffer(reportSummaryForPdf);
          const reportFileName = `settlement-reports/${String(societyId).replace(/[^a-zA-Z0-9_-]/g, "-")}-${Date.now()}.pdf`;
          const { error: uploadError } = await supabase.storage
            .from("payments")
            .upload(reportFileName, new Uint8Array(pdfBuffer), {
              contentType: "application/pdf",
              upsert: true,
            });

          if (!uploadError) {
            const downloadFileName = `settlement-report-${String(societyId).replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`;
            reportDownloadUrl = `${getBaseUrl()}/api/send-email?download=1&path=${encodeURIComponent(reportFileName)}&filename=${encodeURIComponent(downloadFileName)}`;
          } else {
            console.error("Settlement PDF upload failed:", uploadError.message);
          }
        } catch (uploadErr) {
          console.error("Settlement PDF generation/upload error:", uploadErr);
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
                <td style="padding:8px 0; text-align:right; font-weight:700; font-family:monospace;">${formatMoney(contributionTotal)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#64748b;">Dividends</td>
                <td style="padding:8px 0; text-align:right; font-weight:700; font-family:monospace;">${formatMoney(earnedDividends)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#64748b;">Total Inflow</td>
                <td style="padding:8px 0; text-align:right; font-weight:700; font-family:monospace;">${formatMoney(totalInflow)}</td>
              </tr>
            </table>
          </div>
          <div style="margin-top:18px; border-top:1px solid #e5e7eb; padding-top:16px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; gap:16px; font-weight:700; color:#64748b;">
              <span>Total Deductions</span>
              <span style="font-family:monospace; color:#b91c1c; padding-right:14px; display:inline-block;">${formatMoney(totalDeductions)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; gap:16px; font-weight:900; color:#065f46;">
              <span>Net Settlement Amount</span>
              <span style="font-family:monospace; color:#059669;">${formatMoney(netAmount)}</span>
            </div>
          </div>
          <div style="margin-top:20px; padding:14px 16px; border:1px dashed #d1d5db; border-radius:12px; color:#64748b; font-size:12px; line-height:1.6; text-align:center; background:#fafafa;">
            This is sytem auto generated report. please communicate with swapnodinga admin, if you have anything mismatch
          </div>
          ${reportDownloadUrl ? `
            <div style="margin-top:24px; text-align:center; border-top:1px solid #e5e7eb; padding-top:24px;">
              <a href="${reportDownloadUrl}" download="settlement-report-${societyId}.pdf" style="display:inline-block; background:#10b981; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:9999px; font-weight:700; font-size:14px; border:none; cursor:pointer;">
                Download PDF Report
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