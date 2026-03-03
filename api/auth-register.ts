import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { full_name, email, password } = req.body;
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Create official Auth User (Auto-confirmed)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });
    if (authError) throw authError;

    // 2. Get next numeric ID
    const { data: currentMembers } = await supabase.from('members').select('id');
    const lastId = currentMembers && currentMembers.length > 0
      ? Math.max(...currentMembers.map((m: any) => m.id))
      : 0;
    const newId = lastId + 1;

    // 3. Insert into members table
    const { error: memberError } = await supabase.from('members').insert([{
      id: newId,
      society_id: `SCS-${String(newId).padStart(3, '0')}`,
      full_name: full_name.trim(),
      email: email.trim(),
      status: 'pending',
      fixed_deposit_amount: 0,
      fixed_deposit_interest: 0,
      is_admin: false,
    }]);
    if (memberError) throw memberError;

    return res.status(200).json({ success: true, message: "Registration successful" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
