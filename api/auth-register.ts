import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { full_name, email, password } = req.body;
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  try {
    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });
    if (authError) throw authError;

    // 2. MANUAL ID CALCULATION (Fixes the "Identity" error)
    // We look for the highest ID currently in the table
    const { data: maxIdData } = await supabase
      .from('members')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    const nextId = maxIdData && maxIdData.length > 0 ? Number(maxIdData[0].id) + 1 : 1;

    // 3. Insert into members table using the calculated ID
    const { data: newMember, error: memberError } = await supabase
      .from('members')
      .insert([{
        id: nextId, 
        full_name: full_name.trim(),
        email: email.trim(),
        status: 'pending',
        society_id: `SCS-${String(nextId).padStart(3, '0')}`
      }])
      .select()
      .single();

    if (memberError) throw memberError;

    return res.status(200).json({ success: true, user: newMember });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}