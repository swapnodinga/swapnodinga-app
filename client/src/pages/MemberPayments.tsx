import React from "react";
import { useSociety } from "@/context/SocietyContext";
// FIXED: Import Cards from /ui/card, not /ui/button
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function MemberPayments() {
  const { currentUser, transactions } = useSociety();

  // Filter transactions to show only this member's installments
  const myPayments = transactions.filter(t => t.member_id === currentUser?.id); 

  // Calculate total savings from approved payments only
  const totalSavings = myPayments
    .filter(p => p.status === 'Approved' || p.status === 'active')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Contribution History</h1>
          <p className="text-slate-500">Track your monthly instalments and approval status.</p>
        </div>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Savings</p>
            <p className="text-2xl font-bold text-emerald-900">৳{totalSavings.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    No payment records found. Your contributions will appear here once verified.
                  </TableCell>
                </TableRow>
              ) : (
                myPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.month}</TableCell>
                    <TableCell>৳{payment.amount}</TableCell>
                    <TableCell>{new Date(payment.submitted_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={payment.status === 'Approved' ? 'default' : 'secondary'}
                        className={payment.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                      >
                        {payment.status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.payment_proof_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={payment.payment_proof_url} target="_blank" rel="noreferrer" className="text-emerald-600">
                            View Proof
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}