import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const { member_name, member_email, amount, month, status, proof_url } = req.body;

    // Fix: Format time for Bangladesh (UTC+6) to resolve the 6-hour discrepancy
    const localTime = new Date().toLocaleString("en-US", { 
      timeZone: "Asia/Dhaka",
      dateStyle: "medium",
      timeStyle: "short"
    });

    const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY, // Critical for Vercel/Node [cite: 2026-02-10]
        template_params: {
          to_email: member_email,    // Dashboard: {{to_email}}
          member_name: member_name,  // Dashboard: {{member_name}}
          amount: amount,
          month: month,
          status: status,
          proof_url: proof_url || "No proof attached", // Dashboard: {{proof_url}} [cite: 2025-12-31]
          time: localTime // Corrected to 9:53 PM local time
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