import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, Users, ArrowUpRight, Landmark, RefreshCcw, CheckCircle2 } from "lucide-react";

export default function InterestDistribution() {
  // Constants from your current ledger state
  const [interestAmount, setInterestAmount] = useState("151125"); 
  const [totalPrincipal, setTotalPrincipal] = useState(5600000); 
  const [investments, setInvestments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDistributing, setIsDistributing] = useState(false);

  // Fetch members and their treasury totals
  const fetchInvestments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('member_investments')
        .select('*')
        .order('investment_amount', { ascending: false });
      
      if (error) throw error;
      setInvestments(data || []);
    } catch (err) {
      console.error("Error fetching investments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  // NEW: Function to distribute profit to the SQL table you just created
  const distributeProfit = async () => {
    if (investments.length === 0) return;
    
    setIsDistributing(true);
    try {
      // 1. Prepare records based on proportional equity
      const profitRecords = investments.map(item => {
        const equityRatio = item.investment_amount / totalPrincipal;
        const share = equityRatio * Number(interestAmount);
        
        return {
          member_id: item.member_id,
          amount_earned: Math.floor(share),
          description: `Interest Distribution - Total Pool: ৳${interestAmount} (Principal: ৳${totalPrincipal})`
        };
      });

      // 2. Insert into the member_profit_records table
      const { error } = await supabase
        .from('member_profit_records')
        .insert(profitRecords);

      if (error) throw error;

      alert("Success! Profit has been distributed to all members.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-900 tracking-tight">
            Interest & Profit Distribution
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Landmark size={14} /> Society Treasury Base: <span className="font-bold text-emerald-700 font-mono">৳{totalPrincipal.toLocaleString()}</span>
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchInvestments} 
          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg"
        >
          <RefreshCcw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* INPUT PANEL */}
        <Card className="lg:col-span-1 border-emerald-100 shadow-xl h-fit overflow-hidden rounded-2xl">
          <CardHeader className="bg-emerald-900 text-white">
            <CardTitle className="text-[11px] uppercase tracking-widest flex items-center gap-2">
              <Calculator size={14} /> Distribution Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Profit to Distribute (৳)
              </label>
              <Input 
                type="number" 
                value={interestAmount} 
                onChange={(e) => setInterestAmount(e.target.value)}
                className="text-2xl font-black text-emerald-800 border-emerald-200 h-14 rounded-xl"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Calculation Logic</p>
              Dividing ৳{Number(interestAmount).toLocaleString()} across members proportional to their investment.
            </div>

            <Button 
            onClick={distributeProfit}
            disabled={isDistributing || investments.length === 0}
            // Change text-lg to text-base and adjust padding/gap
            className="w-full bg-emerald-700 hover:bg-emerald-800 font-bold h-14 text-base shadow-emerald-200 shadow-lg rounded-xl flex items-center justify-center gap-1 px-2"
            >
            {isDistributing ? <RefreshCcw className="animate-spin" /> : <CheckCircle2 size={18} />}
            <span className="truncate">
                {isDistributing ? "Processing..." : "Confirm & Distribute"}
            </span>
            </Button>
          </CardContent>
        </Card>

        {/* BREAKDOWN TABLE */}
        <Card className="lg:col-span-3 border-slate-200 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-slate-50/80 border-b flex flex-row items-center justify-between px-6">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-600 font-bold">
              <Users size={16} className="text-emerald-600" /> Proportional Calculation
            </CardTitle>
            <Badge variant="outline" className="bg-white text-[10px] font-bold py-1">
              {investments.length} Active Records
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest p-6">Member Information</TableHead>
                    <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest">Share Value</TableHead>
                    <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest">Equity %</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest p-6">Calculated Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((item) => {
                    const equity = (item.investment_amount / totalPrincipal) * 100;
                    const share = (item.investment_amount / totalPrincipal) * Number(interestAmount);
                    
                    return (
                      <TableRow key={item.id} className="hover:bg-emerald-50/30 transition-colors border-b">
                        <TableCell className="p-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-base">{item.member_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">INVESTOR ID: {item.member_id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-slate-700 italic">
                            ৳{Number(item.investment_amount).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-600 hover:bg-blue-700 px-3 py-1 font-bold rounded-md">
                            {equity.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right p-6">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-2xl font-black text-emerald-700">
                              ৳{Math.floor(share).toLocaleString()}
                            </span>
                            <ArrowUpRight size={18} className="text-emerald-400" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}