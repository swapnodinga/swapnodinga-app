import React from 'react';
import { useSociety } from '../context/SocietyContext';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, UserCheck, Users } from 'lucide-react';

export default function AdminMembers() { // Essential default export
  const { members, approveMember } = useSociety();
  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'active');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="h-6 w-6" /> Member Management
      </h2>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Members</TabsTrigger>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {/* PASTE THE TABSCONTENT CODE YOU SHARED EARLIER HERE */}
          <Card>
             {/* ... table with {member.full_name || member.name} ... */}
          </Card>
        </TabsContent>

        <TabsContent value="active">
          {/* Similar table for activeMembers */}
        </TabsContent>
      </Tabs>
    </div>
  );
}