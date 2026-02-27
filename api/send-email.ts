export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { member_name, member_email, amount, month, status, proof_url } = await req.json();

    // Use EmailJS REST API (server-side compatible)
    const serviceId = process.env.EMAILJS_SERVICE_ID || "service_b8gcj9p";
    const templateId = process.env.EMAILJS_TEMPLATE_ID || "template_vi2p4ul";
    const publicKey = process.env.EMAILJS_PUBLIC_KEY || "nKSxYmGpgjuB2J4tF";

    const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: { member_name, member_email, amount, month, status, proof_url },
      }),
    });

    if (!emailRes.ok) throw new Error("EmailJS send failed");

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
