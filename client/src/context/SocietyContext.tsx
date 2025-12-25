import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; 

interface SocietyContextType {
  currentUser: any;
  members: any[];
  transactions: any[];
  societyTotalFund: number;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  refreshData: () => Promise<void>; // Added to keep data in sync
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // --- CALCULATIONS ---
  // Fixes: "societyTotalFund is undefined"
  const societyTotalFund = useMemo(() => {
    return transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [transactions]);

  // --- DATA FETCHING ---
  const refreshData = async () => {
    try {
      const [membersRes, transRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/members`),
        axios.get(`${API_BASE_URL}/transactions`)
      ]);
      setMembers(membersRes.data);
      setTransactions(transRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  // Automatically refresh data when a user logs in
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, { 
        email: email.trim(), 
        password: pass 
      });
      if (res.data.success) {
        setCurrentUser(res.data.user); // Terminal shows success here
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const updateProfile = async (data: any) => {
    setCurrentUser((prev: any) => ({ ...prev, ...data }));
  };

  const logout = () => {
    setCurrentUser(null);
    setMembers([]);
    setTransactions([]);
  };

  return (
    <SocietyContext.Provider value={{ 
      currentUser, 
      members, 
      transactions, 
      societyTotalFund, 
      login, 
      logout, 
      updateProfile,
      refreshData
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