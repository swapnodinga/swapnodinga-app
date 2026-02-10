import React, { useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { TransactionTable } from "@/components/TransactionTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Landmark, Clock, ShieldCheck } from "lucide-react";

export default function AdminPayments() {
  // Extracting transactions and the updated approval function [cite: 2025-12-31]
  const { transactions, approveInstalment } = useSociety();
  const [query, setQuery] = useState("");

  // Filtering based on member name or Society ID
  const filtered = transactions.filter(tx => 
    (tx.memberName || "").toLowerCase().includes(query.toLowerCase()) ||
    (tx.society_id || "").toLowerCase().includes(query.toLowerCase())
  );

  const collectedTotal = transactions
    .filter(t => t.status?.toLowerCase() === "approved")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const pendingTotal = transactions
    .filter(t => t.status?.toLowerCase() === "pending")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  /**
   * CRITICAL ACTION HANDLER
   * This calls the context function which updates the DB, sends the Gmail,
   * and deletes the proof from the 'payments' bucket.
   */
  const handleAction = async (transaction: any, status: 'Approved' | 'Rejected') => {
    try {
      // Pass full transaction to access proofPath and member details [cite: 2025-12-31]
      await approveInstalment(transaction, status); 
    } catch (error) {
      console.error("Verification process failed:", error);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="text-emerald-600" size={20} />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Admin Control</span>
          </div>
          <h1 className="text-3xl font-bold text-emerald-950">Payment Verification</h1>
          <p className="text-slate-500 text-sm">Audit receipts and validate incoming member contributions.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <StatCard icon={<Landmark className="text-emerald-600"/>} label="Collected" value={collectedTotal} color="bg-emerald-50" />
          <StatCard icon={<Clock className="text-orange-600"/>} label="Pending" value={pendingTotal} color="bg-orange-50" />
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
        <Input 
          placeholder="Search by member name or ID (e.g. SCS-002)..." 
          className="pl-12 h-14 text-lg border-slate-200 shadow-sm focus-visible:ring-emerald-500 transition-all"
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction Queue</span>
          </div>
          <span className="text-[10px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-400 font-medium">
            Showing {filtered.length} results
          </span>
        </div>

        {/* TransactionTable now triggers the email/cleanup workflow via handleAction [cite: 2025-12-31] */}
        <TransactionTable 
          transactions={filtered} 
          isAdmin={true} 
          onApprove={(tx: any) => handleAction(tx, 'Approved')}
          onReject={(tx: any) => handleAction(tx, 'Rejected')}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <Card className={`${color} border-none min-w-[180px] w-auto shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="bg-white p-2.5 rounded-xl shadow-sm flex-shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{label}</p>
          <p className="text-lg md:text-xl font-bold text-slate-800 break-words">৳{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}