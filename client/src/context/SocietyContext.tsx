import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase"; 

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
  uploadProfilePic: (file: File) => Promise<void>;
  refreshData: () => Promise<void>;
  approveMember: (id: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  // UPDATED: Now accepts 5 parameters
  submitInstalment: (amount: number, proofUrl: string, month: string, lateFee: number, societyId: string) => Promise<void>;
  approveInstalment: (id: number) => Promise<void>;
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
      .filter(t => t.status?.toLowerCase() === 'approved') 
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
      console.error("Refresh failed:", err);
    }
  };

  useEffect(() => {
    if (currentUser) refreshData();
  }, [currentUser]);

  // UPDATED: Logic to send lateFee and societyId to your backend
  const submitInstalment = async (
    amount: number, 
    proofUrl: string, 
    month: string, 
    lateFee: number, 
    societyId: string
  ) => {
    try {
      if (!currentUser) throw new Error("No user logged in");

      const res = await axios.post(`${API_BASE_URL}/submit-instalment`, {
        memberId: currentUser.id,      
        society_id: societyId,         // Correctly mapped from modal
        memberName: currentUser.full_name, 
        amount: Number(amount),        
        late_fee: Number(lateFee),     // Explicitly tracked late fee
        proofUrl: proofUrl,            
        month: month,                  
        status: 'Pending'               
      });

      if (res.data.success) {
        await refreshData(); 
      }
    } catch (err) {
      console.error("Instalment submission failed:", err);
      throw err;
    }
  };

  const approveInstalment = async (id: number) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/approve-instalment`, { id });
      if (res.data.success) {
        await refreshData();
      }
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const register = async (userData: any) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/register`, {
        full_name: userData.fullName,
        email: userData.email,
        password: userData.password,
        status: 'pending'
      });
      
      if (res.data.success) {
        await refreshData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const approveMember = async (id: string) => {
    try {
      await axios.post(`${API_BASE_URL}/approve-member`, { id });
      await refreshData();
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const deleteMember = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/members/${id}`);
      await refreshData();
    } catch (err) {
      console.error("Deletion failed:", err);
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, { 
        email: email.trim(), 
        password: pass 
      });
      if (res.data.success) {
        setCurrentUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const updateProfile = async (data: any) => {
    const updatedUser = { ...currentUser, ...data };
    setCurrentUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const uploadProfilePic = async (file: File) => {
    try {
      if (!currentUser) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      await updateProfile({ profile_pic: publicUrl });
      await axios.post(`${API_BASE_URL}/update-profile-pic`, { 
        userId: currentUser.id, 
        profilePic: publicUrl 
      });
    } catch (err: any) {
      console.error("Upload error:", err);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
    setLocation("/");
  };

  return (
    <SocietyContext.Provider value={{ 
      currentUser, members, transactions, societyTotalFund, isLoading,
      login, register, logout, updateProfile, uploadProfilePic, refreshData,
      approveMember, deleteMember,
      submitInstalment,
      approveInstalment 
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