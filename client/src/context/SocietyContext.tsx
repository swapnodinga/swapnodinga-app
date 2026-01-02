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
  societyFixedDeposit: number;
  societyDepositInterest: number;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  uploadProfilePic: (file: File) => Promise<void>;
  refreshData: () => Promise<void>;
  approveMember: (id: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  submitInstalment: (amount: number, file: File, month: string) => Promise<void>;
  approveInstalment: (id: number) => Promise<void>; 
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  const [societyFixedDeposit] = useState(250000); 
  const [societyDepositInterest] = useState(12500);

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

  const submitInstalment = async (amount: number, file: File, month: string) => {
    try {
      if (!currentUser) throw new Error("No user logged in");

      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('payments').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('payments').getPublicUrl(fileName);

      await axios.post(`${API_BASE_URL}/submit-instalment`, {
        memberId: currentUser.id,      
        memberName: currentUser.full_name, 
        society_id: currentUser.society_id, 
        amount: Number(amount),         
        proofUrl: data.publicUrl,            
        month: month,                  
        status: 'Pending'               
      });

      await refreshData();
    } catch (err) {
      throw err;
    }
  };

  const approveInstalment = async (id: number) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/approve-instalment`, { id });
      if (res.data.success) await refreshData();
    } catch (err) {
      console.error("Approval failed:", err);
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

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
    setLocation("/");
  };

  // FIXED: Registration logic now ensures 'full_name' is sent to the DB
  const register = async (userData: any) => { 
    try {
      // The DB requires 'full_name' and cannot be null
      const payload = {
        ...userData,
        full_name: userData.full_name || userData.name 
      };

      const res = await axios.post(`${API_BASE_URL}/register`, payload);
      
      if (res.data.success) {
        await refreshData(); 
        return true;
      }
      return false;
    } catch (err) {
      console.error("Registration failed:", err);
      return false;
    }
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

  const uploadProfilePic = async (file: File) => { };

  return (
    <SocietyContext.Provider value={{ 
      currentUser, members, transactions, societyTotalFund, societyFixedDeposit, societyDepositInterest, isLoading,
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