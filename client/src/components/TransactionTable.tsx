import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye } from "lucide-react";

interface TransactionTableProps {
  transactions: any[];
  isAdmin?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export function TransactionTable({ transactions, isAdmin, onApprove, onReject }: TransactionTableProps) {
  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-primary/5">
          <TableRow>
            <TableHead className="text-primary font-bold">Month/Date</TableHead>
            {isAdmin && <TableHead className="text-primary font-bold">Member</TableHead>}
            <TableHead className="text-primary font-bold">Amount</TableHead>
            <TableHead className="text-primary font-bold text-center">Status</TableHead>
            <TableHead className="text-primary font-bold text-center">Proof</TableHead>
            {isAdmin && <TableHead className="text-right text-primary font-bold">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow><TableCell colSpan={isAdmin ? 6 : 4} className="text-center h-24 text-muted-foreground italic">No transaction records found.</TableCell></TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-primary/5 transition-colors">
                <TableCell>
                  <div className="font-medium text-primary">{tx.month || "Instalment"}</div>
                  {tx.created_at && <div className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</div>}
                </TableCell>
                
                {isAdmin && (
                  <TableCell>
                    <div className="text-sm font-medium">{tx.memberName || "Unknown Member"}</div>
                    {/* FIXED: Priority display of society_id (e.g., SCS-002) */}
                    <div className="text-[10px] text-blue-600 font-bold font-mono uppercase">
                      {tx.society_id || `ID: ${tx.member_id}`}
                    </div>
                  </TableCell>
                )}

                <TableCell>
                  <div className="font-mono font-bold text-slate-700">৳{Number(tx.amount || 0).toLocaleString()}</div>
                  {tx.late_fee > 0 && <div className="text-[9px] text-red-500 font-semibold italic">Includes ৳{tx.late_fee} Late Fee</div>}
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant={tx.status?.toLowerCase() === "approved" ? "default" : tx.status?.toLowerCase() === "rejected" ? "destructive" : "secondary"}
                    className={tx.status?.toLowerCase() === "approved" ? "bg-green-600 text-white" : tx.status?.toLowerCase() === "pending" ? "bg-orange-100 text-orange-700" : ""}>
                    {tx.status || "Pending"}
                  </Badge>
                </TableCell>

                <TableCell className="text-center">
                  {/* FIXED: Now using 'payment_proof_url' */}
                  {tx.payment_proof_url ? (
                    <Button variant="ghost" size="sm" asChild className="h-7 text-primary gap-1">
                      <a href={tx.payment_proof_url} target="_blank" rel="noopener noreferrer"><Eye className="w-3.5 h-3.5" /> View</a>
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">No Proof</span>
                  )}
                </TableCell>

                {isAdmin && (
                  <TableCell className="text-right">
                    {tx.status?.toLowerCase() === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600" onClick={() => onApprove?.(tx.id)}><Check className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600" onClick={() => onReject?.(tx.id)}><X className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}