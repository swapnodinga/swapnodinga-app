"use client"
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, History, PlusCircle, TrendingUp, Banknote, CheckCircle2, Clock, Edit2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FixedDepositPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  const [formData, setFormData] = useState({
    amount: "",
    month: "June",
    year: "2024",
    interest_rate: "8.265",
    tenure_months: "3"
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

  // --- LOGIC: AUTOMATIC DAILY INTEREST CALCULATION ---
  const calculateDailyInterest = (principal: number, rate: number, startMonth: string, startYear: string, tenure: number) => {
    const start = new Date(`${startMonth} 1, ${startYear}`);
    const end = new Date(start);
    end.setMonth(start.getMonth() + tenure);
    
    // Calculate exact days in that specific period
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Formula: (Principal * Rate% * Days) / 365
    return (principal * (rate / 100) * diffDays) / 365;
  };

  const checkIsFinished = (startMonth: string, startYear: string, tenureMonths: number) => {
    const monthIndex = monthsList.indexOf(startMonth);
    const startDate = new Date(Number(startYear), monthIndex, 1);
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(startDate.getMonth() + tenureMonths);
    return maturityDate <= new Date();
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Correcting the date format to fix "invalid input syntax"
    const formattedDate = new Date(`${formData.month} 1, ${formData.year}`).toISOString().split('T')[0];

    const { error } = await supabase
      .from('fixed_deposits')
      .insert([{
        member_id: 1, 
        society_id: "ADMIN-TREASURY", 
        amount: Number(formData.amount),
        month: formData.month,
        year: formData.year,
        interest_rate: Number(formData.interest_rate),
        tenure_months: Number(formData.tenure_months),
        start_date: formattedDate
      }]);

    if (!error) {
      setFormData({ ...formData, amount: "" });
      fetchDeposits();
    } else {
      alert("Error: " + error.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    
    const { error } = await supabase
      .from('fixed_deposits')
      .update({
        amount: Number(editData.amount),
        interest_rate: Number(editData.interest_rate),
        tenure_months: Number(editData.tenure_months),
        month: editData.month,
        year: editData.year
      })
      .eq('id', editingId);

    if (!error) {
      setEditingId(null);
      fetchDeposits();
    } else {
      alert("Update failed: " + error.message);
    }
  };

  const totals = useMemo(() => {
    return deposits.reduce((acc, d) => {
      const principal = Number(d.amount || 0);
      const tenure = Number(d.tenure_months || 0);
      const rate = Number(d.interest_rate || 0);
      const isFinished = checkIsFinished(d.month, d.year, tenure);
      const interest = calculateDailyInterest(principal, rate, d.month, d.year, tenure);

      return {
        principal: acc.principal + principal,
        realizedInterest: acc.realizedInterest + (isFinished ? interest : 0),
      };
    }, { principal: 0, realizedInterest: 0 });
  }, [deposits]);

  return (
    <div className="space-y-8 p-6 relative min-h-screen">
      <h1 className="text-3xl font-serif font-bold text-emerald-900">Society Treasury Ledger</h1>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Treasury Principal", val: totals.principal, icon: Wallet },
          { label: "Total Interest Earned", val: totals.realizedInterest, icon: TrendingUp },
          { label: "Total Maturity Value", val: totals.principal + totals.realizedInterest, icon: Banknote }
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
        <Card className="lg:col-span-1 border-emerald-100 shadow-sm rounded-xl h-fit">
          <CardHeader className="border-b bg-slate-50/30">
            <CardTitle className="text-lg text-emerald-900 flex items-center gap-2 font-bold">
              <PlusCircle size={18} className="text-emerald-600" /> New Bank Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-slate-400">Month</Label>
                  <Select value={formData.month} onValueChange={(v) => setFormData({...formData, month: v})}>
                    <SelectTrigger className="bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white max-h-[200px] overflow-y-auto">
                      {monthsList.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-slate-400">Year</Label>
                  <Input className="bg-slate-50 border-none font-bold" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-slate-400">Principal Amount (৳)</Label>
                <Input type="number" required className="bg-slate-50 border-none font-bold" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-slate-400">Interest Rate (%)</Label>
                  <Input type="number" step="0.001" className="bg-slate-50 border-none font-bold text-blue-600" value={formData.interest_rate} onChange={(e) => setFormData({...formData, interest_rate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-slate-400">Tenure (Months)</Label>
                  <Input type="number" required className="bg-slate-50 border-none font-bold" value={formData.tenure_months} onChange={(e) => setFormData({...formData, tenure_months: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-black h-12 rounded-xl mt-2">Save Deposit</Button>
            </form>
          </CardContent>
        </Card>

        {/* HISTORY TABLE */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg text-slate-700 flex items-center gap-2 font-bold">
              <History size={18} className="text-slate-400" /> Deposit History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left border-b text-slate-500 uppercase text-[10px] tracking-widest font-bold">
                  <th className="p-4">Date / Status</th>
                  <th className="p-4 text-center">Principal</th>
                  <th className="p-4 text-center">Interest %</th>
                  <th className="p-4 text-center">Tenure</th>
                  <th className="p-4 text-right">Maturity Est.</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deposits.map((d) => {
                  const principal = Number(d.amount);
                  const rate = Number(d.interest_rate);
                  const tenure = Number(d.tenure_months);
                  const interest = calculateDailyInterest(principal, rate, d.month, d.year, tenure);
                  const isFinished = checkIsFinished(d.month, d.year, tenure);
                  
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{d.month} {d.year}</div>
                        <Badge variant="outline" className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isFinished ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {isFinished ? "FINISHED" : "ACTIVE"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-bold">৳{principal.toLocaleString()}</td>
                      <td className="p-4 text-center font-bold text-blue-600">{rate}%</td>
                      <td className="p-4 text-center font-bold">{tenure} months</td>
                      <td className="p-4 text-right">
                        <Badge variant="outline" className={`${isFinished ? "bg-emerald-900 text-white" : "bg-blue-50 text-blue-700"} font-bold py-1 px-3`}>
                          ৳{Math.round(principal + interest).toLocaleString()}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(d.id); setEditData({...d}); }} className="hover:bg-emerald-50 text-slate-400 hover:text-emerald-600">
                           <Edit2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* EDIT MODAL OVERLAY */}
      {editingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <Card className="w-full max-w-md shadow-2xl border-none animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-[#064e3b] text-white rounded-t-xl flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Edit Bank Entry</CardTitle>
              <button onClick={() => setEditingId(null)} className="text-white/50 hover:text-white"><X size={20}/></button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Month</Label>
                  <Select value={editData.month} onValueChange={(v) => setEditData({...editData, month: v})}>
                    <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {monthsList.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Year</Label>
                  <Input className="font-bold" value={editData.year} onChange={(e) => setEditData({...editData, year: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-400">Principal (৳)</Label>
                <Input className="font-bold" type="number" value={editData.amount} onChange={(e) => setEditData({...editData, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Interest Rate (%)</Label>
                  <Input className="font-bold text-blue-600" type="number" step="0.001" value={editData.interest_rate} onChange={(e) => setEditData({...editData, interest_rate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Tenure (Months)</Label>
                  <Input className="font-bold" type="number" value={editData.tenure_months} onChange={(e) => setEditData({...editData, tenure_months: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleUpdate} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black h-11 rounded-xl shadow-lg">Update Entry</Button>
                <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1 border-slate-200 text-slate-500 font-bold h-11 rounded-xl">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}