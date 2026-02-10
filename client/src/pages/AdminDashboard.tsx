"use client"

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MEMBER_PALETTE = ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#4ade80', '#fb7185'];

const VerticalNameLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  // If height is too small (less than 40px), show label above the bar instead of inside
  const isTooSmall = height < 40;

  return (
    <text
      x={x + width / 2}
      y={isTooSmall ? y - 25 : y + height - 15} 
      fill={isTooSmall ? "#64748b" : "#ffffff"}
      textAnchor="start"
      transform={isTooSmall ? "" : `rotate(-90, ${x + width / 2}, ${y + height - 15})`}
      style={{ 
        fontSize: '10px', 
        fontWeight: '700', 
        textShadow: isTooSmall ? 'none' : '1px 1px 2px rgba(0,0,0,0.6)',
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

  // DYNAMIC SYNC: Find the highest value between both charts to set the scale
  const sharedMax = useMemo(() => {
    const highestCapital = Math.max(stats.totalFixedDeposits, stats.totalInstalments, stats.totalInterest, stats.totalFund);
    const highestMember = memberChartData.length > 0 ? Math.max(...memberChartData.map(d => d.total)) : 0;
    const peak = Math.max(highestCapital, highestMember, 1000);
    return peak * 1.2; // 20% extra room for top labels
  }, [stats, memberChartData]);

  const fetchDashboardStats = async () => {
    try {
      const { data: members } = await supabase.from('members').select('id, memberName, full_name');
      const { data: installments } = await supabase.from('Installments').select('*').eq('status', 'Approved');

      const memberNamesMap: Record<string, string> = {};
      members?.forEach(m => { memberNamesMap[String(m.id)] = m.memberName || m.full_name || "Unknown"; });

      let totalSum = 0;
      const memberAggregates = new Map<string, number>();

      installments?.forEach(rec => {
        const date = new Date(rec.created_at);
        if (date.getFullYear().toString() === selectedYear) {
          const amt = Number(rec.amount || 0);
          totalSum += amt;
          const mId = String(rec.member_id);
          memberAggregates.set(mId, (memberAggregates.get(mId) || 0) + amt);
        }
      });

      setStats({
        totalInstalments: totalSum,
        totalFixedDeposits: 0, 
        totalInterest: 0,
        totalFund: totalSum 
      });

      const chartData = Array.from(memberAggregates.entries()).map(([mId, total]) => ({
          displayName: memberNamesMap[mId],
          total: total
      })).sort((a, b) => b.total - a.total);

      setMemberChartData(chartData);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDashboardStats(); }, [selectedYear]);

  return (
    <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen">
      {/* SVG Shadow definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="1" dy="2" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </svg>

      <div className="grid grid-cols-12 gap-6">
        {/* CAPITAL MIX */}
        <Card className="col-span-12 lg:col-span-4 border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-4 border-b bg-slate-50/50"><CardTitle className="text-[11px] font-black uppercase text-slate-900 tracking-widest">Capital Mix</CardTitle></CardHeader>
          <CardContent className="h-[380px] pt-12 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[
                  { label: 'FIXED DEPOSIT', val: stats.totalFixedDeposits },
                  { label: 'INSTALLMENTS', val: stats.totalInstalments },
                  { label: 'INTEREST', val: stats.totalInterest },
                  { label: 'NET VALUE', val: stats.totalFund }
                ]}
                margin={{ top: 25, bottom: 0, left: -20, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis hide />
                <YAxis hide domain={[0, sharedMax]} />
                <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={42} style={{ filter: 'url(#shadow)' }}>
                  <LabelList dataKey="val" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '10px', fontWeight: '800', fill: '#1e293b' }} offset={10} />
                  <LabelList dataKey="label" content={<VerticalNameLabel />} />
                  <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#8b5cf6" /><Cell fill="#0f172a" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* MEMBER EQUITY */}
        <Card className="col-span-12 lg:col-span-8 border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-4 border-b bg-slate-50/50"><CardTitle className="text-[11px] font-black uppercase text-slate-900 tracking-widest">Member Equity</CardTitle></CardHeader>
          <CardContent className="h-[380px] pt-12 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberChartData} margin={{ top: 25, bottom: 0, left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis hide /> 
                <YAxis hide domain={[0, sharedMax]} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={42} style={{ filter: 'url(#shadow)' }}>
                  <LabelList dataKey="total" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(0)}k`} style={{ fontSize: '10px', fontWeight: '800', fill: '#0f172a' }} offset={10} />
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