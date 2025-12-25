import { useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Banknote, Calculator, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function FixedDepositPage() {
  const { members, updateMemberFixedDeposit } = useSociety();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.society_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-emerald-900">Fixed Deposit Management</h1>
        <p className="text-muted-foreground">Manage long-term capital and interest allocations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calculator Tool */}
        <Card className="md:col-span-1 border-amber-100 shadow-sm bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2 text-lg">
              <Calculator size={20} />
              Returns Estimator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Principal Amount (৳)</Label>
              <Input type="number" placeholder="50,000" className="border-amber-200" />
            </div>
            <div className="space-y-2">
              <Label>Annual Interest (%)</Label>
              <Input type="number" placeholder="8" className="border-amber-200" />
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700">Calculate</Button>
          </CardContent>
        </Card>

        {/* Member FD List */}
        <Card className="md:col-span-2 border-emerald-100 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
            <CardTitle className="text-emerald-900">Member Holdings</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search member..." 
                className="pl-9 h-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-900 text-left border-b">
                    <th className="p-4 font-bold">Member</th>
                    <th className="p-4 font-bold">FD Amount</th>
                    <th className="p-4 font-bold">Interest Earned</th>
                    <th className="p-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-emerald-50/20">
                      <td className="p-4">
                        <p className="font-bold text-emerald-950">{member.name}</p>
                        <p className="text-[10px] font-mono text-slate-500">{member.society_id}</p>
                      </td>
                      <td className="p-4 font-medium text-emerald-700">
                        ৳{member.fixedDeposit?.toLocaleString() || 0}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                          ৳{member.totalInterestEarned?.toLocaleString() || 0}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-emerald-600 hover:bg-emerald-100"
                            onClick={() => {/* Trigger Edit Dialog */}}
                          >
                            Update FD
                          </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}