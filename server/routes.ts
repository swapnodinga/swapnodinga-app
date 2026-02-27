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

  // ===== AUTH =====

  app.post("/api/auth-login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data: user, error } = await supabase.from('members').select('*').ilike('email', email.trim()).single();
      if (error || !user || user.password !== password) return res.status(401).json({ success: false, message: "Invalid credentials" });
      const isAdmin = user.email?.toLowerCase() === 'swapnodinga.scs@gmail.com';
      if (user.status !== 'active' && !isAdmin) return res.status(403).json({ success: false, message: "Account pending approval" });
      res.json({ success: true, user: { ...user, is_admin: user.is_admin ?? isAdmin } });
    } catch (err) { res.status(500).json({ success: false }); }
  });

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

  app.post("/api/auth-register", async (req, res) => {
    const { full_name, email, password } = req.body;
    try {
      const { data: lastMember } = await supabase.from('members').select('society_id').order('id', { ascending: false }).limit(1).maybeSingle();
      let nextId = "SCS-001";
      if (lastMember?.society_id?.startsWith('SCS-')) {
        const lastNum = parseInt(lastMember.society_id.split('-')[1]);
        nextId = `SCS-${(lastNum + 1).toString().padStart(3, '0')}`;
      }
      const { data, error } = await supabase.from('members').insert([{
        society_id: nextId, full_name, email: email.trim(), password, status: 'pending', fixed_deposit_amount: 0, fixed_deposit_interest: 0
      }]).select().single();
      if (error) return res.status(400).json({ success: false, message: error.message });
      res.json({ success: true, user: data, assignedId: nextId });
    } catch (err) { res.status(500).json({ success: false }); }
  });

  app.post("/api/register", async (req, res) => {
    const { full_name, email, password } = req.body;
    try {
      const { data: lastMember } = await supabase.from('members').select('society_id').order('id', { ascending: false }).limit(1).maybeSingle();
      let nextId = "SCS-001";
      if (lastMember?.society_id?.startsWith('SCS-')) {
        const lastNum = parseInt(lastMember.society_id.split('-')[1]);
        nextId = `SCS-${(lastNum + 1).toString().padStart(3, '0')}`;
      }
      const { data, error } = await supabase.from('members').insert([{
        society_id: nextId, full_name, email: email.trim(), password, status: 'pending', fixed_deposit_amount: 0, fixed_deposit_interest: 0
      }]).select().single();
      if (error) return res.status(400).json({ success: false, message: error.message });
      res.json({ success: true, user: data, assignedId: nextId });
    } catch (err) { res.status(500).json({ success: false }); }
  });

  // ===== MEMBERS =====

  app.get("/api/members", async (_req, res) => {
    const { data } = await supabase.from('members').select('*').order('id', { ascending: false });
    res.json(data || []);
  });

  app.post('/api/approve-member', async (req, res) => {
    const id = req.body.member_id || req.body.id;
    await supabase.from('members').update({ status: 'active' }).eq('id', id);
    res.json({ success: true });
  });

  app.post('/api/delete-member', async (req, res) => {
    const id = req.body.member_id || req.body.id;
    await supabase.from('members').delete().eq('id', id);
    res.json({ success: true });
  });

  app.delete('/api/members/:id', async (req, res) => {
    await supabase.from('members').delete().eq('id', req.params.id);
    res.json({ success: true });
  });

  // ===== INSTALMENTS =====

  app.post("/api/submit-instalment", async (req, res) => {
    try {
      const { member_id, memberId, society_id, memberName, amount, payment_proof_url, proofUrl, proofPath, month, late_fee } = req.body;
      const { data, error } = await supabase.from('Installments').insert([{
        member_id: member_id || memberId,
        society_id,
        memberName,
        amount: Number(amount),
        late_fee: Number(late_fee || 0),
        payment_proof_url: payment_proof_url || proofUrl,
        proofPath,
        month,
        status: 'Pending',
        created_at: new Date().toISOString()
      }]).select().single();
      if (error) throw error;
      res.json({ success: true, transaction: data });
    } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
  });

  app.post("/api/approve-instalment", async (req, res) => {
    try {
      const { id, status } = req.body;
      const { data, error } = await supabase
        .from('Installments')
        .update({
          status,
          approved_at: status === 'Approved' ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, transaction: data });
    } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
  });

  app.get("/api/transactions", async (_req, res) => {
    for (const table of ['Installments', 'installments']) {
      const { data, error } = await supabase.from(table).select('*').order('id', { ascending: false });
      if (!error) return res.json(data || []);
    }
    res.json([]);
  });

  // ===== PROFILE =====

  app.post("/api/update-profile", async (req, res) => {
    try {
      const { member_id, data } = req.body;
      const { error } = await supabase.from('members').update(data).eq('id', member_id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
  });

  // ===== FIXED DEPOSITS =====

  app.post("/api/fixed-deposit", async (req, res) => {
    try {
      const { action, data, fd_id } = req.body;

      if (action === "add") {
        const { error } = await supabase.from('fixed_deposits').insert([data]);
        if (error) throw error;
        return res.json({ success: true });
      }

      if (action === "update") {
        const { error } = await supabase.from('fixed_deposits').update(data).eq('id', fd_id);
        if (error) throw error;
        return res.json({ success: true });
      }

      if (action === "delete") {
        const { error } = await supabase.from('fixed_deposits').delete().eq('id', fd_id);
        if (error) throw error;
        return res.json({ success: true });
      }

      res.status(400).json({ success: false, message: "Invalid action" });
    } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
  });

  // ===== SEND EMAIL =====

  app.post("/api/send-email", async (req, res) => {
    try {
      const { member_name, member_email, amount, month, status, proof_url } = req.body;

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
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
  });

  return createServer(app);
}
