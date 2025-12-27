import { type Express } from "express";
import { createServer, type Server } from "http";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ivhjokefdwospalrqcmk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGpva2VmZHdvc3BhbHJxY21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2MTY0OSwiZXhwIjoyMDgxNDM3NjQ5fQ.3Ilfmul7dVrzvvboz74nwUyKuQD34BH_kmpPe5fKt7U";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // 1. LOGIN
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data: user, error } = await supabase
        .from('members')
        .select('*')
        .ilike('email', email.trim())
        .single();

      if (error || !user || user.password !== password) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
      
      const isAdmin = user.email.toLowerCase() === 'swapnodinga.scs@gmail.com';
      if (user.status !== 'active' && !isAdmin) {
        return res.status(403).json({ success: false, message: "Account pending admin approval" });
      }

      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });

  // 2. REGISTRATION
  app.post("/api/register", async (req, res) => {
    const { full_name, email, password, status } = req.body;
    try {
      const { data: lastMember } = await supabase
        .from('members')
        .select('society_id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextId = "SCS-001"; 
      if (lastMember?.society_id && lastMember.society_id.startsWith('SCS-')) {
        const lastNum = parseInt(lastMember.society_id.split('-')[1]);
        nextId = `SCS-${(lastNum + 1).toString().padStart(3, '0')}`;
      }

      const { data, error } = await supabase
        .from('members')
        .insert([{ 
          society_id: nextId,
          full_name: full_name,
          email: email.trim(), 
          password: password, 
          status: status || 'pending', 
          fixed_deposit_amount: 0,
          fixed_deposit_interest: 0
        }])
        .select()
        .single();

      if (error) return res.status(400).json({ success: false, message: error.message });
      res.json({ success: true, user: data, assignedId: nextId });
    } catch (err) {
      res.status(500).json({ success: false, message: "Registration server error" });
    }
  });

  // 3. MEMBER DATA FETCHING
  app.get("/api/members", async (_req, res) => {
    try {
      const { data, error } = await supabase.from('members').select('*').order('id', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to fetch members" });
    }
  });

  // 4. ADMIN TOOLS
  app.post('/api/approve-member', async (req, res) => {
    const { id } = req.body;
    try {
      const { error } = await supabase.from('members').update({ status: 'active' }).eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
  });

  app.delete('/api/members/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
  });

// 5. SUBMIT INSTALMENT (Aligned with Frontend Context)
app.post("/api/submit-instalment", async (req, res) => {
  try {
    // UPDATED: Destructuring keys must match what SocietyContext sends
    const { 
      memberId, 
      society_id,  // Matches SocietyContext key
      memberName, 
      amount, 
      proofUrl, 
      month, 
      late_fee     // Matches SocietyContext key
    } = req.body;

    const { data, error } = await supabase
      .from('Installments') 
      .insert([{
        member_id: memberId,            // int8 (internal DB ID)
        society_id: society_id,         // text (SCS-XXX)
        memberName: memberName,         // text
        amount: Number(amount),         // numeric (Base + Fee)
        late_fee: Number(late_fee || 0),// numeric
        payment_proof_url: proofUrl,    // Exact column name
        month: month,                   // text
        status: 'Pending',              // text
        created_at: new Date().toISOString() 
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error.message);
      return res.status(400).json({ success: false, message: error.message });
    }
    res.json({ success: true, transaction: data });
  } catch (err: any) {
    console.error("Internal Server Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

  // 6. Approve an instalment
  app.post("/api/approve-instalment", async (req, res) => {
    try {
      const { id } = req.body;
      const { data, error } = await supabase
        .from('Installments')
        .update({ 
          status: 'Approved', 
          approved_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      res.json({ success: true, transaction: data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 7. Reject an instalment
  app.post("/api/reject-instalment", async (req, res) => {
    try {
      const { id } = req.body;
      const { data, error } = await supabase
        .from('Installments')
        .update({ status: 'Rejected' })
        .eq('id', id)
        .select();

      if (error) throw error;
      res.json({ success: true, transaction: data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 8. FETCH TRANSACTIONS
  app.get("/api/transactions", async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('Installments')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to fetch transactions" });
    }
  });

  return createServer(app);
}