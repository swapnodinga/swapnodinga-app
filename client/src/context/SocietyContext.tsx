import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase"; 
import emailjs from '@emailjs/browser';

const API_BASE_URL = "/api";

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

  const refreshData = async () => {
    try {
      const [membersRes, transRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/members`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/transactions`).catch(() => ({ data: [] }))
      ]);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setTransactions(Array.isArray(transRes.data) ? transRes.data : []);
    } catch (err) {
      console.error("Data refresh failed:", err);
    }
  };

  useEffect(() => {
    if (currentUser) refreshData();
  }, [currentUser]);

  const approveInstalment = async (transaction: any, status: 'Approved' | 'Rejected') => {
    try {
      const res = await axios.post(`${API_BASE_URL}/approve-instalment`, { 
        id: transaction.id, 
        status: status 
      });

      if (res.data.success) {
        const memberObj = members.find(m => String(m.id) === String(transaction.member_id || transaction.memberId));
        const targetEmail = memberObj?.email || transaction.memberEmail;

        if (targetEmail) {
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

          await supabase.functions.invoke('payment-notification', {
            body: { 
              status: "Cleanup", 
              proofPath: transaction.proofPath || transaction.payment_proof_url?.split('/').pop()
            }
          });
        }
        await refreshData();
      }
    } catch (err) {
      console.error("Workflow failed:", err);
    }
  };

  const submitInstalment = async (amount: number, file: File, month: string) => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      const fileExt = file.name.split('.').pop();
      const fileName = `proof-${currentUser.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('payments').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('payments').getPublicUrl(fileName);

      await axios.post(`${API_BASE_URL}/submit-instalment`, {
        memberId: currentUser.id,      
        memberName: currentUser.full_name, 
        society_id: currentUser.society_id, 
        amount: Number(amount),         
        proofUrl: data.publicUrl, 
        proofPath: fileName,      
        month: month,                   
        status: 'Pending'               
      });
      await refreshData();
    } catch (err) { throw err; }
  };

  // REVISED LOGIN: Talk directly to Supabase to work on Vercel
  const login = async (email: string, pass: string) => {
    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (authError) throw authError;

      // 2. Fetch the member details from your database table
      const { data: memberData, error: dbError } = await supabase
        .from('members')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (dbError || !memberData) throw new Error("Member profile not found");

      // 3. Set the user session
      setCurrentUser(memberData);
      localStorage.setItem("user", JSON.stringify(memberData));
      return true;
    } catch (err) { 
      console.error("Login Error:", err);
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
      const payload = { ...userData, full_name: userData.full_name || userData.name };
      const res = await axios.post(`${API_BASE_URL}/register`, payload);
      if (res.data.success) {
        await refreshData(); 
        return true;
      }
      return false;
    } catch (err) { return false; }
  };

  const approveMember = async (id: string) => { 
    await axios.post(`${API_BASE_URL}/approve-member`, { id }); 
    await refreshData(); 
  };

  const deleteMember = async (id: string) => { 
    await axios.delete(`${API_BASE_URL}/members/${id}`); 
    await refreshData(); 
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
      await axios.post(`${API_BASE_URL}/update-profile-pic`, { userId: currentUser.id, profilePic: publicUrl });
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