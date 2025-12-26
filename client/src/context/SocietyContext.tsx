import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase"; 

const API_BASE_URL = "/api"; // Using a relative path is safer for most Vite/Express setups

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
  // ADDED: Missing Admin Actions required by AdminMembers.tsx
  approveMember: (id: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
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
    return transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [transactions]);

const refreshData = async () => {
    try {
      // Use catch on individual requests so one failure doesn't stop the other
      const [membersRes, transRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/members`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/transactions`).catch(() => ({ data: [] }))
      ]);
      
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setTransactions(Array.isArray(transRes.data) ? transRes.data : []);
      
      console.log("Sync Complete: Members list updated.");
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  useEffect(() => {
    if (currentUser) refreshData();
  }, [currentUser]);

  // FIXED: Ensure backend receives proper keys and handle response correctly
  const register = async (userData: any) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/register`, {
        full_name: userData.fullName, // Maps LandingPage regName
        email: userData.email,
        password: userData.password,
        status: 'pending' // Default status for admin review
      });
      
      if (res.data.success) {
        await refreshData(); // Update member list for admin immediately
        return true;
      }
      return false;
    } catch (err) {
      console.error("Registration failed:", err);
      return false;
    }
  };

  // ADDED: approveMember for AdminMembers.tsx
  const approveMember = async (id: string) => {
    try {
      await axios.post(`${API_BASE_URL}/approve-member`, { id });
      await refreshData();
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  // ADDED: deleteMember for AdminMembers.tsx
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
      approveMember, deleteMember // Exposed for Admin Panel
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