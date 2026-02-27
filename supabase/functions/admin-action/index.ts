import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { action, requesting_user_id, ...params } = await req.json();
    if (!requesting_user_id || !action) {
      return new Response(JSON.stringify({ error: "Missing requesting_user_id or action" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: requestingUser, error: userError } = await supabaseAdmin
      .from('members').select('id, is_admin').eq('id', Number(requesting_user_id)).single();

    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized: user not found" }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminActions = ['approve_instalment', 'approve_member', 'delete_member', 'add_fixed_deposit', 'update_fixed_deposit', 'delete_fixed_deposit'];
    if (adminActions.includes(action) && !requestingUser.is_admin) {
      return new Response(JSON.stringify({ error: "Unauthorized: admin required" }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: any;

    switch (action) {
      case 'approve_instalment': {
        const { transaction_id, status } = params;
        if (!transaction_id || !['Approved', 'Rejected'].includes(status)) {
          return new Response(JSON.stringify({ error: "Invalid parameters" }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error: dbError } = await supabaseAdmin
          .from('Installments')
          .update({ status, approved_at: new Date().toISOString() })
          .eq('id', transaction_id);
        if (dbError) throw dbError;

        if (status === 'Rejected' && params.proofPath) {
          await supabaseAdmin.storage.from('payments').remove([params.proofPath]);
        }

        result = { success: true };
        break;
      }

      case 'submit_instalment': {
        const { member_id, memberName, society_id, amount, payment_proof_url, proofPath, month } = params;
        if (!member_id || !amount || !month) throw new Error("Missing instalment fields");
        if (Number(member_id) !== requestingUser.id) {
          return new Response(JSON.stringify({ error: "Cannot submit for another member" }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseAdmin.from('Installments').insert([{
          member_id, memberName, society_id, amount: Number(amount),
          payment_proof_url, proofPath, month, status: 'Pending', created_at: new Date().toISOString(),
        }]);
        if (error) throw error;

        result = { success: true };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
