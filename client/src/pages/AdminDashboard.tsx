import { useState } from "react";
import Layout from "@/components/Layout";
import { useSociety, Member } from "@/context/SocietyContext";
import { StatCard } from "@/components/StatCard";
import { TransactionTable } from "@/components/TransactionTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  PiggyBank, 
  TrendingUp, 
  Wallet, 
  UserPlus, 
  Trash2, 
  CheckCircle,
  FileDown,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const { 
    members, 
    transactions, 
    societyTotalFund, 
    approveTransaction, 
    rejectTransaction,
    addMember,
    deleteMember,
    approveMember,
    updateMemberFixedDeposit
  } = useSociety();

  const [newMemberOpen, setNewMemberOpen] = useState(false);
  const [fdDialogOpen, setFdDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [fdAmount, setFdAmount] = useState("");

  // New Member Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const pendingTransactions = transactions.filter(t => t.status === "pending");
  const recentTransactions = transactions.slice(0, 5);
  const pendingMembers = members.filter(m => m.status === "pending");

  const totalInstalments = members.reduce((sum, m) => sum + m.totalInstalmentPaid, 0);
  const totalFD = members.reduce((sum, m) => sum + m.fixedDeposit, 0);
  const totalInterest = members.reduce((sum, m) => sum + m.totalInterestEarned, 0);

  // Chart Data Preparation
  const chartData = members.map(m => ({
    name: m.name.split(' ')[0],
    Savings: m.totalInstalmentPaid + m.fixedDeposit
  })).slice(0, 10);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    addMember({
      name: newName,
      email: newEmail,
      role: "member",
      status: "active",
      monthlyInstalment: 5000, // Default
      fixedDeposit: 0,
    });
    setNewMemberOpen(false);
    setNewName("");
    setNewEmail("");
  };

  const handleUpdateFD = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberId) {
      updateMemberFixedDeposit(selectedMemberId, Number(fdAmount));
      setFdDialogOpen(false);
      setFdAmount("");
      setSelectedMemberId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage society funds, members, and approvals.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <FileDown className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Fund"
            value={`৳${societyTotalFund.toLocaleString()}`}
            icon={Wallet}
            description="Combined assets"
            className="border-l-primary"
          />
          <StatCard
            title="Total Instalments"
            value={`৳${totalInstalments.toLocaleString()}`}
            icon={PiggyBank}
            description="From all members"
            className="border-l-secondary"
          />
          <StatCard
            title="Fixed Deposits"
            value={`৳${totalFD.toLocaleString()}`}
            icon={TrendingUp}
            description="Principal amount"
            className="border-l-accent"
          />
          <StatCard
            title="Active Members"
            value={members.filter(m => m.status === 'active').length}
            icon={Users}
            description={`${pendingMembers.length} pending requests`}
            className="border-l-chart-4"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals 
              {pendingTransactions.length > 0 && (
                <span className="ml-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {pendingTransactions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Fund Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} />
                      <Tooltip 
                        formatter={(value: number) => [`৳${value.toLocaleString()}`, "Savings"]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="Savings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest financial activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionTable transactions={recentTransactions} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-serif">Member Directory</h2>
              <Dialog open={newMemberOpen} onOpenChange={setNewMemberOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" /> Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddMember} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={newName} onChange={e => setNewName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Member</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-4 font-medium">Name</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Instalments</th>
                        <th className="p-4 font-medium text-right">Fixed Deposit</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id} className="border-t hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-muted-foreground text-xs">{member.email}</div>
                            </div>
                          </td>
                          <td className="p-4">
                             {member.status === 'pending' ? (
                               <Button size="sm" variant="outline" className="h-7 text-xs border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800" onClick={() => approveMember(member.id)}>
                                 Approve Request
                               </Button>
                             ) : (
                               <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                 Active
                               </span>
                             )}
                          </td>
                          <td className="p-4 text-right font-mono">৳{member.totalInstalmentPaid.toLocaleString()}</td>
                          <td className="p-4 text-right font-mono">৳{member.fixedDeposit.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedMemberId(member.id);
                                  setFdAmount(member.fixedDeposit.toString());
                                  setFdDialogOpen(true);
                                }}
                              >
                                Update FD
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if(confirm("Are you sure you want to delete this member?")) {
                                    deleteMember(member.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* FD Update Dialog */}
            <Dialog open={fdDialogOpen} onOpenChange={setFdDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Fixed Deposit</DialogTitle>
                  <DialogDescription>Set the fixed deposit amount for the member.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateFD} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Amount (৳)</Label>
                    <Input 
                      type="number" 
                      value={fdAmount} 
                      onChange={e => setFdAmount(e.target.value)} 
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Transactions</CardTitle>
                <CardDescription>Review and approve instalment proofs submitted by members.</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionTable 
                  transactions={pendingTransactions} 
                  isAdmin 
                  onApprove={approveTransaction} 
                  onReject={rejectTransaction} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
           <TabsContent value="reports" className="space-y-4">
             <Card>
               <CardHeader>
                 <CardTitle>Financial Reports</CardTitle>
                 <CardDescription>Generate reports for society meetings.</CardDescription>
               </CardHeader>
               <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <Button variant="outline" className="h-24 flex flex-col gap-2">
                   <FileText className="w-8 h-8 text-primary" />
                   Monthly Statement
                 </Button>
                 <Button variant="outline" className="h-24 flex flex-col gap-2">
                   <FileText className="w-8 h-8 text-primary" />
                   Annual Financial Report
                 </Button>
                 <Button variant="outline" className="h-24 flex flex-col gap-2">
                   <Users className="w-8 h-8 text-primary" />
                   Member Contribution Summary
                 </Button>
               </CardContent>
             </Card>
           </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
