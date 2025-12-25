import { type Express } from "express";
import { createServer, type Server } from "http";
import { createClient } from '@supabase/supabase-js';

// --- STABLE DATABASE CONNECTION ---
// Using hardcoded strings to ensure the backend always connects
const SUPABASE_URL = "https://ivhjokefdwospalrqcmk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGpva2VmZHdvc3BhbHJxY21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2MTY0OSwiZXhwIjoyMDgxNDM3NjQ5fQ.3Ilfmul7dVrzvvboz74nwUyKuQD34BH_kmpPe5fKt7U";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // 1. LOGIN ROUTE
  app.post("/login", async (req, res) => {
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
      
      // Successfully returns user data to the frontend
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 2. GET ALL MEMBERS [Prevents 'members is undefined' crash]
  app.get("/members", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // 3. GET ALL TRANSACTIONS [Prevents 'transactions is undefined' crash]
  app.get("/transactions", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // 4. UPDATE MEMBER PROFILE
  app.patch("/members/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
      const { data, error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}