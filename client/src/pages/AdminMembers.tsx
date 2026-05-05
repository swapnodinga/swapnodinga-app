import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CheckCircle, UserPlus, Calculator, Power, Lock, Trash2 } from 'lucide-react';

export default function AdminMembers() {
  const { members, approveMember, deactivateMember, freezeMember, deleteMember, calculateMemberSettlement } = useSociety();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [settlement, setSettlement] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pendingMembers = members.filter(m => {
    const status = (m.status || 'pending').toLowerCase().trim();
    return status === 'pending' || status === 'waiting' || status === 'new';
  });

  const activeMembers = members.filter(m => {
    const status = (m.status || '').toLowerCase().trim();
    return status === 'active' || status === 'approved';
  });

  const handleViewSettlement = async (member: any) => {
    setSelectedMember(member);
    setLoading(true);
    setSettlement(null);
    try {
      const result = await calculateMemberSettlement(member.id, []);
      console.log("Settlement result:", result);
      setSettlement(result.data || result);
    } catch (err: any) {
      console.error("Settlement error:", err);
      alert("Error: " + err.message);
      setSettlement(null);
    }
    setLoading(false);
  };

  const MemberTable = ({ data, showApprove = false, showExit = false, showActions = false }: { data: any[], showApprove?: boolean, showExit?: boolean, showActions?: boolean }) => (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold">Member ID</TableHead>
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              {(showApprove || showExit || showActions) && <TableHead className="font-bold text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showApprove || showExit || showActions ? 5 : 4} className="text-center py-12 text-slate-400">
                  <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No members found in this category.</p>
                </TableCell>
              </TableRow>
            ) : (
              data.map((member) => (
                <TableRow key={member.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-mono text-xs font-bold text-emerald-700">
                    {member.society_id || 'PENDING'}
                  </TableCell>
                  <TableCell className="font-medium">{member.full_name || member.name}</TableCell>
                  <TableCell className="text-slate-500">{member.email}</TableCell>
                  <TableCell>
                    <Badge
                      className="capitalize"
                      variant={
                        (member.status || '').toLowerCase() === 'active' ||
                        (member.status || '').toLowerCase() === 'approved'
                        ? 'default' : 'secondary'
                      }
                    >
                      {member.status || 'pending'}
                    </Badge>
                  </TableCell>
                  {showApprove && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => approveMember(member.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 h-8 gap-2"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                    </TableCell>
                  )}
                  {showExit && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewSettlement(member)}
                        className="h-8 gap-2 cursor-pointer hover:bg-blue-100 hover:border-blue-500 hover:text-blue-700 transition-all"
                      >
                        <Calculator className="h-4 w-4" /> Settlement
                      </Button>
                    </TableCell>
                  )}
                  {showActions && (
                    <TableCell className="text-right space-x-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deactivateMember(member.id)}
                        className="h-8 gap-2 hover:bg-red-100 hover:border-red-500 hover:text-red-700 transition-all"
                        title="Deactivate member"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => freezeMember(member.id)}
                        className="h-8 gap-2 hover:bg-yellow-100 hover:border-yellow-500 hover:text-yellow-700 transition-all"
                        title="Freeze member"
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMember(member.id)}
                        className="h-8 gap-2 hover:bg-red-100 hover:border-red-500 hover:text-red-700 transition-all"
                        title="Delete member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Users className="h-7 w-7 text-emerald-600" />
          Member Management
        </h2>
        <p className="text-slate-500 text-sm">Approve new applications and manage existing society members.</p>
      </div>

      {selectedMember && settlement ? (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{selectedMember.full_name}</h3>
                <p className="text-slate-600">{selectedMember.society_id}</p>
              </div>
              <Button variant="outline" onClick={() => { setSelectedMember(null); setSettlement(null); }}>
                Close
              </Button>
            </div>

            <div className="bg-white p-4 rounded space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Installments:</span>
                <span className="font-mono">৳{settlement.total_installments?.toFixed(2) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Calculated Interest:</span>
                <span className="font-mono">৳{settlement.calculated_interest?.toFixed(2) || 0}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Net Transfer Amount:</span>
                <span className="font-mono text-emerald-600">৳{settlement.net_transfer_amount?.toFixed(2) || 0}</span>
              </div>
            </div>

            {settlement.fixed_deposits && settlement.fixed_deposits.length > 0 && (
              <div className="bg-white p-4 rounded">
                <p className="font-bold text-sm mb-2">Fixed Deposits:</p>
                <div className="space-y-2 text-sm">
                  {settlement.fixed_deposits.map((fd: any, i: number) => (
                    <div key={i} className="text-slate-700">
                      ৳{fd.amount} @ {fd.interest_rate}% for {fd.tenure_months} months ({fd.status})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
            <TabsTrigger value="pending" className="rounded-lg px-6">
              Pending Requests ({pendingMembers.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg px-6">
              Active Members ({activeMembers.length})
            </TabsTrigger>
            <TabsTrigger value="settlement" className="rounded-lg px-6">
              Member Settlement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <MemberTable data={pendingMembers} showApprove={true} />
          </TabsContent>

          <TabsContent value="active">
            <MemberTable data={activeMembers} showActions={true} />
          </TabsContent>

          <TabsContent value="settlement">
            <MemberTable data={activeMembers} showExit={true} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}