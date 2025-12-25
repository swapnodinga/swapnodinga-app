import { useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { StatCard } from "@/components/StatCard";
import { TransactionTable } from "@/components/TransactionTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, PiggyBank, TrendingUp, Wallet, FileDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const { 
    members = [], 
    transactions = [], 
    societyTotalFund = 0, 
    approveTransaction, 
    rejectTransaction, 
    updateMemberFixedDeposit 
  } = useSociety();

  const [fdDialogOpen, setFdDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [fdAmount, setFdAmount] = useState("");

  const pendingTransactions = transactions.filter(t => t.status === "pending");
  const recentTransactions = transactions.slice(0, 5);

  const totalInstalments = members.reduce((sum, m) => sum + (m.totalInstalmentPaid || 0), 0);
  const totalFD = members.reduce((sum, m) => sum + (m.fixedDeposit || 0), 0);
  const totalInterest = members.reduce((sum, m) => sum + (m.totalInterestEarned || 0), 0);

  const chartData = [
    { name: 'Instalments', value: totalInstalments },
    { name: 'Fixed Deposits', value: totalFD },
    { name: 'Interest', value: totalInterest }
  ];

  const handleUpdateFD = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberId && updateMemberFixedDeposit) {
      updateMemberFixedDeposit(selectedMemberId, Number(fdAmount));
      setFdDialogOpen(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-900">Admin Dashboard</h1>
          <p className="text-muted-foreground italic text-sm">Supabase Real-time Cloud Data</p>
        </div>
        <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          <FileDown className="w-4 h-4" /> Export Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="TOTAL FUND" 
          value={`৳${(societyTotalFund ?? 0).toLocaleString()}`} 
          icon={Wallet} 
          className="border-l-4 border-l-emerald-600 shadow-sm" 
        />
        <StatCard 
          title="TOTAL INSTALMENTS" 
          value={`৳${(totalInstalments ?? 0).toLocaleString()}`} 
          icon={PiggyBank} 
          className="border-l-4 border-l-amber-500 shadow-sm" 
        />
        <StatCard 
          title="FIXED DEPOSITS" 
          value={`৳${(totalFD ?? 0).toLocaleString()}`} 
          icon={TrendingUp} 
          className="border-l-4 border-l-blue-500 shadow-sm" 
        />
        <StatCard 
          title="ACTIVE MEMBERS" 
          value={(members?.filter(m => m.status === 'active').length ?? 0).toString()} 
          icon={Users} 
          className="border-l-4 border-l-slate-400 shadow-sm" 
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-emerald-100/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals {pendingTransactions.length > 0 && (
              <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingTransactions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="grid lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2 border-emerald-100 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b mb-4">
              <CardTitle className="text-emerald-900 text-lg">Revenue Mix</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `৳${v/1000}K`} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#166534" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3 border-emerald-100 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b mb-4">
              <CardTitle className="text-emerald-900 text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={recentTransactions} />
            </CardContent>
          </Card>
        </TabsContent>
        {/* Members/Approvals Tab content follows similar structure */}
      </Tabs>
    </div>
  );
}