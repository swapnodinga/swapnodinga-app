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

  const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => { fetchReportData(); }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const { data: members } = await supabase.from('members').select('id, full_name, society_id').order('id', { ascending: true });
      const { data: installments } = await supabase.from('Installments').select('*').eq('status', 'Approved');
      const { data: deposits } = await supabase.from('fixed_deposits').select('*');

      let finishedFdPrincipal = 0;
      let totalEarnedInterest = 0;

      const processedFds = (deposits || []).map(fd => {
        const principal = Number(fd.amount || 0);
        const tenure = Number(fd.tenure_months || 0);
        const rate = Number(fd.interest_rate || 0);
        
        const monthIndex = monthsList.indexOf(fd.month);
        const startDate = new Date(Number(fd.year), monthIndex, 1);
        const maturityDate = new Date(startDate);
        maturityDate.setMonth(startDate.getMonth() + tenure);
        
        const isFinished = maturityDate <= new Date(); 
        const calculatedInterest = (principal * (rate / 100) * (tenure / 12));

        if (isFinished) {
          finishedFdPrincipal += principal;
          totalEarnedInterest += calculatedInterest;
        }

        return {
          ...fd,
          status: isFinished ? "FINISHED" : "ACTIVE",
          displayInterest: calculatedInterest,
          earnedInterest: isFinished ? calculatedInterest : 0,
          total: principal + (isFinished ? calculatedInterest : 0),
          tenure_display: `${tenure} Months`
        };
      });

      const tInst = installments?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;
      const tFD = processedFds.reduce((s, d) => s + Number(d.amount || 0), 0) || 0;

      const memberEquity = (members || [])
        .filter(m => (m.full_name || "").toLowerCase() !== "admin")
        .map((m) => {
          const mId = m.id;
          const mName = (m.full_name || "").trim();
          
          const mContribution = installments?.filter(i => 
            Number(i.member_id) === Number(mId) || 
            (i.memberName?.trim().toLowerCase() === mName.toLowerCase() && mName !== "")
          ).reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;

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
        totalFund: tInst + tFD + totalEarnedInterest 
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
    <div className="p-6 space-y-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen print:bg-white print:p-0 print:m-0">
      {/* GLOBAL PRINT STYLE TO REMOVE SIDEBARS */}
      <style jsx global>{`
        @media print {
          /* Hide sidebar, navigation, and other UI elements from the parent layout */
          nav, aside, header, .print-hidden, [role="navigation"], .sidebar {
            display: none !important;
          }
          /* Ensure the content takes full width */
          body, main, .max-w-7xl {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          /* Reset card shadows for cleaner printing */
          .shadow-md {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold text-emerald-900 uppercase tracking-tight">Financial Reports</h1>
        <Button onClick={() => window.print()} className="bg-emerald-700 hover:bg-emerald-800 shadow-sm font-bold">
            <Printer size={16} className="mr-2" /> Print Full Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white print:gap-2">
        <StatBox title="Total Society Fund" value={stats.totalFund} bg="bg-slate-900 print:bg-slate-100 print:text-black" />
        <StatBox title="Total Instalments" value={stats.totalInstalments} bg="bg-emerald-600 print:bg-emerald-50 print:text-black" />
        <StatBox title="Fixed Deposits" value={stats.totalFD} bg="bg-blue-600 print:bg-blue-50 print:text-black" />
        <StatBox title="Interest Earned" value={stats.totalInterest} bg="bg-purple-600 print:bg-purple-50 print:text-black" />
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white print:border print:border-slate-200">
        <CardHeader className="border-b p-6 print:p-4">
          <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
            <Landmark className="h-5 w-5 text-amber-600" /> Society Investment Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 font-bold text-slate-600">Investment Source</TableHead>
                <TableHead className="font-bold text-center text-slate-600">Tenure</TableHead>
                <TableHead className="text-right font-bold text-slate-600">Principal Amount</TableHead>
                <TableHead className="text-right font-bold text-slate-600">Interest Earned</TableHead>
                <TableHead className="text-right font-bold text-slate-600">Total Value</TableHead>
                <TableHead className="text-center px-6 font-bold text-slate-600">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {societyFds.map((fd, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/50 border-b last:border-none">
                  <TableCell className="px-6 font-semibold text-slate-700">Fixed Deposit ({fd.month} {fd.year})</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-slate-500 font-bold text-xs uppercase">
                      <Clock size={14} className="print:hidden"/>{fd.tenure_display}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-600">৳{(fd.amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600">৳{Math.round(fd.displayInterest).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900">৳{Math.round(fd.total).toLocaleString()}</TableCell>
                  <TableCell className="text-center px-6">
                    <Badge variant="outline" className={`font-black uppercase text-[9px] px-2 py-0.5 ${
                      fd.status === "FINISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
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

      <Card className="border-none shadow-md overflow-hidden bg-white print:border print:border-slate-200">
        <CardHeader className="bg-emerald-900 text-white p-6 flex flex-col md:flex-row justify-between items-center gap-4 print:bg-white print:text-black print:border-b">
          <CardTitle className="text-lg flex items-center gap-2 font-bold uppercase tracking-wider">
            <Users className="h-5 w-5 text-emerald-400 print:text-emerald-700" /> Member Equity Statement
          </CardTitle>
          <div className="relative w-full md:w-80 print:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300" />
            <Input 
              placeholder="Search by name or SCS ID..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-9 bg-emerald-800/50 border-emerald-700 text-white placeholder:text-emerald-400 focus:ring-emerald-500" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="px-6 font-bold text-slate-700">Member Identity</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Total Instalments</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Interest Dividends</TableHead>
                <TableHead className="text-right px-6 font-bold text-emerald-900">Net Equity Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((row) => (
                <TableRow key={row.id} className="hover:bg-emerald-50/30 border-b last:border-none">
                  <TableCell className="px-6 py-5">
                    <div className="font-bold text-slate-900 text-base">{row.name}</div>
                    <div className="text-[10px] text-emerald-600 font-bold uppercase font-mono mt-0.5 tracking-widest">{row.display_id}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-700 font-medium">৳{row.inst.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 font-medium">
                    + ৳{row.interestShare.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-900 px-6 text-xl">
                    ৳{row.totalEquity.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Footer for printed page */}
      <div className="hidden print:block text-right pt-10 text-xs text-slate-400">
        Generated on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

function StatBox({ title, value, bg }: any) {
  return (
    <div className={`${bg} p-6 rounded-2xl shadow-lg border-b-4 border-black/10 print:border-none print:shadow-none print:border print:border-slate-200`}>
      <p className="text-[10px] font-bold uppercase opacity-75 mb-1 tracking-widest">{title}</p>
      <h2 className="text-3xl font-black font-mono">৳{Math.round(value).toLocaleString()}</h2>
    </div>
  );
}