"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, 
  CartesianGrid, Cell, LabelList, Tooltip, LineChart, Line, PieChart as RePie, Pie
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MEMBER_PALETTE = ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#4ade80', '#fb7185'];

// Custom Label component to guarantee one-line vertical text
const VerticalNameLabel = (props: any) => {
  const { x, y, width, value } = props;
  return (
    <text
      x={x + width / 2}
      y={y + 10} // Positioned near the bottom inside the bar
      fill="#ffffff"
      textAnchor="start"
      transform={`rotate(-90, ${x + width / 2}, ${y + 10})`}
      style={{ 
        fontSize: '11px', 
        fontWeight: '700', 
        textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
        letterSpacing: '0.02em',
        pointerEvents: 'none'
      }}
    >
      {value}
    </text>
  );
};

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
    { name: 'Invested', value: stats.totalFixedDeposits, color: '#6366f1' },
    { name: 'Cash', value: Math.max(0, stats.totalInstalments - stats.totalFixedDeposits), color: '#10b981' }
  ];

  return (
    <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Society Command Center</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Summary {selectedYear}</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px] font-bold border-slate-200 rounded-lg h-10"><SelectValue /></SelectTrigger>
          <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Net Society Value", val: stats.totalFund, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
          { title: "Total Installments", val: stats.totalInstalments, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
          { title: "Active FD Capital", val: stats.totalFixedDeposits, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
          { title: "Realized Interest", val: stats.totalInterest, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" }
        ].map((item, idx) => (
          <div key={idx} className={`${item.bg} border ${item.border} p-5 rounded-2xl h-28 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow`}>
            <span className="text-[11px] font-black uppercase text-slate-900 tracking-wider">{item.title}</span>
            <h2 className={`text-2xl font-bold ${item.text} tracking-tighter italic`}>৳{Math.round(item.val).toLocaleString()}</h2>
          </div>
        ))}
      </div>

      {/* MAIN GRAPHS ROW */}
      <div className="grid grid-cols-12 gap-6">
        {/* CAPITAL MIX */}
        <Card className="col-span-12 lg:col-span-4 border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="py-4 px-6 bg-slate-50/30 border-b"><CardTitle className="text-[11px] font-black uppercase text-slate-900 tracking-widest">Capital Mix Analysis</CardTitle></CardHeader>
          <CardContent className="h-[400px] pt-12">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[
                  { label: 'FD', val: stats.totalFixedDeposits, color: '#3b82f6' },
                  { label: 'INST.', val: stats.totalInstalments, color: '#10b981' },
                  { label: 'INT.', val: stats.totalInterest, color: '#8b5cf6' },
                  { label: 'NET', val: stats.totalFund, color: '#0f172a' }
                ]} 
                margin={{ top: 20, bottom: 20, left: 0, right: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} interval={0} />
                <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={40} style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.15))' }}>
                  <LabelList dataKey="val" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '11px', fontWeight: 'bold', fill: '#1e293b' }} offset={10} />
                  <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#8b5cf6" /><Cell fill="#0f172a" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* MEMBER EQUITY */}
        <Card className="col-span-12 lg:col-span-8 border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="py-4 px-6 bg-slate-50/30 border-b"><CardTitle className="text-[11px] font-black uppercase text-slate-900 tracking-widest">Member Equity Statement</CardTitle></CardHeader>
          <CardContent className="h-[400px] pt-12 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberChartData} margin={{ top: 25, bottom: 5, left: 10, right: 10 }}>
                <defs>
                  <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="2" dy="4" result="offsetblur" />
                    <feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer>
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis hide /> 
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar 
                  dataKey="total" 
                  radius={[6, 6, 0, 0]} 
                  barSize={42} 
                  style={{ filter: 'url(#barShadow)' }}
                >
                  <LabelList 
                    dataKey="total" 
                    position="top" 
                    formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} 
                    style={{ fontSize: '11px', fontWeight: '800', fill: '#0f172a' }} 
                    offset={12} 
                  />
                  {/* NEW CUSTOM VERTICAL LABEL COMPONENT */}
                  <LabelList dataKey="displayName" content={<VerticalNameLabel />} />
                  
                  {memberChartData.map((_, i) => <Cell key={i} fill={MEMBER_PALETTE[i % 10]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="py-4 px-6 bg-slate-50/30 border-b"><CardTitle className="text-[11px] font-black uppercase text-slate-900 tracking-widest">Treasury Liquidity</CardTitle></CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center pt-2">
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie data={liquidityData} innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                    {liquidityData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </RePie>
              </ResponsiveContainer>
            </div>
            <div className="w-full px-6 space-y-3 mt-4">
              {liquidityData.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5" style={{ backgroundColor: item.color }} />{item.name}</div>
                  <span className="text-slate-900 italic">৳{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden lg:col-span-2">
          <CardHeader className="py-4 px-6 bg-slate-50/30 border-b"><CardTitle className="text-[11px] font-black uppercase text-slate-900 tracking-widest">Monthly Collection Trend</CardTitle></CardHeader>
          <CardContent className="h-[300px] pt-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={4} dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                <Tooltip formatter={(v: any) => `৳${v.toLocaleString()}`} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}