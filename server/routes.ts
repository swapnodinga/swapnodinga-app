import { type Express } from "express";
import { createServer, type Server } from "http";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ivhjokefdwospalrqcmk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGpva2VmZHdvc3BhbHJxY21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2MTY0OSwiZXhwIjoyMDgxNDM3NjQ5fQ.3Ilfmul7dVrzvvboz74nwUyKuQD34BH_kmpPe5fKt7U";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // 1. LOGIN: Prefix with /api and Admin Bypass
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

  // 2. REGISTRATION: Sequential Society ID Generator
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

      if (error) {
        console.error("Supabase Error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
      }
      
      res.json({ success: true, user: data, assignedId: nextId });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Registration server error" });
    }
  });

  // 3. MEMBER DATA FETCHING (NEW): Required for AdminMembers.tsx to show pending list
  app.get("/api/members", async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to fetch members" });
    }
  });

  // 4. ADMIN TOOLS: Standardized /api prefix
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

  return createServer(app);
}