import React from "react";
import { useSociety } from "@/context/SocietyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react"; // Professional print icon
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function AdminReports() {
  const { members, transactions } = useSociety();

  // Calculations
  const totalCollected = transactions
    .filter((t) => t.status === "approved")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPayments = transactions
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFixedDeposit = members.reduce((sum, m) => sum + m.fixedDeposit, 0);

  const chartData = [
    { name: "Collected", value: totalCollected },
    { name: "Pending", value: pendingPayments },
    { name: "Fixed Deposits", value: totalFixedDeposit },
  ];

  const COLORS = ["#10b981", "#f59e0b", "#3b82f6"];

  return (
    <div className="space-y-6 print:p-0">
      {/* HEADER WITH PRINT BUTTON */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-3xl font-bold text-gray-800 font-serif">Financial Reports</h2>
        <Button 
          onClick={() => window.print()} 
          className="bg-primary hover:bg-primary/90 text-white flex gap-2"
        >
          <Printer className="w-4 h-4" />
          Download PDF / Print
        </Button>
      </div>

      {/* PRINT-ONLY TITLE (Shows only on the PDF) */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-3xl font-bold">Swapnodinga Society Report</h1>
        <p className="text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">Total Collected</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-700">৳ {totalCollected.toLocaleString()}</p></CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600">Pending Approval</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-700">৳ {pendingPayments.toLocaleString()}</p></CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-600">Total Fixed Deposits</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-700">৳ {totalFixedDeposit.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* CHART SECTION - Hidden during printing to save ink/layout */}
        <Card className="print:hidden">
          <CardHeader><CardTitle>Fund Distribution</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="print:col-span-2">
          <CardHeader><CardTitle>Member Contribution Summary</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead className="text-right">F.D. Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-right">৳ {m.fixedDeposit.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}