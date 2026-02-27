import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Set CORS headers to allow frontend communication
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 2. Strict Method Check
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY; 
    
    if (!url || !key) {
      console.error("Missing Environment Variables");
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    const supabase = createClient(url, key);

    // 3. Logic Fix: Robust body parsing for Vercel
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { member_id, memberName, society_id, amount, payment_proof_url, proofPath, month } = body;

    // 4. Validation
    if (!member_id || !amount || !month) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // 5. Database Insert
    const { error } = await supabase.from("Installments").insert([{
      member_id,
      memberName,
      society_id,
      amount: Number(amount),
      payment_proof_url,
      proofPath,
      month,
      status: "Pending", // Member submitted, waiting for admin approval [cite: 2025-12-31]
      created_at: new Date().toISOString(),
    }]);

    if (error) {
      console.error("Supabase Insert Error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    // 6. SUCCESS RESPONSE (This is what clears the "PROCESSING..." state in UI)
    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error("Global API Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}