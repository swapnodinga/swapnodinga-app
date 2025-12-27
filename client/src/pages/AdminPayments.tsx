import React, { useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { TransactionTable } from "@/components/TransactionTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FilterX, Landmark, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminPayments() {
  // Updated to use the correct function name from your SocietyContext
  const { transactions, approveInstalment } = useSociety();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");

  // Get unique months for the dropdown and sort them
  const uniqueMonths = Array.from(new Set(transactions.map(t => t.month)))
    .filter(Boolean)
    .sort();

  // Filter Logic matching your database column names
  const filteredTransactions = transactions.filter((tx) => {
    // memberName and member_id match your Supabase schema
    const nameMatch = tx.memberName?.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = tx.member_id?.toString().includes(searchTerm);
    
    const matchesSearch = nameMatch || idMatch;
    const matchesMonth = monthFilter === "all" || tx.month === monthFilter;
    
    return matchesSearch && matchesMonth;
  });

  // Calculate Summary based on database 'status' values
  const totalCollected = filteredTransactions
    .filter(t => t.status?.toLowerCase() === "approved")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalPending = filteredTransactions
    .filter(t => t.status?.toLowerCase() === "pending")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-900">Payment Verification</h1>
          <p className="text-muted-foreground mt-1">Audit and validate incoming member contributions.</p>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex gap-4 w-full md:w-auto">
          <Card className="flex-1 md:w-40 border-emerald-100 shadow-sm bg-emerald-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                <Landmark size={20} />
              </div>
              <div>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Collected</p>
                <p className="text-lg font-bold text-emerald-900">৳{totalCollected.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="flex-1 md:w-40 border-amber-100 shadow-sm bg-amber-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Pending</p>
                <p className="text-lg font-bold text-amber-900">৳{totalPending.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600/50" />
          <Input
            placeholder="Search by name or member ID..."
            className="pl-10 border-emerald-100 focus-visible:ring-emerald-500 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[180px] border-emerald-100 h-11">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contribution Months</SelectItem>
              {uniqueMonths.map((m) => (
                <SelectItem key={m} value={m!}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || monthFilter !== "all") && (
            <Button 
              variant="ghost" 
              className="text-emerald-700 hover:bg-emerald-50 h-11 px-4"
              onClick={() => {setSearchTerm(""); setMonthFilter("all");}}
            >
              <FilterX className="w-4 h-4 mr-2" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <h2 className="text-sm font-semibold text-emerald-900">Transaction Queue</h2>
          <span className="text-[10px] bg-white border px-2 py-1 rounded text-slate-500">
            Showing {filteredTransactions.length} results
          </span>
        </div>
        {/* Passed approveInstalment as the onApprove prop */}
        <TransactionTable 
          transactions={filteredTransactions} 
          isAdmin={true} 
          onApprove={approveInstalment}
        />
      </div>
    </div>
  );
}