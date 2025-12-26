import React from 'react';
import { useSociety } from '../context/SocietyContext';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CheckCircle } from 'lucide-react';

export default function AdminMembers() {
  const { members, approveMember } = useSociety();

  // Filter based on the 'status' column from Supabase
  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'active');

  const MemberTable = ({ data, showApprove = false }: { data: any[], showApprove?: boolean }) => (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              {showApprove && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showApprove ? 5 : 4} className="text-center py-8 text-muted-foreground">
                  No members found in this category.
                </TableCell>
              </TableRow>
            ) : (
              data.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.society_id}</TableCell>
                  {/* Fixed: Use full_name to match database */}
                  <TableCell>{member.full_name || member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  {showApprove && (
                    <TableCell>
                      <Button 
                        size="sm" 
                        onClick={() => approveMember(member.id)}
                        className="flex items-center gap-1"
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="h-6 w-6" /> Member Management
      </h2>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Members ({activeMembers.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Requests ({pendingMembers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <MemberTable data={activeMembers} />
        </TabsContent>

        <TabsContent value="pending">
          <MemberTable data={pendingMembers} showApprove={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}