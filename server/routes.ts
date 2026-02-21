import { type Express } from "express";
import { createServer, type Server } from "http";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn("[routes] Supabase credentials missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env for production.");
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : createClient("https://ivhjokefdwospalrqcmk.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGpva2VmZHdvc3BhbHJxY21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2MTY0OSwiZXhwIjoyMDgxNDM3NjQ5fQ.3Ilfmul7dVrzvvboz74nwUyKuQD34BH_kmpPe5fKt7U");

export async function registerRoutes(app: Express): Promise<Server> {
  
  // 1. LOGIN & AUTH
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data: user, error } = await supabase.from('members').select('*').ilike('email', email.trim()).single();
      if (error || !user || user.password !== password) return res.status(401).json({ success: false, message: "Invalid credentials" });
      const isAdmin = user.email?.toLowerCase() === 'swapnodinga.scs@gmail.com';
      if (user.status !== 'active' && !isAdmin) return res.status(403).json({ success: false, message: "Account pending approval" });
      res.json({ success: true, user: { ...user, is_admin: user.is_admin ?? isAdmin } });
    } catch (err) { res.status(500).json({ success: false }); }
  });

  // 2. REGISTRATION
  app.post("/api/register", async (req, res) => {
    const { full_name, email, password, status } = req.body;
    try {
      const { data: lastMember } = await supabase.from('members').select('society_id').order('id', { ascending: false }).limit(1).maybeSingle();
      let nextId = "SCS-001"; 
      if (lastMember?.society_id?.startsWith('SCS-')) {
        const lastNum = parseInt(lastMember.society_id.split('-')[1]);
        nextId = `SCS-${(lastNum + 1).toString().padStart(3, '0')}`;
      }
      const { data, error } = await supabase.from('members').insert([{ 
        society_id: nextId, full_name, email: email.trim(), password, status: status || 'pending', fixed_deposit_amount: 0, fixed_deposit_interest: 0
      }]).select().single();
      if (error) return res.status(400).json({ success: false, message: error.message });
      res.json({ success: true, user: data, assignedId: nextId });
    } catch (err) { res.status(500).json({ success: false }); }
  });

  // 3. MEMBER DATA
  app.get("/api/members", async (_req, res) => {
    const { data } = await supabase.from('members').select('*').order('id', { ascending: false });
    res.json(data || []);
  });

  // 4. ADMIN MEMBER TOOLS
  app.post('/api/approve-member', async (req, res) => {
    await supabase.from('members').update({ status: 'active' }).eq('id', req.body.id);
    res.json({ success: true });
  });

  app.delete('/api/members/:id', async (req, res) => {
    await supabase.from('members').delete().eq('id', req.params.id);
    res.json({ success: true });
  });

  // 5. SUBMIT INSTALMENT
  app.post("/api/submit-instalment", async (req, res) => {
    try {
      const { memberId, society_id, memberName, amount, proofUrl, proofPath, month, late_fee } = req.body;
      const { data, error } = await supabase.from('Installments').insert([{
        member_id: memberId, society_id, memberName, amount: Number(amount), late_fee: Number(late_fee || 0),
        payment_proof_url: proofUrl, proofPath: proofPath, month, status: 'Pending', created_at: new Date().toISOString() 
      }]).select().single();
      if (error) throw error;
      res.json({ success: true, transaction: data });
    } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
  });

  // 6. DYNAMIC INSTALMENT STATUS UPDATE
  app.post("/api/approve-instalment", async (req, res) => {
    try {
      const { id, status } = req.body; 
      const { data, error } = await supabase
        .from('Installments')
        .update({ 
          status: status, // NO LONGER HARDCODED [cite: 2025-12-31]
          approved_at: status === 'Approved' ? new Date().toISOString() : null 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, transaction: data });
    } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
  });

  // 7. FETCH TRANSACTIONS (try both table names for compatibility)
  app.get("/api/transactions", async (_req, res) => {
    for (const table of ['Installments', 'installments']) {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      if (!error) return res.json(data || []);
    }
    res.json([]);
  });

  return createServer(app);
}