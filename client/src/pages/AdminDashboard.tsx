"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, PiggyBank, Wallet, TrendingUp, Activity, PieChart } from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Cell, LabelList, Tooltip, LineChart, Line, PieChart as RePie, Pie
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MEMBER_PALETTE = ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#4ade80', '#fb7185'];

export default function AdminDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState({
    totalInstalments: 0,
    totalFixedDeposits: 0,
    totalInterest: 0,
    totalFund: 0
  });
  const [memberChartData, setMemberChartData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  const getMaturityData = (amount: number, rate: number, start: string, months: number) => {
    const startDate = new Date(start);
    const finishDate = new Date(start);
    finishDate.setMonth(startDate.getMonth() + Number(months));
    const diffDays = Math.ceil(Math.abs(finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const interest = (amount * rate * diffDays) / (365 * 100);
    const isFinished = finishDate <= new Date();
    return { interest, isFinished };
  };

  const fetchDashboardStats = async () => {
    try {
      const { data: members } = await supabase.from('members').select('id, full_name, memberName');
      const { data: allInstallments } = await supabase.from('Installments').select('*').eq('status', 'Approved');
      const { data: deposits } = await supabase.from('fixed_deposits').select('*');

      const memberNamesMap: Record<string, string> = {};
      members?.forEach(m => { memberNamesMap[String(m.id)] = m.memberName || m.full_name || ""; });

      // Process Monthly Trend
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyMap = monthNames.map(m => ({ name: m, amount: 0 }));

      let totalInstallmentSum = 0;
      const memberAggregates = new Map<string, { amount: number, name: string }>();

      if (allInstallments) {
        allInstallments.forEach(rec => {
          const date = new Date(rec.created_at);
          const amount = Number(rec.amount || 0);
          
          if (date.getFullYear().toString() === selectedYear) {
            monthlyMap[date.getMonth()].amount += amount;
            totalInstallmentSum += amount;
            const mId = String(rec.member_id);
            const existing = memberAggregates.get(mId) || { amount: 0, name: "" };
            memberAggregates.set(mId, { amount: existing.amount + amount, name: memberNamesMap[mId] || rec.memberName || existing.name });
          }
        });
      }
      setMonthlyTrend(monthlyMap as any);

      let totalActivePrincipal = 0;
      let totalFinishedPrincipal = 0; 
      let totalRealizedInterest = 0; 

      (deposits || []).forEach(fd => {
        const m = getMaturityData(Number(fd.amount), Number(fd.interest_rate), fd.start_date, Number(fd.tenure_months));
        if (m.isFinished) { totalRealizedInterest += m.interest; totalFinishedPrincipal += Number(fd.amount); }
        else { totalActivePrincipal += Number(fd.amount); }
      });

      setStats({
        totalInstalments: totalInstallmentSum,
        totalFixedDeposits: totalActivePrincipal,
        totalInterest: totalRealizedInterest,
        totalFund: totalInstallmentSum + totalRealizedInterest 
      });

      const chartData = Array.from(memberAggregates.entries()).map(([mId, data]) => ({
          displayName: data.name || `Member #${mId}`,
          total: data.amount + (totalFinishedPrincipal > 0 ? (totalRealizedInterest / totalFinishedPrincipal) * data.amount : 0)
      })).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

      setMemberChartData(chartData as any);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDashboardStats(); }, [selectedYear]);

  const liquidityData = [
    { name: 'Invested (FD)', value: stats.totalFixedDeposits, color: '#6366f1' },
    { name: 'Liquid Cash', value: Math.max(0, stats.totalInstalments - stats.totalFixedDeposits), color: '#10b981' }
  ];

  return (
    <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Society Administration</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Command Center</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px] font-bold border-slate-200 rounded-lg h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Net Society Value", val: stats.totalFund, icon: Landmark, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
          { title: "Yearly Installments", val: stats.totalInstalments, icon: PiggyBank, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
          { title: "Active FD Capital", val: stats.totalFixedDeposits, icon: Wallet, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
          { title: "Realized Interest", val: stats.totalInterest, icon: TrendingUp, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" }
        ].map((item, idx) => (
          <div key={idx} className={`${item.bg} border ${item.border} p-5 rounded-xl h-28 flex flex-col justify-between shadow-sm`}>
            <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider">{item.title}</span>
            <div className="flex justify-between items-end">
              <h2 className={`text-2xl font-bold ${item.text} tracking-tighter`}>৳{Math.round(item.val).toLocaleString()}</h2>
              <item.icon className="h-4 w-4 opacity-20" />
            </div>
          </div>
        ))}
      </div>

      {/* TOP CHARTS: Capital Mix & Member Equity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="py-3 px-5 bg-slate-50/50 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Capital Mix Analysis</CardTitle>
            <Activity className="h-3.5 w-3.5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[280px] p-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ label: 'FD', val: stats.totalFixedDeposits }, { label: 'INST', val: stats.totalInstalments }, { label: 'INT', val: stats.totalInterest }]} margin={{ top: 40, bottom: 10, left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <Bar dataKey="val" radius={0} barSize={70} style={{ filter: 'drop-shadow(3px 3px 0px rgba(0,0,0,0.05))' }}>
                  <LabelList dataKey="val" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#1e293b' }} offset={10} />
                  <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#8b5cf6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="py-3 px-5 bg-slate-50/50 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Member Equity Statement</CardTitle>
            <PieChart className="h-3.5 w-3.5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[280px] p-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberChartData} margin={{ top: 40, bottom: 10, left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} interval={0} />
                <Bar dataKey="total" radius={0} barSize={40} style={{ filter: 'drop-shadow(3px 3px 0px rgba(0,0,0,0.05))' }}>
                  <LabelList dataKey="total" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#1e293b' }} offset={10} />
                  {memberChartData.map((_, i) => <Cell key={i} fill={MEMBER_PALETTE[i % 10]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM CHARTS: Liquidity & Monthly Trend */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Liquidity Donut Chart */}
        <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden lg:col-span-1">
          <CardHeader className="py-3 px-5 bg-slate-50/50 border-b">
            <CardTitle className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Treasury Liquidity</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex flex-col items-center justify-center p-4">
            <ResponsiveContainer width="100%" height="70%">
              <RePie>
                <Pie data={liquidityData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {liquidityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </RePie>
            </ResponsiveContainer>
            <div className="w-full space-y-2 mt-2">
              {liquidityData.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-500">{item.name}</span>
                  </div>
                  <span className="text-slate-900 font-mono">৳{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend Full Chart */}
        <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden lg:col-span-2">
          <CardHeader className="py-3 px-5 bg-slate-50/50 border-b">
            <CardTitle className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Monthly Collection Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ right: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip formatter={(v: any) => `৳${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}