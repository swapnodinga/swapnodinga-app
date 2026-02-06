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

// 10 Distinct Professional Colors for Members
const MEMBER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', 
  '#06b6d4', '#f472b6', '#6366f1', '#14b8a6', '#f97316'
];

export default function AdminDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState({
    totalInstalments: 0,
    totalFixedDeposits: 0,
    totalInterest: 0,
    totalFund: 0
  });
  const [memberChartData, setMemberChartData] = useState([]);

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
      members?.forEach(m => {
        memberNamesMap[String(m.id)] = m.memberName || m.full_name || "";
      });

      let totalActivePrincipal = 0;
      let totalFinishedPrincipal = 0; 
      let totalRealizedInterest = 0; 

      (deposits || []).forEach(fd => {
        const m = getMaturityData(Number(fd.amount), Number(fd.interest_rate), fd.start_date, Number(fd.tenure_months));
        if (m.isFinished) {
          totalRealizedInterest += m.interest;
          totalFinishedPrincipal += Number(fd.amount);
        } else {
          totalActivePrincipal += Number(fd.amount);
        }
      });

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
            const resolvedName = memberNamesMap[mId] || rec.memberName || rec.full_name || existing.name;
            memberAggregates.set(mId, { amount: existing.amount + amount, name: resolvedName });
          }
        });
      }

      setStats({
        totalInstalments: totalInstallmentSum,
        totalFixedDeposits: totalActivePrincipal,
        totalInterest: totalRealizedInterest,
        totalFund: totalInstallmentSum + totalRealizedInterest 
      });

      const chartData = Array.from(memberAggregates.entries()).map(([mId, data]) => {
        const installmentAmount = data.amount;
        const interestShare = totalFinishedPrincipal > 0 ? (totalRealizedInterest / totalFinishedPrincipal) * installmentAmount : 0;
        return {
          displayName: data.name || `Member #${mId}`,
          total: installmentAmount + interestShare
        };
      }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

      setMemberChartData(chartData as any);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDashboardStats(); }, [selectedYear]);

  return (
    <div className="p-6 space-y-6 bg-[#fcfdfe] min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Society Dashboard</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Summary</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[130px] font-bold border-slate-200 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* STAT CARDS - Colored backgrounds, No Black, Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Net Society Value", val: stats.totalFund, icon: Landmark, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", hover: "hover:bg-blue-100" },
          { title: "Total Installments", val: stats.totalInstalments, icon: PiggyBank, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", hover: "hover:bg-emerald-100" },
          { title: "Active FD Capital", val: stats.totalFixedDeposits, icon: Wallet, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", hover: "hover:bg-indigo-100" },
          { title: "Realized Interest", val: stats.totalInterest, icon: TrendingUp, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", hover: "hover:bg-purple-100" }
        ].map((item, idx) => (
          <div key={idx} className={`${item.bg} ${item.hover} ${item.border} border p-5 rounded-2xl transition-all duration-200 cursor-default group h-32 flex flex-col justify-between shadow-sm`}>
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-black uppercase text-slate-900 tracking-wider">{item.title}</span>
              <item.icon className={`h-4 w-4 ${item.text} opacity-60`} />
            </div>
            <h2 className={`text-2xl font-bold ${item.text} tracking-tighter`}>
              ৳{Math.round(item.val).toLocaleString()}
            </h2>
          </div>
        ))}
      </div>

      {/* CHARTS - Sharp Corners & Shadows */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Capital Mix Analysis */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="border-b bg-slate-50/30 py-4">
            <CardTitle className="text-[11px] font-black uppercase text-slate-900 tracking-widest px-2">Capital Mix Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px] pt-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { label: 'ACTIVE FD', val: stats.totalFixedDeposits, color: '#3b82f6' },
                { label: 'INSTALLMENTS', val: stats.totalInstalments, color: '#10b981' },
                { label: 'INTEREST', val: stats.totalInterest, color: '#8b5cf6' },
                { label: 'NET VALUE', val: stats.totalFund, color: '#6366f1' }
              ]} margin={{ top: 20, bottom: 20, left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <Bar dataKey="val" radius={0} barSize={50} style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }}>
                  <LabelList dataKey="val" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '11px', fontWeight: 'bold', fill: '#1e293b' }} offset={10} />
                  <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#8b5cf6" /><Cell fill="#6366f1" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Member Equity Leaderboard - 10 Colors */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="border-b bg-slate-50/30 py-4">
            <CardTitle className="text-[11px] font-black uppercase text-slate-900 tracking-widest px-2">Member Equity Statement</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px] pt-16">
            {memberChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberChartData} margin={{ top: 20, bottom: 20, left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} interval={0} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="total" radius={0} barSize={35} style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }}>
                    <LabelList dataKey="total" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#334155' }} offset={10} />
                    {memberChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MEMBER_COLORS[index % MEMBER_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-bold uppercase text-xs tracking-widest">No Records Found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}