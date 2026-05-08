import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    return new Response(JSON.stringify({ success: false, message: "Supabase credentials missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(url, key);

  try {
    const { member_id, status } = await req.json();
    if (!member_id) throw new Error("member_id required");

    const normalizedStatus = String(status || "").toLowerCase().trim();
    if (!["active", "frozen", "deactivated"].includes(normalizedStatus)) {
      throw new Error("Valid status is required");
    }

    console.log(`[set-member-status] Updating member ${member_id} => ${normalizedStatus}`);

    const updateResponse = await fetch(`${url}/rest/v1/members?id=eq.${Number(member_id)}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ status: normalizedStatus }),
    });

    const updateText = await updateResponse.text();
    console.log(`[set-member-status] Supabase response ${updateResponse.status}:`, updateText || "<empty>");

    if (!updateResponse.ok) {
      throw new Error(updateText || `Failed to update member status (${updateResponse.status})`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}