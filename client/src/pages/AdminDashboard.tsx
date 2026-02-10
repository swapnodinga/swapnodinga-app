"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, Tooltip, 
  LineChart, Line, PieChart as RePie, Pie, ResponsiveContainer 
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MEMBER_PALETTE = ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#4ade80', '#fb7185'];

// CONSTANTS FOR ALIGNMENT
const CHART_HEIGHT = 300;
const FIXED_DOMAIN = 3500000; // Hard scale to 35 Lakh

const VerticalNameLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || height < 20) return null; 

  return (
    <text
      x={x + width / 2}
      y={y + height - 10} 
      fill="#ffffff"
      textAnchor="start"
      transform={`rotate(-90, ${x + width / 2}, ${y + height - 10})`}
      style={{ 
        fontSize: '9px', 
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
  const [memberChartData, setMemberChartData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  const fetchDashboardStats = async () => {
    try {
      const { data: members } = await supabase.from('members').select('id, full_name, memberName');
      const { data: allInstallments } = await supabase.from('Installments').select('*').eq('status', 'Approved');
      const { data: deposits } = await supabase.from('fixed_deposits').select('*');

      const memberNamesMap: Record<string, string> = {};
      members?.forEach(m => { memberNamesMap[String(m.id)] = m.memberName || m.full_name || ""; });

      let totalInstallmentSum = 0;
      const memberAggregates = new Map<string, { amount: number, name: string }>();

      if (allInstallments) {
        allInstallments.forEach(rec => {
          const date = new Date(rec.created_at);
          const amount = Number(rec.amount || 0);
          if (date.getFullYear().toString() === selectedYear) {
            totalInstallmentSum += amount;
            const mId = String(rec.member_id);
            const existing = memberAggregates.get(mId) || { amount: 0, name: "" };
            memberAggregates.set(mId, { amount: existing.amount + amount, name: memberNamesMap[mId] || rec.memberName || existing.name });
          }
        });
      }

      setStats({
        totalInstalments: totalInstallmentSum,
        totalFixedDeposits: 0, // Simplified for visual fix
        totalInterest: 0,
        totalFund: totalInstallmentSum 
      });

      const chartData = Array.from(memberAggregates.entries()).map(([mId, data]) => ({
          displayName: data.name,
          total: data.amount
      })).sort((a, b) => b.total - a.total);

      setMemberChartData(chartData as any);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDashboardStats(); }, [selectedYear]);

  return (
    <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="1" dy="2" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </svg>

      {/* STAT CARDS (Omitted for brevity, keep your existing ones) */}

      <div className="grid grid-cols-12 gap-6">
        {/* CAPITAL MIX */}
        <Card className="col-span-12 lg:col-span-4 border-slate-200 shadow-sm bg-white">
          <CardHeader className="py-4 border-b"><CardTitle className="text-[11px] font-black uppercase">Capital Mix</CardTitle></CardHeader>
          <CardContent className="flex justify-center items-end pt-10 pb-4 h-[400px]">
            <BarChart 
                width={300} 
                height={CHART_HEIGHT} 
                data={[
                  { label: 'FIXED DEPOSIT', val: stats.totalFixedDeposits, color: '#3b82f6' },
                  { label: 'INSTALLMENTS', val: stats.totalInstalments, color: '#10b981' },
                  { label: 'INTEREST', val: stats.totalInterest, color: '#8b5cf6' },
                  { label: 'NET VALUE', val: stats.totalFund, color: '#0f172a' }
                ]}
                margin={{ top: 30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis hide />
              <YAxis hide domain={[0, FIXED_DOMAIN]} />
              <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={40} style={{ filter: 'url(#shadow)' }}>
                <LabelList dataKey="val" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '10px', fontWeight: '800' }} offset={10} />
                <LabelList dataKey="label" content={<VerticalNameLabel />} />
                <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#8b5cf6" /><Cell fill="#0f172a" />
              </Bar>
            </BarChart>
          </CardContent>
        </Card>

        {/* MEMBER EQUITY */}
        <Card className="col-span-12 lg:col-span-8 border-slate-200 shadow-sm bg-white">
          <CardHeader className="py-4 border-b"><CardTitle className="text-[11px] font-black uppercase">Member Equity</CardTitle></CardHeader>
          <CardContent className="pt-10 pb-4 h-[400px]">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={memberChartData} margin={{ top: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis hide /> 
                <YAxis hide domain={[0, FIXED_DOMAIN]} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40} style={{ filter: 'url(#shadow)' }}>
                  <LabelList dataKey="total" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '10px', fontWeight: '800' }} offset={10} />
                  <LabelList dataKey="displayName" content={<VerticalNameLabel />} />
                  {memberChartData.map((_, i) => <Cell key={i} fill={MEMBER_PALETTE[i % 10]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}