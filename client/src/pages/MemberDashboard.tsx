import { useSociety } from "@/context/SocietyContext";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, PiggyBank, Percent, LandPlot, TrendingUp, Building2 } from "lucide-react";

export default function MemberDashboard() {
  const { currentUser, societyTotalFund, societyFixedDeposit, societyDepositInterest } = useSociety();

  if (!currentUser) return <div className="p-10 text-center font-serif">Loading...</div>;

  // Use the pre-calculated values from our Context logic
  const myMonthlyInstalments = currentUser.calculatedInstalments || 0;
  const myInterestFromInvestment = currentUser.calculatedInterest || 0;
  const myTotalSavings = myMonthlyInstalments + myInterestFromInvestment;

  return (
    <div className="space-y-10 pb-10">
      <div>
        <h1 className="text-3xl font-serif font-bold text-emerald-900">Welcome, {currentUser.full_name || currentUser.name}</h1>
        <p className="text-sm text-emerald-700 font-medium">Member ID: {currentUser.member_id || "SCS-007"}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">My Personal Contribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="MY TOTAL SAVINGS" 
            value={`৳${myTotalSavings.toLocaleString(undefined, {maximumFractionDigits: 0})}`} 
            icon={Wallet} 
            className="border-l-4 border-l-emerald-600 shadow-md bg-white" 
          />
          <StatCard 
            title="MONTHLY INSTALMENTS" 
            value={`৳${myMonthlyInstalments.toLocaleString()}`} 
            icon={PiggyBank} 
            className="border-l-4 border-l-amber-500 shadow-md bg-white" 
          />
          <StatCard 
            title="INTEREST FROM INVESTMENT" 
            value={`৳${myInterestFromInvestment.toLocaleString(undefined, {maximumFractionDigits: 0})}`} 
            icon={Percent} 
            updatedAt={currentUser.lastSync}
            className="border-l-4 border-l-blue-500 shadow-md bg-white" 
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Society Present Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="FIXED DEPOSIT" value={`৳${societyFixedDeposit.toLocaleString()}`} icon={LandPlot} className="bg-slate-50" />
          <StatCard title="INTEREST FROM DEPOSIT" value={`৳${societyDepositInterest.toLocaleString()}`} icon={TrendingUp} className="bg-slate-50" />
          <Card className="bg-emerald-900 text-white shadow-lg border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Society Total Fund</CardTitle>
              <Building2 className="h-4 w-4 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{societyTotalFund.toLocaleString()}</div>
              <p className="text-[10px] text-emerald-100 mt-1">Total Collective Capital</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}