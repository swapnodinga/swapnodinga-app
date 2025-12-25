import { useSociety } from "@/context/SocietyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileBarChart, PieChart, TrendingUp } from "lucide-react";

export default function ReportsPage() {
  const { members, transactions, societyTotalFund } = useSociety();

  // Aggregate Data
  const totalFixedDeposits = members.reduce((sum, m) => sum + (m.fixedDeposit || 0), 0);
  const totalInterestDistributed = members.reduce((sum, m) => sum + (m.totalInterestEarned || 0), 0);
  const approvedPayments = transactions.filter(t => t.status === 'approved');
  const totalInstalments = approvedPayments.reduce((sum, t) => sum + t.amount, 0);

  const handleExport = () => {
    // Basic CSV Export Logic
    const headers = ["Member Name", "Instalments Paid", "Fixed Deposit", "Interest Earned", "Total Equity"];
    const rows = members.map(m => [
      m.name,
      m.totalInstalmentPaid,
      m.fixedDeposit,
      m.totalInterestEarned,
      (m.totalInstalmentPaid + m.fixedDeposit + m.totalInterestEarned)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Society_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-900">Financial Reports</h1>
          <p className="text-muted-foreground">Comprehensive summary of society capital and earnings.</p>
        </div>
        <Button onClick={handleExport} className="bg-emerald-700 hover:bg-emerald-800">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Total Society Fund
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-900">৳{societyTotalFund.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Total Instalments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-blue-900">৳{totalInstalments.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Fixed Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-900">৳{totalFixedDeposits.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Interest Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-purple-900">৳{totalInterestDistributed.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Member Breakdown */}
      <Card className="border-emerald-100">
        <CardHeader className="bg-emerald-50/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileBarChart className="text-emerald-700 h-5 w-5" />
            Member Equity Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Instalments</TableHead>
                <TableHead className="text-right">Fixed Deposit</TableHead>
                <TableHead className="text-right">Total Interest</TableHead>
                <TableHead className="text-right font-bold text-emerald-900">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(member => {
                const totalValue = (member.totalInstalmentPaid || 0) + (member.fixedDeposit || 0) + (member.totalInterestEarned || 0);
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-right font-mono">৳{(member.totalInstalmentPaid || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">৳{(member.fixedDeposit || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">৳{(member.totalInterestEarned || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono font-bold bg-emerald-50/30">
                      ৳{totalValue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}