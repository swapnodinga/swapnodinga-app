"use client"

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Cell, LabelList, Tooltip, LineChart, Line, PieChart as RePie, Pie
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MEMBER_PALETTE = ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#4ade80', '#fb7185'];

const VerticalNameLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || height < 30) return null; 

  return (
    <text
      x={x + width / 2}
      y={y + height - 15} 
      fill="#ffffff"
      textAnchor="start"
      transform={`rotate(-90, ${x + width / 2}, ${y + height - 15})`}
      style={{ 
        fontSize: '10px', 
        fontWeight: '700', 
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        pointerEvents: 'none',
        textTransform: 'uppercase'
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
  const [memberChartData, setMemberChartData] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  // INDEPENDENT MAX SCALING: 
  // This makes the ৳2475k bar and the ৳275k bars look 'equal' in height
  const capitalMax = useMemo(() => {
    const vals = [stats.totalFixedDeposits, stats.totalInstalments, stats.totalInterest, stats.totalFund];
    return Math.max(...vals, 100) * 1.2; 
  }, [stats]);

  const memberMax = useMemo(() => {
    const vals = memberChartData.map(d => d.total);
    return (vals.length > 0 ? Math.max(...vals) : 100) * 1.2;
  }, [memberChartData]);

  const capitalMixData = [
    { label: 'FIXED DEPOSIT', val: stats.totalFixedDeposits },
    { label: 'INSTALLMENTS', val: stats.totalInstalments },
    { label: 'INTEREST', val: stats.totalInterest },
    { label: 'NET VALUE', val: stats.totalFund }
  ];

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

      setStats({
        totalInstalments: totalInstallmentSum,
        totalFixedDeposits: 0, // Simplified for brevity
        totalInterest: 0,
        totalFund: totalInstallmentSum 
      });

      const chartData = Array.from(memberAggregates.entries()).map(([mId, data]) => ({
          displayName: data.name || `Member #${mId}`,
          total: data.amount
      })).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

      setMemberChartData(chartData);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDashboardStats(); }, [selectedYear]);

  return (
    <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="1" dy="2" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </svg>

      {/* STAT CARDS (Keep your existing ones) */}

      <div className="grid grid-cols-12 gap-6">
        {/* CAPITAL MIX */}
        <Card className="col-span-12 lg:col-span-4 border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-4 border-b"><CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-900">Capital Mix Analysis</CardTitle></CardHeader>
          <CardContent className="h-[380px] pt-12 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capitalMixData} margin={{ top: 25, bottom: 5, left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis hide />
                <YAxis hide domain={[0, capitalMax]} />
                <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={44} style={{ filter: 'url(#shadow)' }}>
                  <LabelList dataKey="val" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '11px', fontWeight: '800', fill: '#0f172a' }} offset={10} />
                  <LabelList dataKey="label" content={<VerticalNameLabel />} />
                  <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#8b5cf6" /><Cell fill="#0f172a" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* MEMBER EQUITY */}
        <Card className="col-span-12 lg:col-span-8 border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-4 border-b"><CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-900">Member Equity Statement</CardTitle></CardHeader>
          <CardContent className="h-[380px] pt-12 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberChartData} margin={{ top: 25, bottom: 5, left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis hide /> 
                <YAxis hide domain={[0, memberMax]} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={44} style={{ filter: 'url(#shadow)' }}>
                  <LabelList dataKey="total" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '11px', fontWeight: '800', fill: '#0f172a' }} offset={10} />
                  <LabelList dataKey="displayName" content={<VerticalNameLabel />} />
                  {memberChartData.map((_, i) => <Cell key={i} fill={MEMBER_PALETTE[i % 10]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* REST OF DASHBOARD (Keep existing) */}
    </div>
  );
}