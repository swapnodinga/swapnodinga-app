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
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function TransactionTable({ transactions, isAdmin, onApprove, onReject }: TransactionTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {isAdmin && <TableHead>Member</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Proof</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 7 : 5} className="text-center h-24 text-muted-foreground">
                No transactions found.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">{tx.date}</TableCell>
                {isAdmin && <TableCell>{tx.memberName}</TableCell>}
                <TableCell className="capitalize">{tx.type}</TableCell>
                <TableCell className="font-mono">৳{tx.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tx.status === "approved"
                        ? "default"
                        : tx.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className={
                        tx.status === "approved"
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }
                  >
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {tx.proofUrl && (
                    <a href={tx.proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline text-xs">
                       <Eye className="w-3 h-3 mr-1" /> View
                    </a>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    {tx.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => onApprove?.(tx.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onReject?.(tx.id)}
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
