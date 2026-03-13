import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSociety } from "@/context/SocietyContext";
import { LineChart, TrendingUp, Users, Banknote, PieChart, CalendarDays, ArrowUpRight, Calculator } from "lucide-react";

const fmt = (n: number) => "৳" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) => "৳" + Math.floor(n).toLocaleString("en-IN");

export default function InterestDistribution() {
  const { members, transactions, fixedDeposits, isLoading } = useSociety();
  const [selectedYear, setSelectedYear] = useState("all");

  // 1. Extract years from start_date or year column
  const years = useMemo(() => {
    const ySet = new Set<string>();
    fixedDeposits.forEach((fd) => {
      if (fd.year) ySet.add(fd.year.toString());
      else if (fd.start_date) ySet.add(new Date(fd.start_date).getFullYear().toString());
    });
    return Array.from(ySet).sort((a, b) => Number(b) - Number(a));
  }, [fixedDeposits]);

  // 2. Filter FDs
  const filteredFDs = useMemo(() => {
    if (selectedYear === "all") return fixedDeposits;
    return fixedDeposits.filter((fd) => 
      fd.year?.toString() === selectedYear || 
      (fd.start_date && new Date(fd.start_date).getFullYear().toString() === selectedYear)
    );
  }, [fixedDeposits, selectedYear]);

  // 3. Calculation Logic (Based on amount, rate, and tenure)
  const stats = useMemo(() => {
    let totalInvested = 0;
    let calculatedInterest = 0;
    let ratesSum = 0;

    filteredFDs.forEach(fd => {
      const principal = Number(fd.amount) || 0;
      const rate = Number(fd.interest_rate) || 0;
      const months = Number(fd.tenure_months) || 12;
      
      totalInvested += principal;
      ratesSum += rate;
      
      // Formula: (Principal * Rate * (Months/12)) / 100
      calculatedInterest += (principal * (rate / 100) * (months / 12));
    });

    return {
      totalInvested,
      totalInterest: calculatedInterest,
      avgRate: filteredFDs.length > 0 ? ratesSum / filteredFDs.length : 0,
      activeCount: filteredFDs.filter(f => f.status === "Active").length
    };
  }, [filteredFDs]);

  // 4. Proportional Distribution Logic
  const distribution = useMemo(() => {
    const approvedTxns = transactions.filter(t => t.status?.toLowerCase() === "approved");
    const totalContributionPool = approvedTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return members
      .filter(m => m.status === "active")
      .map(m => {
        const mContribution = approvedTxns
          .filter(t => t.member_id === m.id)
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        
        const equityPercent = totalContributionPool > 0 ? (mContribution / totalContributionPool) : 0;
        
        return {
          id: m.id,
          name: m.full_name,
          societyId: m.society_id,
          contribution: mContribution,
          equity: equityPercent * 100,
          dividend: equityPercent * stats.totalInterest
        };
      })
      .filter(m => m.contribution > 0)
      .sort((a, b) => b.contribution - a.contribution);
  }, [members, transactions, stats.totalInterest]);

  if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold">Loading Ledger...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <LineChart className="text-emerald-600" size={32} /> Interest Distribution
          </h1>
          <p className="text-slate-500 font-medium mt-1">Based on MTDR records and member equity share</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px] bg-white shadow-sm border-slate-200">
            <CalendarDays className="h-4 w-4 mr-2 text-emerald-600" />
            <SelectValue placeholder="Fiscal Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cumulative (All)</SelectItem>
            {years.map(y => <SelectItem key={y} value={y}>{y} Fiscal</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<Banknote />} label="Total Principal" value={fmtInt(stats.totalInvested)} color="bg-emerald-600" />
        <SummaryCard icon={<TrendingUp />} label="Est. Earnings" value={fmtInt(stats.totalInterest)} color="bg-blue-600" />
        <SummaryCard icon={<PieChart />} label="Avg. Rate" value={`${stats.avgRate.toFixed(2)}%`} color="bg-amber-500" />
        <SummaryCard icon={<Users />} label="Active FDs" value={stats.activeCount.toString()} color="bg-violet-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Proportional Dividend (Left) */}
        <Card className="xl:col-span-2 shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex justify-between items-end">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Member Dividend Allocation</CardTitle>
                <CardDescription>Proportional to approved contributions</CardDescription>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Distributable Interest</span>
                <p className="text-xl font-black text-emerald-700 leading-none">{fmtInt(stats.totalInterest)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6 text-[11px] uppercase font-bold">Society ID</TableHead>
                  <TableHead className="text-[11px] uppercase font-bold">Member Name</TableHead>
                  <TableHead className="text-center text-[11px] uppercase font-bold">Share %</TableHead>
                  <TableHead className="text-right pr-6 text-[11px] uppercase font-bold">Payable Dividend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distribution.map((m) => (
                  <TableRow key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-slate-500">{m.societyId}</TableCell>
                    <TableCell className="font-bold text-slate-700">{m.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">
                        {m.equity.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 p-4">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-lg font-black text-slate-800 tracking-tighter">৳{Math.floor(m.dividend).toLocaleString()}</span>
                        <ArrowUpRight size={14} className="text-emerald-500" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* FD Breakdown (Right) */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Active MTDR Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredFDs.map(fd => {
              const earned = (Number(fd.amount) * (Number(fd.interest_rate) / 100) * ((Number(fd.tenure_months) || 12) / 12));
              return (
                <div key={fd.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/30">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{fd.mtdr_no || "MTDR-UNASSIGNED"}</h4>
                    <Badge className={`text-[9px] h-4 uppercase ${fd.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : ''}`}>{fd.status}</Badge>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-[10px] text-slate-400 font-medium">
                      Principal: {fmtInt(fd.amount)} <br/>
                      Rate: {fd.interest_rate}%
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Estimated Int.</span>
                      <span className="font-bold text-emerald-600 text-sm">+{fmtInt(earned)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Distribution Formula Card */}
      <Card className="bg-emerald-900 text-emerald-50 border-none shadow-xl">
        <CardContent className="p-6">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-emerald-800 rounded-2xl"><Calculator size={24} /></div>
            <div>
              <h3 className="font-bold text-lg">Proportional Distribution Policy</h3>
              <p className="text-emerald-200 text-sm mt-1 max-w-3xl">
                The total interest pool is distributed based on the percentage of total approved contributions made by each member. 
                This ensures that members with higher financial commitment receive a larger share of the profits.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: any) {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`${color} p-2 rounded-lg text-white shadow-lg`}>{icon}</div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tighter">{value}</p>
        </div>
        <div className={`${color} h-1 w-full opacity-20`} />
      </CardContent>
    </Card>
  );
}