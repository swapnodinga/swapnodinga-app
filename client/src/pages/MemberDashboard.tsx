"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSociety } from "@/context/SocietyContext";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Wallet, PiggyBank, Percent, LandPlot, TrendingUp, Building2, User } from "lucide-react";

export default function MemberDashboard() {
  const { currentUser } = useSociety();
  const [localStats, setLocalStats] = useState({
    societyTotalFund: 0,
    societyFixedDeposit: 0,
    societyDepositInterest: 0,
    myAccumulatedInterest: 0,
    myInstallments: 0
  });

  // Admin-synced helper function for interest calculation
  const getMaturityData = (amount: number, rate: number, start: string, months: number) => {
    const startDate = new Date(start);
    const finishDate = new Date(start);
    finishDate.setMonth(startDate.getMonth() + Number(months));
    
    // Exact day-based calculation as per Admin logic
    const diffDays = Math.ceil(Math.abs(finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const interest = (amount * rate * diffDays) / (365 * 100);
    const isFinished = finishDate <= new Date();
    
    return { interest, isFinished };
  };

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!currentUser || !currentUser.id) return;

      try {
        // Fetch member-specific installments (RLS-friendly)
        const { data: myInstallmentsData } = await supabase
          .from('Installments')
          .select('*')
          .eq('member_id', currentUser.id)
          .eq('status', 'Approved');

        // Fetch society-wide installments via server admin endpoint (service role)
        const allInstallments = await fetch('/api/transactions').then(r => r.json()).catch(() => []);

        const { data: deposits } = await supabase.from('fixed_deposits').select('*');

        // Logic to group by MTDR and take only the latest entry principal
        const groupedDeposits = (deposits || []).reduce((groups: any, fd: any) => {
          const key = fd.mtdr_no || "Unassigned";
          if (!groups[key]) groups[key] = [];
          groups[key].push(fd);
          groups[key].sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
          return groups;
        }, {});

        let totalActivePrincipal = 0;
        let totalFinishedPrincipal = 0; 
        let totalRealizedInterest = 0; 

        // Apply same loop logic as Admin Dashboard
        (deposits || []).forEach(fd => {
          const m = getMaturityData(Number(fd.amount), Number(fd.interest_rate), fd.start_date, Number(fd.tenure_months));
          if (m.isFinished) { 
            totalRealizedInterest += m.interest; 
            totalFinishedPrincipal += Number(fd.amount); 
          } else { 
            totalActivePrincipal += Number(fd.amount); 
          }
        });

        // Fixed Global Principal logic for the display card
        let totalGlobalPrincipalForDisplay = 0;
        Object.values(groupedDeposits).forEach((group: any) => {
          totalGlobalPrincipalForDisplay += Number(group[0].amount || 0);
        });

        const societyTotalInstalments = (allInstallments || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const myInstallments = (myInstallmentsData || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

        // Member share calculation synced with Admin's formula
        const myInterestShare = totalFinishedPrincipal > 0 
          ? (totalRealizedInterest / totalFinishedPrincipal) * myInstallments 
          : 0;

        setLocalStats({
          societyFixedDeposit: totalActivePrincipal, // Synced with "Active FD Capital"
          societyDepositInterest: totalRealizedInterest,
          societyTotalFund: societyTotalInstalments + totalRealizedInterest,
          myAccumulatedInterest: myInterestShare,
          myInstallments: myInstallments
        });
      } catch (error) {
        console.error("Error calculating member stats:", error);
      }
    };

    fetchMemberData();
  }, [currentUser]);

  if (!currentUser) return null;

  const myTotalSavings = localStats.myInstallments + localStats.myAccumulatedInterest;
  const amountFontStyle = "font-sans font-bold text-slate-900 tracking-tight leading-none";
  const unifiedCardStyle = "min-h-[130px] flex flex-col bg-white border border-slate-200 border-t-4 border-t-emerald-600 shadow-sm rounded-xl px-5 justify-center hover:shadow-md transition-shadow";

  return (
    <div className="px-4 md:px-8 pb-10 space-y-6 bg-slate-50/30 min-h-screen pt-4">
      <div className="flex justify-between items-center bg-[#064e3b] p-5 rounded-2xl shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-lg">
            <User className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white uppercase">
              {currentUser.full_name || currentUser.name || currentUser.memberName}
            </h1>
            <p className="text-emerald-300/80 text-[10px] font-medium tracking-widest uppercase">
              ID: {currentUser.society_id || "PENDING"} 
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest ml-1">Personal Equity Overview</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="MY TOTAL SAVINGS" 
            value={`৳${Math.round(myTotalSavings).toLocaleString()}`} 
            icon={Wallet} 
            className={unifiedCardStyle}
            valueClassName={`${amountFontStyle} text-3xl`} 
          />
          <StatCard 
            title="MONTHLY INSTALMENTS" 
            value={`৳${localStats.myInstallments.toLocaleString()}`} 
            icon={PiggyBank} 
            className={unifiedCardStyle}
            valueClassName={`${amountFontStyle} text-3xl`}
          />
          <StatCard 
            title="ACCUMULATED INTEREST" 
            value={`৳${Math.round(localStats.myAccumulatedInterest).toLocaleString()}`} 
            icon={Percent} 
            className={unifiedCardStyle}
            valueClassName={`${amountFontStyle} text-3xl text-emerald-600`}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Society Capital Status</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="FIXED DEPOSIT" 
            value={`৳${localStats.societyFixedDeposit.toLocaleString()}`} 
            icon={LandPlot} 
            className={unifiedCardStyle}
            valueClassName={`${amountFontStyle} text-2xl`}
          />
          <StatCard 
            title="REALIZED INTEREST" 
            value={`৳${Math.round(localStats.societyDepositInterest).toLocaleString()}`} 
            icon={TrendingUp} 
            className={unifiedCardStyle}
            valueClassName={`${amountFontStyle} text-2xl`}
          />
          <Card className="bg-[#022c22] text-white shadow-md border-none rounded-xl min-h-[130px] flex flex-col justify-center px-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Society Total Fund</span>
              <Building2 className="h-4 w-4 text-emerald-500 opacity-50" />
            </div>
            <div className="font-sans font-extrabold text-white text-3xl md:text-4xl tracking-tight">
              ৳{Math.round(localStats.societyTotalFund).toLocaleString()}
            </div>
            <p className="text-[9px] text-emerald-500/60 font-medium uppercase mt-1">Collective Pool</p>
          </Card>
        </div>
      </div>
    </div>
  );
}