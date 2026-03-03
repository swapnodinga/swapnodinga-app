import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { email, password } = req.body;
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin-level auth check
  );

  try {
    // Verify credentials officially
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (authError) throw authError;

    // Fetch the associated member data
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("email", email.trim())
      .single();

    if (memberError) throw memberError;

    return res.status(200).json({ 
      success: true, 
      user: { ...authData.user, ...memberData },
      session: authData.session 
    });
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }
}