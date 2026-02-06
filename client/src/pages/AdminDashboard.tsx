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
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Society Administration</h1>
          <p className="text-[10px] font-bold text-emerald-600 mt-0.5 uppercase tracking-[0.2em]">Treasury Command Center</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[140px] font-bold shadow-none border-slate-200 rounded-xl h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* STAT CARDS - Uniform Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Net Society Value" 
          value={`৳${Math.round(stats.totalFund).toLocaleString()}`} 
          icon={Landmark} 
          className="bg-white border-b-4 border-slate-900 rounded-2xl shadow-sm" 
        />
        <StatCard 
          title="Total Installments" 
          value={`৳${Math.round(stats.totalInstalments).toLocaleString()}`} 
          icon={PiggyBank} 
          className="bg-white border-b-4 border-emerald-500 rounded-2xl shadow-sm" 
        />
        <StatCard 
          title="Active FD Capital" 
          value={`৳${Math.round(stats.totalFixedDeposits).toLocaleString()}`} 
          icon={Wallet} 
          className="bg-white border-b-4 border-blue-500 rounded-2xl shadow-sm" 
        />
        <StatCard 
          title="Realized Interest" 
          value={`৳${Math.round(stats.totalInterest).toLocaleString()}`} 
          icon={TrendingUp} 
          className="bg-white border-b-4 border-purple-500 rounded-2xl shadow-sm" 
        />
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white border border-slate-200">
          <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Capital Mix Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px] pt-14 pb-4"> {/* Increased top padding significantly */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { label: 'ACTIVE FD', val: stats.totalFixedDeposits, color: '#3b82f6' },
                { label: 'INSTALLMENTS', val: stats.totalInstalments, color: '#10b981' },
                { label: 'INTEREST', val: stats.totalInterest, color: '#8b5cf6' },
                { label: 'NET VALUE', val: stats.totalFund, color: '#0f172a' }
              ]} margin={{ top: 40, bottom: 10 }}> {/* Margin increased to stop clipping */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: '800' }} />
                <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={55}>
                  <LabelList 
                    dataKey="val" 
                    position="top" 
                    formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} 
                    style={{ fontSize: '11px', fontWeight: '900', fill: '#1e293b' }} 
                    offset={15} 
                  />
                  <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#8b5cf6" /><Cell fill="#0f172a" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white border border-slate-200">
          <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Member Equity Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px] pt-14 pb-4">
            {memberChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberChartData} margin={{ top: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: '800' }} interval={0} />
                  <Tooltip cursor={{fill: '#f8fafc'}} formatter={(v: any) => `৳${Math.round(v).toLocaleString()}`} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="total" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40}>
                    <LabelList 
                      dataKey="total" 
                      position="top" 
                      formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} 
                      style={{ fontSize: '10px', fontWeight: '900', fill: '#059669' }} 
                      offset={15} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-bold uppercase text-xs tracking-widest">No Data Found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}