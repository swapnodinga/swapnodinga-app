import { type Express } from "express";
import { createServer, type Server } from "http";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ivhjokefdwospalrqcmk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGpva2VmZHdvc3BhbHJxY21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2MTY0OSwiZXhwIjoyMDgxNDM3NjQ5fQ.3Ilfmul7dVrzvvboz74nwUyKuQD34BH_kmpPe5fKt7U";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // 1. LOGIN: Prefix with /api to fix 404 error
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data: user, error } = await supabase
        .from('members')
        .select('*')
        .ilike('email', email.trim())
        .single();

      // Check credentials
      if (error || !user || user.password !== password) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
      
      // ADMIN BYPASS: Specific email bypass logic
      const isAdmin = user.email.toLowerCase() === 'swapnodinga.scs@gmail.com';

      // Allow if 'active' OR if user is the designated admin
      if (user.status !== 'active' && !isAdmin) {
        return res.status(403).json({ success: false, message: "Account pending admin approval" });
      }

      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });

  // 2. REGISTRATION: Prefix with /api and map full_name
  app.post("/api/register", async (req, res) => {
    const { full_name, email, password, status } = req.body;
    try {
      const { data, error } = await supabase
        .from('members')
        .insert([{ 
          name: full_name, 
          email: email.trim(), 
          password, 
          status: status || 'pending', 
          fixedDeposit: 0,
          totalInterestEarned: 0
        }])
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, user: data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 3. ADMIN TOOLS: Ensure all use /api prefix
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