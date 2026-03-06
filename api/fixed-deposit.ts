// pages/api/fixed-deposit.ts
import { createClient } from "@supabase/supabase-js";

// Utility for creating consistent responses
const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Add CORS headers to avoid preflight issues from the frontend
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export default async function handler(req: Request) {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return jsonResponse({ success: false, message: "Method Not Allowed" }, 405);
  }

  // Crucial step: Use try-catch to prevent function crashes from causing the JSON error
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    // Use the SERVICE_ROLE_KEY for server-side operations
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check for missing environment variables immediately
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const data = await req.json();

    // Validate required fields
    const requiredFields = ['society_id', 'member_id', 'principal_amount', 'rate_percent', 'tenure_months', 'start_date'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return jsonResponse({ success: false, message: `Missing fields: ${missingFields.join(', ')}` }, 400);
    }

    // Attempt the insert
    const { data: insertData, error: insertError } = await supabase
      .from("fixed_deposits")
      .insert([
        {
          society_id: data.society_id,
          member_id: data.member_id,
          principal_amount: parseFloat(data.principal_amount),
          rate_percent: parseFloat(data.rate_percent),
          tenure_months: parseInt(data.tenure_months),
          start_date: data.start_date,
          // Optional fields
          interest_realized_amount: data.interest_realized_amount ? parseFloat(data.interest_realized_amount) : 0,
          finish_date: data.finish_date || null,
          deposit_slip_url: data.deposit_slip_url || null,
        },
      ]);

    if (insertError) {
      throw insertError;
    }

    return jsonResponse({ success: true, data: insertData });
  } catch (error: any) {
    // Log the actual error to Vercel function logs for debugging
    console.error("Fixed Deposit Error:", error.message);
    // Return a clean JSON error response
    return jsonResponse({ success: false, message: error.message || "An unexpected error occurred" }, 500);
  }
}