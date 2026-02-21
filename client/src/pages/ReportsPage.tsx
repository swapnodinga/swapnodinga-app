"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Landmark, Users, Search, Calculator, Printer, Clock } from "lucide-react";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [societyFds, setSocietyFds] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ totalFund: 0, totalInstalments: 0, totalFD: 0, totalInterest: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchReportData(); }, []);

  const getMaturityData = (amount: number, rate: number, start: string, months: number) => {
    const startDate = new Date(start);
    const finishDate = new Date(start);
    finishDate.setMonth(startDate.getMonth() + Number(months));
    
    // Accurate daily calculation to match FixedDepositPage logic
    const diffDays = Math.ceil(Math.abs(finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const interest = (amount * rate * diffDays) / (365 * 100);
    
    const isFinished = finishDate <= new Date();
    
    return {
      interest,
      total: amount + interest,
      isFinished,
      finishDateStr: finishDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-")
    };
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const { data: members } = await supabase.from('members').select('id, full_name, society_id').order('id', { ascending: true });
      let installments: any[] | null = null;
      for (const tbl of ['installments', 'Installments']) {
        const { data, error } = await supabase.from(tbl).select('*').eq('status', 'Approved');
        if (!error) { installments = data; break; }
      }
      const { data: deposits } = await supabase.from('fixed_deposits').select('*');

      let totalEarnedInterest = 0;
      let finishedFdPrincipal = 0;

      const processedFds = (deposits || []).map(fd => {
        const m = getMaturityData(
          Number(fd.amount), 
          Number(fd.interest_rate), 
          fd.start_date, 
          Number(fd.tenure_months)
        );

        if (m.isFinished) {
          totalEarnedInterest += m.interest;
          finishedFdPrincipal += Number(fd.amount);
        }

        return {
          ...fd,
          status: m.isFinished ? "FINISHED" : "ACTIVE",
          displayInterest: m.interest,
          total: m.isFinished ? (Number(fd.amount) + m.interest) : Number(fd.amount),
          tenure_display: `${fd.tenure_months} Months`,
          finishDate: m.finishDateStr
        };
      });

      const tInst = installments?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;
      const tFD = processedFds.reduce((s, d) => s + (d.status === "ACTIVE" ? Number(d.amount) : 0), 0) || 0;

      const memberEquity = (members || [])
        .filter(m => (m.full_name || "").toLowerCase() !== "admin")
        .map((m) => {
          const mId = m.id;
          const mName = (m.full_name || "").trim();
          
          const mContribution = installments?.filter(i => 
            Number(i.member_id) === Number(mId) || 
            (i.memberName?.trim().toLowerCase() === mName.toLowerCase())
          ).reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;

          // Member gets share of interest based on their contribution to total pool
          const mInterestShare = finishedFdPrincipal > 0 
            ? (totalEarnedInterest / finishedFdPrincipal) * mContribution 
            : 0;

          return {
            id: m.id,
            name: mName,
            display_id: m.society_id || "N/A",
            inst: mContribution,
            interestShare: mInterestShare,
            totalEquity: mContribution + mInterestShare
          };
        }).filter(row => row.inst > 0);

      setReportData(memberEquity);
      setSocietyFds(processedFds);
      setStats({ 
        totalInstalments: tInst, 
        totalFD: tFD, 
        totalInterest: totalEarnedInterest, 
        totalFund: tInst + totalEarnedInterest // Total liquid value
      });
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const filteredMembers = reportData.filter(m => 
    (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.display_id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Calculator className="animate-spin h-8 w-8 text-emerald-600" /></div>;

  return (
    <div className="p-4 px-6 space-y-6 max-w-full mx-auto bg-slate-50/50 min-h-screen print:bg-white print:p-0 print:m-0">
      <style jsx global>{`
        @media print {
          nav, aside, header, .print-hidden, [role="navigation"], .sidebar { display: none !important; }
          body, main, .max-w-full { width: 100% !important; padding: 0 !important; margin: 0 !important; }
        }
      `}</style>

      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold text-emerald-900 uppercase tracking-tight">Society Financial Report</h1>
        <Button onClick={() => window.print()} className="bg-emerald-700 hover:bg-emerald-800 font-bold shadow-none">
            <Printer size={16} className="mr-2" /> Print Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:gap-2">
        <StatBox title="Net Society Value" value={stats.totalFund} bg="bg-slate-900 text-white" />
        <StatBox title="Total Instalments" value={stats.totalInstalments} bg="bg-emerald-600 text-white" />
        <StatBox title="Active FD Capital" value={stats.totalFD} bg="bg-blue-600 text-white" />
        <StatBox title="Realized Interest" value={stats.totalInterest} bg="bg-purple-600 text-white" />
      </div>

      <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200">
        <CardHeader className="border-b p-4 bg-slate-50/50">
          <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wide">
            <Landmark className="h-4 w-4 text-amber-600" /> Investment Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="text-[11px] uppercase">
                <TableHead className="px-6 font-bold">Entry Month</TableHead>
                <TableHead className="font-bold text-center">Finish Date</TableHead>
                <TableHead className="text-right font-bold">Principal</TableHead>
                <TableHead className="text-right font-bold">Interest</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
                <TableHead className="text-center px-6 font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {societyFds.map((fd, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/50 border-b last:border-none">
                  <TableCell className="px-6 font-bold text-slate-700 text-sm">FD: {fd.month} {fd.year}</TableCell>
                  <TableCell className="text-center text-xs font-bold text-slate-500">{fd.finishDate}</TableCell>
                  <TableCell className="text-right font-mono text-slate-600">৳{(fd.amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600">৳{Math.round(fd.displayInterest).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900">৳{Math.round(fd.total).toLocaleString()}</TableCell>
                  <TableCell className="text-center px-6">
                    <Badge variant="outline" className={`font-black uppercase text-[9px] border-none ${
                      fd.status === "FINISHED" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                    }`}>
                      {fd.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200">
        <CardHeader className="bg-emerald-900 text-white p-4 print:bg-white print:text-black print:border-b">
          <CardTitle className="text-md flex items-center gap-2 font-bold uppercase tracking-wider">
            <Users className="h-4 w-4 text-emerald-400 print:text-emerald-700" /> Member Equity Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow className="text-[11px] uppercase">
                <TableHead className="px-6 font-bold">Member Details</TableHead>
                <TableHead className="text-right font-bold">Contribution</TableHead>
                <TableHead className="text-right font-bold">Dividends</TableHead>
                <TableHead className="text-right px-6 font-bold text-emerald-900">Net Equity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((row) => (
                <TableRow key={row.id} className="hover:bg-emerald-50/30 border-b last:border-none">
                  <TableCell className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm">{row.name}</div>
                    <div className="text-[9px] text-emerald-600 font-bold uppercase font-mono tracking-tighter">{row.display_id}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-700 text-sm">৳{row.inst.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 text-sm">
                    + ৳{row.interestShare.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-900 px-6 text-lg">
                    ৳{row.totalEquity.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="hidden print:block text-right pt-6 text-[10px] text-slate-400 font-mono">
        Official Report | Generated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

function StatBox({ title, value, bg }: any) {
  return (
    <div className={`${bg} p-5 rounded-xl shadow-sm border border-black/5`}>
      <p className="text-[9px] font-bold uppercase opacity-80 mb-1 tracking-widest">{title}</p>
      <h2 className="text-2xl font-black font-mono">৳{Math.round(value).toLocaleString()}</h2>
    </div>
  );
}