"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

interface SocietyContextType {
  currentUser: any;
  members: any[];
  transactions: any[];
  fixedDeposits: any[];
  societyTotalFund: number;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  uploadProfilePic: (file: File) => Promise<string>;
  refreshData: () => Promise<void>;
  approveMember: (id: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  submitInstalment: (amount: number, file: File, month: string) => Promise<void>;
  approveInstalment: (transaction: any, status: "Approved" | "Rejected") => Promise<any>;
  addFixedDeposit: (data: any) => Promise<void>;
  updateFixedDeposit: (id: string, data: any) => Promise<void>;
  deleteFixedDeposit: (id: string) => Promise<void>;
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

// Helper: call local API endpoints (all writes bypass RLS via service role key)
const callApi = async (endpoint: string, body: any) => {
  const res = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "API call failed");
  return data;
};

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // 1. Initialize User Session
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

  // 2. Automated Fund Calculation
  const societyTotalFund = useMemo(() => {
    const totalInstallments = (transactions || [])
      .filter((t) => t.status === "Approved")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalRealizedInterest = (fixedDeposits || []).reduce(
      (acc, curr) => acc + (Number(curr.realized_interest) || 0),
      0,
    );
    return totalInstallments + totalRealizedInterest;
  }, [transactions, fixedDeposits]);

  // 3. Centralized Refresh Logic (reads from members_public view to hide passwords)
  const refreshData = async () => {
    try {
      const { data: membersData } = await supabase.from("members_public").select("*");
      const { data: transData } = await supabase
        .from("Installments")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: fdData } = await supabase
        .from("fixed_deposits")
        .select("*")
        .order("start_date", { ascending: false });

      const nameMap: { [key: string]: string } = {};
      if (membersData) {
        membersData.forEach((m: any) => {
          nameMap[String(m.id)] = m.full_name || m.memberName || m.member_name || "No Name";
        });
      }

      const enrichedTransData = (transData || []).map((trans: any) => ({
        ...trans,
        memberName: nameMap[String(trans.member_id)] || trans.memberName || `Member #${trans.member_id}`,
      }));

      setMembers(membersData || []);
      setTransactions(enrichedTransData);
      setFixedDeposits(fdData || []);
    } catch (err) {
      console.error("[SocietyContext] Refresh failed:", err);
    }
  };

  // 4. AUTOMATIC REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!currentUser) return;
    refreshData();
    const channel = supabase
      .channel("realtime-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "Installments" }, () => refreshData())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // ===== ALL WRITES GO THROUGH LOCAL API ENDPOINTS =====

  const approveInstalment = async (transaction: any, status: "Approved" | "Rejected"): Promise<any> => {
    try {
      await callApi("approve-instalment", { id: transaction.id, status });

      // Send email via server-side endpoint
      const memberObj = members.find((m) => String(m.id) === String(transaction.member_id));
      if (memberObj?.email) {
        callApi("send-email", {
          member_name: memberObj.full_name || transaction.memberName,
          member_email: memberObj.email,
          amount: transaction.amount,
          month: transaction.month,
          status,
          proof_url: transaction.payment_proof_url,
        }).catch((e) => console.warn("Email service failed", e));
      }

      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error("Workflow failed:", err);
      return { success: false, error: err.message };
    }
  };

  const submitInstalment = async (amount: number, file: File, month: string) => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      const fileExt = file.name.split(".").pop();
      const fileName = `proof-${currentUser.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("payments").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("payments").getPublicUrl(fileName);

      await callApi("submit-instalment", {
        member_id: currentUser.id,
        memberName: currentUser.full_name || currentUser.memberName,
        society_id: currentUser.society_id,
        amount: Number(amount),
        payment_proof_url: urlData.publicUrl,
        proofPath: fileName,
        month,
      });

      // ADDED THIS: Explicitly refresh so the user sees the new pending transaction immediately
      await refreshData();

    } catch (err: any) {
      console.error("Submission Error:", err.message);
    }
  };

  const approveMember = async (id: string) => {
    await callApi("approve-member", { member_id: id });
    await refreshData();
  };

  const deleteMember = async (id: string) => {
    if (!window.confirm("Delete this member permanently?")) return;
    await callApi("delete-member", { member_id: id });
    await refreshData();
  };

  const addFixedDeposit = async (data: any) => {
    await callApi("fixed-deposit", { action: "add", data });
    await refreshData();
  };

  const updateFixedDeposit = async (id: string, data: any) => {
    await callApi("fixed-deposit", { action: "update", fd_id: id, data });
    await refreshData();
  };

  const deleteFixedDeposit = async (id: string) => {
    if (!window.confirm("Delete this deposit permanently?")) return;
    await callApi("fixed-deposit", { action: "delete", fd_id: id });
    await refreshData();
  };

  const login = async (email: string, pass: string) => {
    try {
      const data = await callApi("auth-login", { email, password: pass });
      if (data?.success && data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return false;
    } catch (err) {
      console.error("Login error:", err);
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
      const data = await callApi("auth-register", {
        full_name: userData.full_name,
        email: userData.email,
        password: userData.password,
      });
      return data?.success === true;
    } catch (err) {
      console.error("Register error:", err);
      return false;
    }
  };

  const updateProfile = async (data: any) => {
    try {
      await callApi("update-profile", { member_id: currentUser.id, data });
      const updated = { ...currentUser, ...data };
      setCurrentUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
    } catch (err) {
      console.error("Profile update error:", err);
    }
  };

  const uploadProfilePic = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
    await supabase.storage.from("avatars").upload(fileName, file);
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    await updateProfile({ profile_pic: urlData.publicUrl });
    return urlData.publicUrl;
  };

  return (
    <SocietyContext.Provider
      value={{
        currentUser,
        members,
        transactions,
        fixedDeposits,
        societyTotalFund,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        uploadProfilePic,
        refreshData,
        approveMember,
        deleteMember,
        submitInstalment,
        approveInstalment,
        addFixedDeposit,
        updateFixedDeposit,
        deleteFixedDeposit,
      }}
    >
      {children}
    </SocietyContext.Provider>
  );
}

export function useSociety() {
  const context = useContext(SocietyContext);
  if (!context) throw new Error("useSociety must be used within a SocietyProvider");
  return context;
}