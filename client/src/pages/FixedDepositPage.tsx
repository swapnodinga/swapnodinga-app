import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, History, PlusCircle, TrendingUp, Banknote, CheckCircle2, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FixedDepositPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    amount: "",
    month: "January",
    year: "2025",
    interest_rate: "9.75",
    tenure_months: "36"
  });

  const monthsList = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchDeposits = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('fixed_deposits')
      .select('*')
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (!error) setDeposits(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchDeposits(); }, []);

  // Helper to determine if a deposit has finished based on tenure and current date
  const checkIsFinished = (startMonth: string, startYear: string, tenureMonths: number) => {
    const monthIndex = monthsList.indexOf(startMonth);
    const startDate = new Date(Number(startYear), monthIndex, 1);
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(startDate.getMonth() + tenureMonths);
    
    // Compare maturity date to current date (Jan 2026)
    return maturityDate <= new Date();
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('fixed_deposits')
      .insert([{
        member_id: 1, 
        society_id: "ADMIN-TREASURY", 
        amount: Number(formData.amount),
        month: formData.month,
        year: formData.year,
        interest_rate: Number(formData.interest_rate),
        tenure_months: Number(formData.tenure_months)
      }]);

    if (!error) {
      setFormData({ ...formData, amount: "" });
      fetchDeposits();
    } else {
      alert("Error: " + error.message);
    }
  };

  // Logic for Emerald Cards: Interest only added if tenure is finished
  const totals = useMemo(() => {
    return deposits.reduce((acc, d) => {
      const principal = Number(d.amount || 0);
      const tenure = Number(d.tenure_months || 0);
      const rate = Number(d.interest_rate || 0);
      const isFinished = checkIsFinished(d.month, d.year, tenure);
      
      const interest = principal * (rate / 100) * (tenure / 12);

      return {
        principal: acc.principal + principal,
        realizedInterest: acc.realizedInterest + (isFinished ? interest : 0),
      };
    }, { principal: 0, realizedInterest: 0 });
  }, [deposits]);

  const totalMaturity = totals.principal + totals.realizedInterest;

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-serif font-bold text-emerald-900">Society Treasury Ledger</h1>

      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Treasury Principal", val: totals.principal, icon: Wallet },
          { label: "Total Interest From Fixed Deposit", val: totals.realizedInterest, icon: TrendingUp },
          { label: "Total Maturity Value", val: totalMaturity, icon: Banknote }
        ].map((card, i) => (
          <Card key={i} className="bg-[#064e3b] text-white shadow-xl border-none rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-bold flex items-center gap-2 opacity-70 uppercase tracking-widest">
                <card.icon size={14} /> {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">৳{Math.round(card.val).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* NEW ENTRY FORM */}
        <Card className="lg:col-span-1 border-emerald-100 shadow-sm rounded-xl">
          <CardHeader className="border-b bg-slate-50/30">
            <CardTitle className="text-lg text-emerald-900 flex items-center gap-2 font-bold">
              <PlusCircle size={18} className="text-emerald-600" /> New Bank Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Month</Label>
                  <Select value={formData.month} onValueChange={(v) => setFormData({...formData, month: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {monthsList.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Input value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Principal Amount (৳)</Label>
                <Input type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Interest Rate (%)</Label>
                  <Input type="number" step="0.01" value={formData.interest_rate} onChange={(e) => setFormData({...formData, interest_rate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tenure (Months)</Label>
                  <Input type="number" required value={formData.tenure_months} onChange={(e) => setFormData({...formData, tenure_months: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-12 rounded-lg mt-2">Save Deposit</Button>
            </form>
          </CardContent>
        </Card>

        {/* DEPOSIT HISTORY TABLE */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg text-slate-700 flex items-center gap-2 font-bold">
              <History size={18} className="text-slate-400" /> Deposit History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left border-b text-slate-500 uppercase text-[10px] tracking-widest font-bold">
                  <th className="p-4">Date / Status</th>
                  <th className="p-4 text-center">Principal</th>
                  <th className="p-4 text-center">Interest %</th>
                  <th className="p-4 text-center">Tenure</th>
                  <th className="p-4 text-right">Maturity Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deposits.map((d) => {
                  const principal = Number(d.amount);
                  const tenure = Number(d.tenure_months);
                  const rate = Number(d.interest_rate);
                  const interest = principal * (rate / 100) * (tenure / 12);
                  const isFinished = checkIsFinished(d.month, d.year, tenure);
                  
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{d.month} {d.year}</div>
                        <Badge 
                          variant="outline" 
                          className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isFinished 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {isFinished ? <CheckCircle2 size={10} className="mr-1" /> : <Clock size={10} className="mr-1" />}
                          {isFinished ? "FINISHED" : "ACTIVE"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center text-emerald-700 font-bold">৳{principal.toLocaleString()}</td>
                      <td className="p-4 text-center font-bold text-blue-600">{rate}%</td>
                      <td className="p-4 text-center text-slate-900 font-bold">{tenure} months</td>
                      <td className="p-4 text-right">
                        <Badge variant="outline" className={`${isFinished ? "bg-emerald-900 text-white" : "bg-blue-50 text-blue-700 border-blue-100"} font-bold py-1 px-3`}>
                          ৳{Math.round(principal + interest).toLocaleString()}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}