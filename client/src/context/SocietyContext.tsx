import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 

interface SocietyContextType {
  currentUser: any;
  members: any[]; 
  transactions: any[];
  societyTotalFund: number;
  societyFixedDeposit: number;
  societyDepositInterest: number;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]); 
  const [transactions, setTransactions] = useState<any[]>([]);
  const [societyFixedDeposit, setSocietyFixedDeposit] = useState(0);
  const [societyDepositInterest, setSocietyDepositInterest] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    try {
      // 1. Fetch Global Data (Required for interest sharing logic)
      const { data: mData } = await supabase.from('members').select('*');
      const { data: installments } = await supabase.from('Installments').select('*').eq('status', 'Approved');
      const { data: deposits } = await supabase.from('fixed_deposits').select('*');
      const { data: interestRecords } = await supabase.from('member_profit_records').select('*');

      setMembers(mData || []);

      // 2. Calculate Society Totals (Aligns with image_fc70e7)
      const totalInstallments = installments?.reduce((acc, i) => acc + (Number(i.amount) || 0), 0) || 0;
      const totalFD = deposits?.reduce((acc, d) => acc + (Number(d.amount) || 0), 0) || 0;
      const totalInterestEarned = interestRecords?.reduce((acc, n) => acc + (Number(n.amount_earned) || 0), 0) || 0;
      
      setSocietyFixedDeposit(totalFD);
      setSocietyDepositInterest(totalInterestEarned);
      setTransactions(installments || []);

      // 3. Member Dashboard Calculation Logic (Aligns with image_fc70a9)
      const savedUser = localStorage.getItem("user");
      if (savedUser && mData) {
        const parsed = JSON.parse(savedUser);
        const profile = mData.find(m => String(m.id) === String(parsed.id));

        if (profile) {
          const mId = String(profile.id);
          const mName = (profile.name || profile.full_name || "").trim().toLowerCase();
          
          // Member's Individual Contribution
          const mContribution = installments?.filter(i => 
            String(i.member_id) === mId || (i.memberName?.trim().toLowerCase() === mName && mName !== "")
          ).reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;

          // Member's Share of Total Society Profit
          const totalSocietyCapital = totalInstallments + totalFD;
          const mInterestShare = totalSocietyCapital > 0 ? (mContribution / totalSocietyCapital) * totalInterestEarned : 0;

          setCurrentUser({
            ...profile,
            calculatedInstalments: mContribution,
            calculatedInterest: mInterestShare // This will now show ৳2,622 for Md Golam Kibria
          });
        } else {
          setCurrentUser(parsed); 
        }
      }
    } catch (err) {
      console.error("Critical Sync Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  const login = async (email: string, pass: string) => {
    const { data } = await supabase.from('members').select('*').eq('email', email.trim()).single();
    if (data && data.password === pass) {
      setCurrentUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      await refreshData();
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
  };

  const societyTotalFund = useMemo(() => {
    const installmentTotal = transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return installmentTotal + societyFixedDeposit + societyDepositInterest;
  }, [transactions, societyFixedDeposit, societyDepositInterest]);

  return (
    <SocietyContext.Provider value={{ 
      currentUser, members, transactions, societyTotalFund, societyFixedDeposit, 
      societyDepositInterest, isLoading, login, logout, refreshData 
    }}>
      {children}
    </SocietyContext.Provider>
  );
}

export const useSociety = () => useContext(SocietyContext)!;