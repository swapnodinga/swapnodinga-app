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

  const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    const fetchMemberData = async () => {
      // Ensure we have a valid user ID to filter by
      if (!currentUser || !currentUser.id) return;

      try {
        const { data: installments } = await supabase.from('Installments').select('*').eq('status', 'Approved');
        const { data: deposits } = await supabase.from('fixed_deposits').select('*');

        let totalGlobalPrincipal = 0;
        let totalFinishedPrincipal = 0; 
        let finishedInterest = 0; 

        (deposits || []).forEach(fd => {
          const principal = Number(fd.amount || 0);
          totalGlobalPrincipal += principal;
          const tenure = Number(fd.tenure_months || 0);
          const rate = Number(fd.interest_rate || 0);
          const monthIndex = monthsList.indexOf(fd.month);
          const startDate = new Date(Number(fd.year), monthIndex, 1);
          const maturityDate = new Date(startDate);
          maturityDate.setMonth(startDate.getMonth() + tenure);

          if (maturityDate <= new Date()) {
            finishedInterest += (principal * (rate / 100) * (tenure / 12));
            totalFinishedPrincipal += principal;
          }
        });

        const societyTotalInstalments = (installments || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
        
        // --- FIXED LOGIC START ---
        // Filter by member_id (UUID) instead of unreliable names
        const myInstallments = (installments || [])
          .filter(inst => inst.member_id === currentUser.id)
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);
        // --- FIXED LOGIC END ---

        // Calculate Share: (Total Interest / Total Principal) * My Contribution
        const myInterestShare = totalFinishedPrincipal > 0 
          ? (finishedInterest / totalFinishedPrincipal) * myInstallments 
          : 0;

        setLocalStats({
          societyFixedDeposit: totalGlobalPrincipal,
          societyDepositInterest: finishedInterest,
          societyTotalFund: societyTotalInstalments + totalGlobalPrincipal + finishedInterest,
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
      
      {/* HEADER - FIXED DYNAMIC ID */}
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
            value={`৳${myTotalSavings.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`} 
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
            value={`৳${localStats.myAccumulatedInterest.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`} 
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
            title="DEPOSIT INTEREST" 
            value={`৳${localStats.societyDepositInterest.toLocaleString()}`} 
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
              ৳{localStats.societyTotalFund.toLocaleString()}
            </div>
            <p className="text-[9px] text-emerald-500/60 font-medium uppercase mt-1">Collective Pool</p>
          </Card>
        </div>
      </div>
    </div>
  );
}