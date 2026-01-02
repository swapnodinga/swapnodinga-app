import React from 'react';
import { useSociety } from '../context/SocietyContext';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CheckCircle, UserPlus } from 'lucide-react';

export default function AdminMembers() {
  const { members, approveMember } = useSociety();

  /**
   * IMPROVED FILTERING LOGIC
   * We treat 'null', 'undefined', or empty status as 'pending' to ensure 
   * no registered member is hidden from the admin.
   */
  const pendingMembers = members.filter(m => {
    const status = (m.status || 'pending').toLowerCase().trim();
    return status === 'pending' || status === 'waiting' || status === 'new';
  });

  const activeMembers = members.filter(m => {
    const status = (m.status || '').toLowerCase().trim();
    return status === 'active' || status === 'approved';
  });

  const MemberTable = ({ data, showApprove = false }: { data: any[], showApprove?: boolean }) => (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold">Member ID</TableHead>
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              {showApprove && <TableHead className="font-bold text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showApprove ? 5 : 4} className="text-center py-12 text-slate-400">
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

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="pending" className="rounded-lg px-6">
            Pending Requests ({pendingMembers.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg px-6">
            Active Members ({activeMembers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <MemberTable data={pendingMembers} showApprove={true} />
        </TabsContent>

        <TabsContent value="active">
          <MemberTable data={activeMembers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}