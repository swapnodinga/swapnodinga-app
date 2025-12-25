import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/context/SocietyContext";
import { Check, X, Eye } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  isAdmin?: boolean;
  onApprove?: (id: string, email: string, name: string) => void;
  onReject?: (id: string, email: string, name: string) => void;
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
            <TableRow>
              <TableCell colSpan={isAdmin ? 6 : 4} className="text-center h-24 text-muted-foreground italic">
                No transaction records found in database.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-primary/5 transition-colors">
                <TableCell>
                  {/* Displays the month selected in the PaymentModal */}
                  <div className="font-medium text-primary">{(tx as any).month || "Instalment"}</div>
                  <div className="text-[10px] text-muted-foreground">{tx.date}</div>
                </TableCell>
                
                {isAdmin && (
                  <TableCell>
                    <div className="text-sm font-medium">{tx.memberName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{tx.memberId}</div>
                  </TableCell>
                )}

                <TableCell className="font-mono font-bold text-slate-700">
                  ৳{tx.amount?.toLocaleString()}
                </TableCell>

                <TableCell className="text-center">
                  <Badge
                    variant={
                      tx.status === "approved" || tx.status === "Paid"
                        ? "default"
                        : tx.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className={
                      tx.status === "approved" || tx.status === "Paid"
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                        : tx.status === "pending"
                        ? "bg-orange-100 text-orange-700 border-orange-200"
                        : ""
                    }
                  >
                    {tx.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-center">
                  {tx.proofUrl ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild 
                      className="h-7 text-primary hover:bg-primary/10 text-xs gap-1"
                    >
                      <a href={tx.proofUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-3.5 h-3.5" /> View
                      </a>
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No Proof</span>
                  )}
                </TableCell>

                {isAdmin && (
                  <TableCell className="text-right">
                    {tx.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          title="Approve & Send Email"
                          className="h-8 w-8 p-0 border-green-200 text-green-600 hover:text-white hover:bg-green-600 transition-all"
                          onClick={() => onApprove?.(tx.id, (tx as any).email || "", tx.memberName)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Reject & Send Email"
                          className="h-8 w-8 p-0 border-red-200 text-red-600 hover:text-white hover:bg-red-600 transition-all"
                          onClick={() => onReject?.(tx.id, (tx as any).email || "", tx.memberName)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
