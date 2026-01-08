import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { status, memberEmail, proofPath, amount, month, memberName } = await req.json();
    console.log(`Sending ${status} notification to: ${memberEmail}`);

    // 1. Send Email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Swapno Dinga <onboarding@resend.dev>', // Default free tier sender
        to: [memberEmail],
        subject: `Payment ${status} - ${month}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2>Payment ${status}</h2>
            <p>Dear <strong>${memberName}</strong>,</p>
            <p>Your payment for <strong>${month}</strong> has been updated.</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0;"><strong>Amount:</strong></td><td>৳${amount}</td></tr>
              <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td><span style="color: ${status === 'Approved' ? 'green' : 'red'}; font-weight: bold;">${status}</span></td></tr>
            </table>
            <p>Thank you for your contribution.</p>
            <hr />
            <small>Swapno Dinga SCS - Automated Notification</small>
          </div>
        `,
      }),
    });

    const emailResponse = await res.json();
    console.log("Resend API Response:", emailResponse);

    // 2. Storage Cleanup (Deleting proof from bucket)
    if (proofPath) {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { error: storageError } = await supabase.storage.from('payments').remove([proofPath]);
      if (storageError) console.error("Storage Cleanup Error:", storageError.message);
      else console.log(`Deleted proof: ${proofPath}`);
    }

    return new Response(JSON.stringify({ success: true, resendId: emailResponse.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Critical Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})