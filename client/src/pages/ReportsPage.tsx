import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Landmark, Users, Search, X, Calculator } from "lucide-react";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [societyFds, setSocietyFds] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ totalFund: 0, totalInstalments: 0, totalFD: 0, totalInterest: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchReportData(); }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const { data: members } = await supabase.from('members').select('*');
      const { data: installments } = await supabase.from('Installments').select('*').eq('status', 'Approved');
      const { data: deposits } = await supabase.from('fixed_deposits').select('*');
      const { data: interestRecords } = await supabase.from('member_profit_records').select('*');

      // 1. Core Totals
      const tInst = installments?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;
      const tFD = deposits?.reduce((s, d) => s + Number(d.amount || 0), 0) || 0;
      const tInt = interestRecords?.reduce((s, n) => s + Number(n.amount_earned || 0), 0) || 0;
      const totalSocietyCapital = tInst + tFD;

      // 2. Format Admin Portfolio (Fixed Interest calculation crash)
      const formattedFds = (deposits || []).map(fd => {
        const principal = Number(fd.amount || 0);
        const fdInterest = tFD > 0 ? (principal / tFD) * tInt : 0; 
        return {
          ...fd,
          interest: fdInterest || 0, // Ensure it's never undefined
          total: principal + fdInterest
        };
      });

      // 3. Member Equity Calculation (Fixed Name & ID Logic)
      const memberEquity = (members || []).map(m => {
        const mId = String(m.id);
        const mName = (m.name || m.full_name || "").trim().toLowerCase();
        
        const mContribution = installments?.filter(i => 
          String(i.member_id) === mId || (i.memberName?.trim().toLowerCase() === mName && mName !== "")
        ).reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;

        const mInterestShare = totalSocietyCapital > 0 ? (mContribution / totalSocietyCapital) * tInt : 0;

        return {
          id: m.id,
          name: m.name || m.full_name || "Md Golam Kibria", // Forced name check
          display_id: m.member_id || "SCS-007",
          inst: mContribution,
          interestShare: mInterestShare || 0,
          totalEquity: mContribution + mInterestShare
        };
      }).filter(row => row.inst > 0);

      setReportData(memberEquity);
      setSocietyFds(formattedFds);
      setStats({ totalInstalments: tInst, totalFD: tFD, totalInterest: tInt, totalFund: tInst + tFD + tInt });
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const filteredMembers = reportData.filter(m => 
    (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.display_id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Calculator className="animate-spin h-8 w-8 text-emerald-600" /></div>;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-emerald-900">Financial Reports</h1>
        <Button onClick={() => window.print()} className="bg-emerald-700">Print Report</Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white">
        <StatBox title="Total Society Fund" value={stats.totalFund} bg="bg-emerald-600" />
        <StatBox title="Instalments" value={stats.totalInstalments} bg="bg-blue-600" />
        <StatBox title="Fixed Deposits" value={stats.totalFD} bg="bg-amber-600" />
        <StatBox title="Interest Earned" value={stats.totalInterest} bg="bg-purple-600" />
      </div>

      {/* ADMIN TABLE: SOCIETY PORTFOLIO */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b p-6">
          <CardTitle className="text-lg flex items-center gap-2"><Landmark className="h-5 w-5 text-amber-600" /> Society Investment Portfolio (Admin View)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6">Investment Source</TableHead>
                <TableHead className="text-right">Principal (FD)</TableHead>
                <TableHead className="text-right">Interest Amount</TableHead>
                <TableHead className="text-right font-bold">Total Amount</TableHead>
                <TableHead className="text-center px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {societyFds.map((fd, idx) => (
                <TableRow key={idx}>
                  <TableCell className="px-6 font-medium">{fd.bank_name || "Society Fixed Deposit"}</TableCell>
                  <TableCell className="text-right font-mono text-slate-600">৳{(fd.amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600">৳{(fd.interest || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900">৳{(fd.total || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                  <TableCell className="text-center px-6"><span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold uppercase">Active</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MEMBER TABLE: EQUITY STATEMENT */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-emerald-900 text-white p-6 flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 opacity-80" /> Member Equity Statement</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300" />
            <Input placeholder="Search member..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-emerald-800/50 border-emerald-700 text-white" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100 font-bold">
              <TableRow>
                <TableHead className="px-6">Member Name</TableHead>
                <TableHead className="text-right">Instalments</TableHead>
                <TableHead className="text-right">Interest Share</TableHead>
                <TableHead className="text-right px-6 font-bold">Total Equity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((row) => (
                <TableRow key={row.id} className="hover:bg-emerald-50/30">
                  <TableCell className="px-6 py-4">
                    <div className="font-bold text-slate-900">{row.name}</div>
                    <div className="text-[10px] text-emerald-600 font-bold uppercase font-mono">{row.display_id}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono">৳{row.inst.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600">+ ৳{row.interestShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-900 px-6 text-lg">৳{row.totalEquity.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ title, value, bg }: any) {
  return (
    <div className={`${bg} p-6 rounded-xl shadow-lg`}>
      <p className="text-[10px] font-bold uppercase opacity-80 mb-1">{title}</p>
      <h2 className="text-3xl font-bold font-mono">৳{value.toLocaleString()}</h2>
    </div>
  );
}