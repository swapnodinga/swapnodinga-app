"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, PiggyBank, Wallet, TrendingUp } from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Cell, LabelList, Tooltip 
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState({
    totalInstalments: 0,
    totalFixedDeposits: 0,
    totalInterest: 0,
    totalFund: 0
  });
  const [memberChartData, setMemberChartData] = useState([]);

  const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const fetchDashboardStats = async () => {
    try {
      // 1. Fetch all source data
      const { data: members } = await supabase.from('members').select('id, full_name, memberName');
      const { data: allInstallments } = await supabase.from('Installments').select('*').eq('status', 'Approved');
      const { data: deposits } = await supabase.from('fixed_deposits').select('*');

      // 2. Create a Name Lookup Map (Very important for fixing "Unknown" names)
      // This maps Member ID -> Official Name
      const memberNamesMap: Record<string, string> = {};
      members?.forEach(m => {
        memberNamesMap[String(m.id)] = m.memberName || m.full_name || "";
      });

      // 3. Global Financial Calculations
      let totalGlobalPrincipal = 0;
      let totalFinishedPrincipal = 0; 
      let finishedInterest = 0; 

      (deposits || []).forEach(fd => {
        const principal = Number(fd.amount || 0);
        totalGlobalPrincipal += principal;
        const monthIndex = monthsList.indexOf(fd.month);
        const startDate = new Date(Number(fd.year), monthIndex, 1);
        const maturityDate = new Date(startDate);
        maturityDate.setMonth(startDate.getMonth() + Number(fd.tenure_months || 0));

        if (maturityDate <= new Date()) {
          finishedInterest += (principal * (Number(fd.interest_rate || 0) / 100) * (Number(fd.tenure_months || 0) / 12));
          totalFinishedPrincipal += principal;
        }
      });

      // 4. Group by Member ID (Prevents separate bars for the same member)
      const memberAggregates = new Map<string, { amount: number, name: string }>();
      let totalInstallmentSum = 0;

      if (allInstallments) {
        allInstallments.forEach(rec => {
          const recYear = rec.year || (rec.created_at ? new Date(rec.created_at).getFullYear() : null);
          
          if (String(recYear).includes(selectedYear)) {
            const mId = String(rec.member_id);
            const amount = Number(rec.amount || 0);
            totalInstallmentSum += amount;

            const existing = memberAggregates.get(mId) || { amount: 0, name: "" };
            
            // Resolve Name: 
            // Priority 1: Name from 'members' table (Map)
            // Priority 2: Name written in the specific record
            // Priority 3: Keep existing name found in previous loops
            const resolvedName = memberNamesMap[mId] || rec.memberName || rec.full_name || existing.name;

            memberAggregates.set(mId, {
              amount: existing.amount + amount,
              name: resolvedName
            });
          }
        });
      }

      setStats({
        totalInstalments: totalInstallmentSum,
        totalFixedDeposits: totalGlobalPrincipal,
        totalInterest: finishedInterest,
        totalFund: totalInstallmentSum + totalGlobalPrincipal + finishedInterest
      });

      // 5. Generate Chart Data with Interest Proportions
      const chartData = Array.from(memberAggregates.entries()).map(([mId, data]) => {
        const installmentAmount = data.amount;
        const interestShare = totalFinishedPrincipal > 0 
          ? (finishedInterest / totalFinishedPrincipal) * installmentAmount 
          : 0;

        return {
          displayName: data.name || `Member #${mId}`, // Final fallback if name is truly missing everywhere
          total: installmentAmount + interestShare,
          base: installmentAmount,
          interest: interestShare
        };
      })
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total); // Shows highest contributor first

      setMemberChartData(chartData as any);
    } catch (e) {
      console.error("Dashboard Fetch Error:", e);
    }
  };

  useEffect(() => { fetchDashboardStats(); }, [selectedYear]);

  const financialMixData = [
    { label: 'FIXED DEPOSIT', val: stats.totalFixedDeposits, color: '#3b82f6' },
    { label: 'INSTALLMENTS', val: stats.totalInstalments, color: '#10b981' },
    { label: 'INTEREST', val: stats.totalInterest, color: '#8b5cf6' },
    { label: 'TOTAL FUND', val: stats.totalFund, color: '#0f172a' }
  ];

  return (
    <div className="p-4 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wider">Society Administration</h1>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px] shadow-none border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Society Total Fund" value={`৳${stats.totalFund.toLocaleString()}`} icon={Landmark} className="border-b-4 border-slate-900" />
        <StatCard title="Total Installments" value={`৳${stats.totalInstalments.toLocaleString()}`} icon={PiggyBank} className="border-b-4 border-emerald-500" />
        <StatCard title="Fixed Deposits" value={`৳${stats.totalFixedDeposits.toLocaleString()}`} icon={Wallet} className="border-b-4 border-blue-500" />
        <StatCard title="Total Interest" value={`৳${stats.totalInterest.toLocaleString()}`} icon={TrendingUp} className="border-b-4 border-purple-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Chart: Financial Capital Distribution */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="border-b bg-white py-3">
            <CardTitle className="text-[11px] font-bold uppercase text-slate-500 tracking-widest">Capital Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px] pt-12 bg-white">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialMixData} margin={{ top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: '700' }} />
                <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={60}>
                  {financialMixData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  <LabelList dataKey="val" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(1)}k`} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#1e293b' }} offset={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Chart: Member Assets (Leaderboard) */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="border-b bg-white py-3">
            <CardTitle className="text-[11px] font-bold uppercase text-slate-500 tracking-widest">Member Individual Assets</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px] pt-12 bg-white">
            {memberChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberChartData} margin={{ top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayName" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: '800' }}
                    interval={0}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    formatter={(value: any) => `৳${Number(value).toLocaleString()}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} barSize={45}>
                    <LabelList 
                      dataKey="total" 
                      position="top" 
                      formatter={(v: any) => `৳${(v/1000).toFixed(1)}k`} 
                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#059669' }} 
                      offset={12} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                No contributions found for {selectedYear}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}