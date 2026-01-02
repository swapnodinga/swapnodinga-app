import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, PiggyBank, Wallet, TrendingUp } from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Cell, LabelList 
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
      const { data: members } = await supabase.from('members').select('full_name, member_id');
      const { data: allInstallments } = await supabase.from('Installments').select('*').eq('status', 'Approved');
      const { data: deposits } = await supabase.from('fixed_deposits').select('*');

      let calculatedTotalFD = 0;
      let calculatedFinishedInterest = 0;

      (deposits || []).forEach(fd => {
        const principal = Number(fd.amount || 0);
        calculatedTotalFD += principal;
        const monthIndex = monthsList.indexOf(fd.month);
        const maturityDate = new Date(Number(fd.year), monthIndex + Number(fd.tenure_months || 0), 1);
        if (maturityDate <= new Date()) {
          calculatedFinishedInterest += (principal * (Number(fd.interest_rate || 0) / 100) * (Number(fd.tenure_months || 0) / 12));
        }
      });

      const filteredRecords = allInstallments?.filter(rec => {
        const yearVal = rec.year || rec.Year || (rec.created_at ? new Date(rec.created_at).getFullYear() : null);
        return String(yearVal) === String(selectedYear);
      }) || [];

      const sumInstalments = filteredRecords.reduce((sum, item) => sum + Number(item.amount || item.Amount || 0), 0);
      
      setStats({
        totalInstalments: sumInstalments,
        totalFixedDeposits: calculatedTotalFD,
        totalInterest: calculatedFinishedInterest,
        totalFund: sumInstalments + calculatedTotalFD + calculatedFinishedInterest
      });

      const grouped = filteredRecords.reduce((acc: any, curr) => {
        const nameKey = curr.memberName || curr.full_name || curr.member_name || "Unknown Member";
        acc[nameKey] = (acc[nameKey] || 0) + Number(curr.amount || curr.Amount || 0);
        return acc;
      }, {});

      const chartData = Object.keys(grouped).map(nameKey => {
        const interestShare = calculatedTotalFD > 0 ? (calculatedFinishedInterest / calculatedTotalFD) * grouped[nameKey] : 0;
        return {
          displayName: nameKey, // Restored full name
          total: grouped[nameKey] + interestShare
        };
      })
      .filter(d => d.displayName !== "Unknown Member")
      .sort((a, b) => b.total - a.total);

      setMemberChartData(chartData);
    } catch (e) {
      console.error("Dashboard Error:", e);
    }
  };

  useEffect(() => { fetchDashboardStats(); }, [selectedYear]);

  const financialMixData = [
    { l1: 'FIXED', l2: 'DEPOSIT', val: stats.totalFixedDeposits, color: '#3b82f6' },
    { l1: 'TOTAL', l2: 'INSTALLMENT', val: stats.totalInstalments, color: '#10b981' },
    { l1: 'TOTAL', l2: 'INTEREST', val: stats.totalInterest, color: '#8b5cf6' },
    { l1: 'TOTAL', l2: 'FUND', val: stats.totalFund, color: '#0f172a' }
  ];

  return (
    <div className="p-4 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wider">Admin Dashboard</h1>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Society Total Fund" value={`৳${stats.totalFund.toLocaleString()}`} icon={Landmark} className="border-b-4 border-slate-900" />
        <StatCard title="Total Installments" value={`৳${stats.totalInstalments.toLocaleString()}`} icon={PiggyBank} className="border-b-4 border-emerald-500" />
        <StatCard title="Fixed Deposits" value={`৳${stats.totalFixedDeposits.toLocaleString()}`} icon={Wallet} className="border-b-4 border-blue-500" />
        <StatCard title="Total Interest" value={`৳${stats.totalInterest.toLocaleString()}`} icon={TrendingUp} className="border-b-4 border-purple-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-xs font-bold uppercase text-slate-500">Financial Mix</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] pt-12"> {/* Restored original height */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialMixData} margin={{ top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="l1" axisLine={false} tickLine={false} interval={0} 
                  tick={({ x, y, index }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={16} textAnchor="middle" fill="#64748b" className="text-[11px] font-bold uppercase">{financialMixData[index].l1}</text>
                      <text x={0} y={31} textAnchor="middle" fill="#64748b" className="text-[11px] font-bold uppercase">{financialMixData[index].l2}</text>
                    </g>
                  )}
                />
                <YAxis hide />
                <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={65}>
                  {financialMixData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  <LabelList dataKey="val" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(1)}k`} style={{ fontSize: '12px', fontWeight: 'bold' }} offset={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-xs font-bold uppercase text-slate-500">Member Contributions</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] pt-12"> {/* Restored original height */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberChartData} margin={{ top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayName" axisLine={false} tickLine={false} interval={0}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} // Restored standard tick
                />
                <YAxis hide />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} barSize={65}>
                  <LabelList dataKey="total" position="top" formatter={(v: any) => `৳${(v/1000).toFixed(1)}k`} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#059669' }} offset={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}