import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase"; 
import emailjs from '@emailjs/browser';

interface SocietyContextType {
  currentUser: any;
  members: any[];
  transactions: any[];
  societyTotalFund: number;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  uploadProfilePic: (file: File) => Promise<string>; 
  refreshData: () => Promise<void>;
  approveMember: (id: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  submitInstalment: (amount: number, file: File, month: string) => Promise<void>;
  approveInstalment: (transaction: any, status: 'Approved' | 'Rejected') => Promise<void>; 
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }
    setIsLoading(false);
  }, []);

  const societyTotalFund = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter(t => t.status === 'Approved') 
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [transactions]);

  // FIX: Fetch Data Directly from Supabase
  const refreshData = async () => {
    try {
      // Fetch Members
      const { data: mData, error: mErr } = await supabase.from('members').select('*');
      if (mErr) throw mErr;

      // Fetch Transactions
      const { data: tData, error: tErr } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (tErr) throw tErr;

      setMembers(mData || []);
      setTransactions(tData || []);
    } catch (err: any) {
      console.error("Data refresh failed:", err.message);
    }
  };

  // Auto-refresh when user logs in
  useEffect(() => {
    if (currentUser) refreshData();
  }, [currentUser]);

  // FIX: Approve/Reject Directly via Supabase
  const approveInstalment = async (transaction: any, status: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: status })
        .eq('id', transaction.id);

      if (error) throw error;

      const memberObj = members.find(m => String(m.id) === String(transaction.member_id));
      const targetEmail = memberObj?.email || transaction.member_email;

      if (targetEmail && status === 'Approved') {
        await emailjs.send(
          'service_b8gcj9p',
          'template_vi2p4ul',
          {
            member_name: memberObj?.full_name || "Member",
            member_email: targetEmail,
            amount: transaction.amount,
            month: transaction.month,
            status: status
          },
          'nKSxYmGpgjuB2J4tF'
        );

        // Delete proof from storage to save space
        if (transaction.proof_path) {
           await supabase.storage.from('payments').remove([transaction.proof_path]);
        }
      }
      await refreshData();
    } catch (err: any) {
      alert("Approval Failed: " + err.message);
    }
  };

  // FIX: Submit Payment Directly via Supabase
  const submitInstalment = async (amount: number, file: File, month: string) => {
    try {
      if (!currentUser) {
        alert("You are not logged in. Please reload the page.");
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `proof-${currentUser.id}-${Date.now()}.${fileExt}`;
      
      // 1. Upload Image
      const { error: uploadError } = await supabase.storage.from('payments').upload(fileName, file);
      if (uploadError) {
        alert("Image Upload Failed: " + uploadError.message);
        throw uploadError;
      }
      
      const { data: urlData } = supabase.storage.from('payments').getPublicUrl(fileName);

      // 2. Save Data to Database
      const { error: dbError } = await supabase
        .from('transactions')
        .insert([{
          member_id: currentUser.id,      
          member_name: currentUser.full_name, 
          society_id: currentUser.society_id, 
          amount: Number(amount),         
          payment_proof_url: urlData.publicUrl, 
          proof_path: fileName,      
          month: month,                   
          status: 'Pending',
          created_at: new Date().toISOString()
        }]);

      if (dbError) {
        alert("Database Error: " + dbError.message);
        throw dbError;
      }

      alert("Payment Submitted Successfully!");
      await refreshData();
    } catch (err) { 
      console.error(err);
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (authError) throw authError;

      const { data: memberData, error: dbError } = await supabase
        .from('members')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (dbError || !memberData) throw new Error("Member profile not found");

      setCurrentUser(memberData);
      localStorage.setItem("user", JSON.stringify(memberData));
      return true;
    } catch (err) { 
      return false; 
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
    setLocation("/");
  };

  const register = async (userData: any) => { 
    try {
      const { error } = await supabase.from('members').insert([userData]);
      if (error) {
        alert("Registration Failed: " + error.message);
        return false;
      }
      await refreshData();
      return true;
    } catch (err) { return false; }
  };

  const approveMember = async (id: string) => { 
    const { error } = await supabase.from('members').update({ is_active: true }).eq('id', id);
    if (!error) await refreshData(); 
  };

  const deleteMember = async (id: string) => { 
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (!error) await refreshData(); 
  };

  const updateProfile = async (data: any) => { 
    const u = { ...currentUser, ...data }; 
    setCurrentUser(u); 
    localStorage.setItem("user", JSON.stringify(u)); 
  };

  const uploadProfilePic = async (file: File): Promise<string> => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      await updateProfile({ profile_pic: publicUrl });
      return publicUrl;
    } catch (err: any) { throw err; }
  };

  return (
    <SocietyContext.Provider value={{ 
      currentUser, members, transactions, societyTotalFund, isLoading,
      login, register, logout, updateProfile, uploadProfilePic, refreshData,
      approveMember, deleteMember, submitInstalment, approveInstalment 
    }}>
      {children}
    </SocietyContext.Provider>
  );
}

export function useSociety() {
  const context = useContext(SocietyContext);
  if (!context) throw new Error("useSociety must be used within a SocietyProvider");
  return context;
}