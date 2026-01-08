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
      // DYNAMIC ID FIX: Order by ID to ensure correct sequence
      const { data: members } = await supabase.from('members').select('*').order('id', { ascending: true });
      const { data: installments } = await supabase.from('Installments').select('*').eq('status', 'Approved');
      const { data: deposits } = await supabase.from('fixed_deposits').select('*');

      // 1. Process Society FDs
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

      // 2. Member Equity Logic
      // DYNAMIC ID FIX: Generate SCS-XXX based on the sorted index in the database
      const memberEquity = (members || [])
        .filter(m => (m.full_name || m.name || "").toLowerCase() !== "admin")
        .map((m, index) => {
          const mId = String(m.id);
          const mName = (m.full_name || m.name || "").trim();
          
          const mContribution = installments?.filter(i => 
            String(i.member_id) === mId || (i.memberName?.trim().toLowerCase() === mName.toLowerCase() && mName !== "")
          ).reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;

          const mInterestShare = finishedFdPrincipal > 0 
            ? (totalEarnedInterest / finishedFdPrincipal) * mContribution 
            : 0;

          // Automatically generate SCS ID: e.g., Index 0 becomes SCS-001
          const dynamicScsId = `SCS-${String(index + 1).padStart(3, '0')}`;

          return {
            id: m.id,
            name: mName,
            display_id: dynamicScsId,
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
        <Button onClick={() => window.print()} className="bg-emerald-700 hover:bg-emerald-800">
            <Printer size={16} className="mr-2" /> Print Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white">
        <StatBox title="Total Society Fund" value={stats.totalFund} bg="bg-emerald-600" />
        <StatBox title="Instalments" value={stats.totalInstalments} bg="bg-blue-600" />
        <StatBox title="Fixed Deposits" value={stats.totalFD} bg="bg-amber-600" />
        <StatBox title="Interest Earned" value={stats.totalInterest} bg="bg-purple-600" />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b p-6">
          <CardTitle className="text-lg flex items-center gap-2 font-bold">
            <Landmark className="h-5 w-5 text-amber-600" /> Society Investment Portfolio (Admin View)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 font-bold">Investment Source</TableHead>
                <TableHead className="font-bold text-center">Tenure</TableHead>
                <TableHead className="text-right font-bold">Principal (FD)</TableHead>
                <TableHead className="text-right font-bold">Interest Amount</TableHead>
                <TableHead className="text-right font-bold">Total Amount</TableHead>
                <TableHead className="text-center px-6 font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {societyFds.map((fd, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/50">
                  <TableCell className="px-6 font-medium">Society Fixed Deposit ({fd.month} {fd.year})</TableCell>
                  <TableCell className="text-center"><div className="flex items-center justify-center gap-1 text-slate-500 font-bold"><Clock size={12}/>{fd.tenure_display}</div></TableCell>
                  <TableCell className="text-right font-mono text-slate-600">৳{(fd.amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600">৳{Math.round(fd.displayInterest).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900">৳{Math.round(fd.total).toLocaleString()}</TableCell>
                  <TableCell className="text-center px-6">
                    <Badge variant="outline" className={`font-bold uppercase text-[10px] ${
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

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-emerald-900 text-white p-6 flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 opacity-80" /> Member Equity Statement
          </CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300" />
            <Input 
              placeholder="Search member..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-9 bg-emerald-800/50 border-emerald-700 text-white placeholder:text-emerald-400" 
            />
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
                    {/* DYNAMIC ID IS NOW AUTOMATIC */}
                    <div className="text-[10px] text-emerald-600 font-bold uppercase font-mono">{row.display_id}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono">৳{row.inst.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600">
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
    </div>
  );
}

function StatBox({ title, value, bg }: any) {
  return (
    <div className={`${bg} p-6 rounded-xl shadow-lg`}>
      <p className="text-[10px] font-bold uppercase opacity-80 mb-1">{title}</p>
      <h2 className="text-3xl font-bold font-mono">৳{Math.round(value).toLocaleString()}</h2>
    </div>
  );
}