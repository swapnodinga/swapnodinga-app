"use client"

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Landmark, Users, Calculator, Printer, History } from "lucide-react";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [societyFds, setSocietyFds] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalFund: 0, totalInstalments: 0, totalFD: 0, totalInterest: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { 
    fetchReportData(); 
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();

      // 1. Fetch all necessary data
      const { data: members } = await supabase.from('members').select('id, full_name, society_id').eq('status', 'active');
      
      let installments: any[] = [];
      for (const tbl of ['Installments', 'installments']) {
        const { data, error } = await supabase.from(tbl).select('*').eq('status', 'Approved');
        if (!error && data) { installments = data; break; }
      }
      
      const { data: deposits } = await supabase.from('fixed_deposits').select('*');

      // 2. Group FDs by MTDR and Calculate Realized Interest
      const groupedByMtdr = new Map<string, any[]>();
      (deposits || []).forEach(fd => {
        const mtdr = (fd.mtdr_no || "UNASSIGNED").trim().replace(":", "-");
        if (!groupedByMtdr.has(mtdr)) groupedByMtdr.set(mtdr, []);
        groupedByMtdr.get(mtdr)!.push(fd);
      });

      let totalRealizedInterest = 0;
      let totalActivePrincipal = 0;
      const displayFds: any[] = [];

      groupedByMtdr.forEach((rows, mtdr) => {
        const sorted = [...rows].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        const latest = sorted[0];

        let mtdrRealizedInterest = 0;
        
        rows.forEach(row => {
          const start = new Date(row.start_date);
          const tenure = Number(row.tenure_months) || 3;
          const maturity = new Date(start);
          maturity.setMonth(maturity.getMonth() + tenure);

          // Only count interest if the FD has matured
          if (maturity <= today) {
            mtdrRealizedInterest += (Number(row.amount) * Number(row.interest_rate) * tenure) / 1200;
          }
        });

        if (latest.status === "Active") {
          totalActivePrincipal += Number(latest.amount);
        }

        totalRealizedInterest += Math.round(mtdrRealizedInterest);

        displayFds.push({
          ...latest,
          mtdr_display: mtdr,
          realized: Math.round(mtdrRealizedInterest),
          history_count: rows.length
        });
      });

      // 3. Calculate Member Equity (Installments + Interest Share)
      const totalPool = installments.reduce((s, i) => s + Number(i.amount || 0), 0);

      const memberEquity = (members || [])
        .filter(m => m.full_name.toLowerCase() !== "admin")
        .map((m) => {
          const mContribution = installments
            .filter(i => i.member_id === m.id)
            .reduce((sum, i) => sum + Number(i.amount || 0), 0);

          const sharePercent = totalPool > 0 ? (mContribution / totalPool) : 0;
          const mInterestShare = sharePercent * totalRealizedInterest;

          return {
            id: m.id,
            name: m.full_name,
            display_id: m.society_id || "N/A",
            inst: mContribution,
            interestShare: mInterestShare,
            totalEquity: mContribution + mInterestShare
          };
        })
        .filter(row => row.inst > 0)
        .sort((a, b) => b.inst - a.inst);

      setReportData(memberEquity);
      setSocietyFds(displayFds);
      setStats({ 
        totalInstalments: totalPool, 
        totalFD: totalActivePrincipal, 
        totalInterest: totalRealizedInterest, 
        totalFund: totalPool + totalRealizedInterest 
      });

    } catch (e) { 
      console.error("Report Generation Error:", e); 
    } finally { 
      setIsLoading(false); 
    }
  };

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <Calculator className="animate-spin h-10 w-10 text-emerald-600 mx-auto" />
        <p className="text-slate-400 font-bold animate-pulse uppercase text-xs tracking-widest">Generating Audit Report</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 px-6 space-y-6 max-w-7xl mx-auto bg-slate-50/50 min-h-screen print:bg-white print:p-0 print:m-0">
      <style jsx global>{`
        @media print {
          nav, aside, header, .print-hidden, [role="navigation"], .sidebar { display: none !important; }
          body, main, .max-w-7xl { width: 100% !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .card { border: 1px solid #e2e8f0 !important; shadow: none !important; }
        }
      `}</style>

      <div className="flex justify-between items-center print:mb-8">
        <div>
          <h1 className="text-3xl font-black text-emerald-900 uppercase tracking-tighter">Society Financial Audit</h1>
          <p className="text-slate-500 font-medium text-sm">Fiscal Period: {new Date().getFullYear()} Summary</p>
        </div>
        <Button onClick={() => window.print()} className="bg-emerald-700 hover:bg-emerald-800 font-bold print:hidden">
            <Printer size={16} className="mr-2" /> Print PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox title="Net Liquid Assets" value={stats.totalFund} bg="bg-slate-900 text-white" />
        <StatBox title="Approved Principal" value={stats.totalInstalments} bg="bg-emerald-600 text-white" />
        <StatBox title="Current FD Capital" value={stats.totalFD} bg="bg-blue-600 text-white" />
        <StatBox title="Verified Interest" value={stats.totalInterest} bg="bg-purple-600 text-white" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Member Shares */}
        <Card className="xl:col-span-2 border-none shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200">
          <CardHeader className="bg-emerald-900 text-white p-4 print:bg-slate-100 print:text-black">
            <CardTitle className="text-sm flex items-center gap-2 font-bold uppercase tracking-widest">
              <Users className="h-4 w-4 text-emerald-400" /> Member Equity Statement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="text-[10px] uppercase">
                  <TableHead className="px-6 font-bold">Member Information</TableHead>
                  <TableHead className="text-right font-bold">Contributions</TableHead>
                  <TableHead className="text-right font-bold">Dividend Share</TableHead>
                  <TableHead className="text-right px-6 font-bold text-emerald-900">Total Equity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-emerald-50/30 border-b last:border-none">
                    <TableCell className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{row.name}</div>
                      <div className="text-[9px] text-emerald-600 font-bold uppercase font-mono">{row.display_id}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-700">৳{row.inst.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">
                      + ৳{Math.round(row.interestShare).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono font-black text-emerald-900 px-6 text-lg">
                      ৳{Math.round(row.totalEquity).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right Side: FD Records */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200">
          <CardHeader className="border-b p-4 bg-slate-50/50">
            <CardTitle className="text-xs flex items-center gap-2 font-bold text-slate-400 uppercase tracking-widest">
              <Landmark className="h-4 w-4" /> Active MTDR Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {societyFds.map((fd, idx) => (
              <div key={idx} className="flex justify-between items-end border-b pb-3 last:border-none">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800 text-xs">{fd.mtdr_display}</span>
                    <Badge variant="outline" className="text-[8px] h-4 px-1 uppercase bg-blue-50 text-blue-600 border-none font-bold">
                      {fd.status}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Principal: ৳{Number(fd.amount).toLocaleString()} <br/>
                    {fd.history_count > 1 && <span className="text-emerald-600 flex items-center gap-1 font-bold"><History size={10}/> {fd.history_count} Cycles</span>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Earned</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">৳{fd.realized.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      <div className="hidden print:block text-right pt-6 text-[10px] text-slate-400 font-mono">
        System Verified Audit | Generated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

function StatBox({ title, value, bg }: any) {
  return (
    <div className={`${bg} p-5 rounded-2xl shadow-sm border border-black/5`}>
      <p className="text-[9px] font-bold uppercase opacity-70 mb-1 tracking-widest">{title}</p>
      <h2 className="text-xl md:text-2xl font-black font-mono tracking-tighter">৳{Math.round(value).toLocaleString()}</h2>
    </div>
  );
}