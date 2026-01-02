import React, { useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { TransactionTable } from "@/components/TransactionTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Landmark, Clock } from "lucide-react";

export default function AdminPayments() {
  const { transactions, approveInstalment } = useSociety();
  const [query, setQuery] = useState("");

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

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Payment Verification</h1>
          <p className="text-slate-500 text-sm">Audit and validate incoming member contributions.</p>
        </div>
        <div className="flex gap-4">
          <StatCard icon={<Landmark className="text-emerald-600"/>} label="Collected" value={collectedTotal} color="bg-emerald-50" />
          <StatCard icon={<Clock className="text-orange-600"/>} label="Pending" value={pendingTotal} color="bg-orange-50" />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-4 text-slate-400" size={20} />
        <Input 
          placeholder="Search by name or member ID (e.g. SCS-002)..." 
          className="pl-12 h-14 text-lg border-slate-200 shadow-sm"
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Transaction Queue</span>
          <span className="text-[10px] bg-white px-2 py-1 rounded border text-slate-400">Showing {filtered.length} results</span>
        </div>
        <TransactionTable 
          transactions={filtered} 
          isAdmin={true} 
          onApprove={(id: any) => approveInstalment(id, 'Approved')}
          onReject={(id: any) => approveInstalment(id, 'Rejected')}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <Card className={`${color} border-none w-44`}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="bg-white p-2 rounded-lg shadow-sm">{icon}</div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
          <p className="text-xl font-bold text-slate-800">৳{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}