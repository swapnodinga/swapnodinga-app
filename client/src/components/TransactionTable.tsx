import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye } from "lucide-react";

export function TransactionTable({ transactions, isAdmin, onApprove, onReject }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50/50 hover:bg-transparent">
          <TableHead className="w-1/4 font-bold">Month/Date</TableHead>
          {isAdmin && <TableHead className="font-bold">Member</TableHead>}
          <TableHead className="font-bold">Amount</TableHead>
          <TableHead className="text-center font-bold">Status</TableHead>
          <TableHead className="text-center font-bold">Proof</TableHead>
          {isAdmin && <TableHead className="text-right font-bold">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx: any) => (
          <TableRow key={tx.id} className="group">
            <TableCell>
              <div className="font-semibold text-slate-700">{tx.month}</div>
              <div className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</div>
            </TableCell>
            {isAdmin && (
              <TableCell>
                <div className="font-bold text-slate-800">{tx.memberName}</div>
                <div className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">{tx.society_id}</div>
              </TableCell>
            )}
            <TableCell className="font-black text-slate-700">৳{Number(tx.amount).toLocaleString()}</TableCell>
            <TableCell className="text-center">
              <Badge className={
                tx.status === "Approved" ? "bg-emerald-500" : 
                tx.status === "Pending" ? "bg-orange-100 text-orange-700 shadow-none" : "bg-red-500"
              }>
                {tx.status}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              {/* If proof exists, show view button so admin can verify before approving [cite: 2025-12-31] */}
              {tx.payment_proof_url ? (
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" asChild>
                  <a href={tx.payment_proof_url} target="_blank" rel="noreferrer">
                    <Eye size={14}/> <span className="underline text-xs font-bold">View Proof</span>
                  </a>
                </Button>
              ) : (
                <span className="text-[10px] italic text-slate-300">File Deleted</span>
              )}
            </TableCell>
            {isAdmin && (
              <TableCell className="text-right">
                {tx.status === "Pending" && (
                  <div className="flex justify-end gap-2">
                    {/* CRITICAL: Passing full 'tx' object to context [cite: 2025-12-31] */}
                    <Button 
                      size="sm" 
                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white h-8 w-8 p-0 transition-colors" 
                      onClick={() => onApprove(tx)}
                    >
                      <Check size={16}/>
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-red-100 text-red-700 hover:bg-red-600 hover:text-white h-8 w-8 p-0 transition-colors" 
                      onClick={() => onReject(tx)}
                    >
                      <X size={16}/>
                    </Button>
                  </div>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}