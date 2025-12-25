import { useSociety } from "@/context/SocietyContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserCheck, Search, FileText, UserPlus, ShieldCheck, History } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function AdminMembers() {
  const { members, transactions, approveMember, deleteMember } = useSociety();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingMembers = filteredMembers.filter(m => m.status !== 'active');
  const activeMembers = filteredMembers.filter(m => m.status === 'active');

  // Helper to get specific transactions for a member
  const getMemberHistory = (memberId: string) => {
    return transactions.filter(t => t.memberId === memberId);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-900">Manage Members</h1>
          <p className="text-muted-foreground text-sm">Review registrations and monitor financial history.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            className="pl-8 border-emerald-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-emerald-50 text-emerald-900">
          <TabsTrigger value="all">Active ({activeMembers.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingMembers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="text-emerald-600 h-5 w-5" />
                Member Directory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Total Interest</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeMembers.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-semibold text-emerald-900">{member.name}</div>
                        <div className="text-[10px] text-muted-foreground">ID: {member.id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell className="text-sm">{member.email}</TableCell>
                      <TableCell className="font-mono text-emerald-600 font-bold">
                        ৳{member.totalInterestEarned?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {/* VIEW DETAILS MODAL */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              <History size={16} className="mr-1"/> History
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <FileText className="text-emerald-700" />
                                {member.name}'s Financial Statement
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-emerald-50 rounded-lg">
                                  <p className="text-xs text-emerald-600 uppercase font-bold">Fixed Deposit</p>
                                  <p className="text-xl font-bold font-mono">৳{member.fixedDeposit?.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                  <p className="text-xs text-blue-600 uppercase font-bold">Total Interest</p>
                                  <p className="text-xl font-bold font-mono">৳{member.totalInterestEarned?.toLocaleString()}</p>
                                </div>
                              </div>
                              <h4 className="font-bold text-sm border-b pb-1">Payment History</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Month</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {getMemberHistory(member.id).map(tx => (
                                    <TableRow key={tx.id}>
                                      <TableCell className="text-xs">{tx.date}</TableCell>
                                      <TableCell className="text-xs">{tx.month}</TableCell>
                                      <TableCell className="font-mono font-bold">৳{tx.amount}</TableCell>
                                      <TableCell>
                                        <Badge className={tx.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}>
                                          {tx.status}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => { if(confirm("Delete this member?")) deleteMember(member.id) }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          {/* ... Keep your existing pending logic ... */}
        </TabsContent>
      </Tabs>
    </div>
  );
}