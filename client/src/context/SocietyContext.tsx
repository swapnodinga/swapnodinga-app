"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FixedDeposit {
  id?: string;
  amount: number;
  interest_rate: number;
  tenure_months: number;
  start_date: string; // Now supported by your DB
  month: string;
  year: string;
}

interface SocietyContextType {
  currentUser: any;
  transactions: any[];
  fixedDeposits: FixedDeposit[];
  submitInstalment: (amount: number, file: File, period: string, note?: string) => Promise<void>;
  addDeposit: (deposit: FixedDeposit) => Promise<void>;
  updateDeposit: (id: string, updates: Partial<FixedDeposit>) => Promise<void>;
  loading: boolean;
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('members')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile);
      }

      // Fetch All Transactions
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Fetch All Fixed Deposits
      const { data: fdData } = await supabase
        .from('fixed_deposits')
        .select('*')
        .order('year', { ascending: false });

      setTransactions(transData || []);
      setFixedDeposits(fdData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Logic for Member Installments with "Notes" support
  const submitInstalment = async (amount: number, file: File, period: string, note?: string) => {
    if (!currentUser) return;

    // Upload Proof
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Create Transaction with Notes
    const { error: transError } = await supabase
      .from('transactions')
      .insert([{
        member_id: currentUser.id,
        member_name: currentUser.full_name,
        amount: amount,
        type: 'Instalment',
        status: 'pending',
        billing_period: period,
        proof_url: fileName,
        notes: note // Added as per your request
      }]);

    if (transError) throw transError;
    fetchInitialData();
  };

  // Add Deposit Logic with Date fix
  const addDeposit = async (deposit: FixedDeposit) => {
    const { error } = await supabase
      .from('fixed_deposits')
      .insert([deposit]);
    
    if (error) {
      console.error("Supabase Error:", error.message);
      throw error;
    }
    fetchInitialData();
  };

  // NEW: Update function for your Edit Button
  const updateDeposit = async (id: string, updates: Partial<FixedDeposit>) => {
    const { error } = await supabase
      .from('fixed_deposits')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    fetchInitialData();
  };

  return (
    <SocietyContext.Provider value={{ 
      currentUser, 
      transactions, 
      fixedDeposits, 
      submitInstalment, 
      addDeposit, 
      updateDeposit,
      loading 
    }}>
      {children}
    </SocietyContext.Provider>
  );
}

export const useSociety = () => {
  const context = useContext(SocietyContext);
  if (!context) throw new Error("useSociety must be used within SocietyProvider");
  return context;
};