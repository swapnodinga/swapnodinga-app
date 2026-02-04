"use client"

import { useState, useMemo } from "react";
import { useSociety } from "@/context/SocietyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, PlusCircle, TrendingUp, Banknote, 
  CheckCircle2, Clock, Edit2, Trash2, X, Calendar 
} from "lucide-react";

export default function FixedDepositPage() {
  const { fixedDeposits, addFixedDeposit, updateFixedDeposit, deleteFixedDeposit } = useSociety();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: "",
    start_date: new Date().toISOString().split('T')[0],
    interest_rate: "8.265",
    tenure_months: "3"
  });

  // HELPER: Exact Day-Wise Calculation & Date Formatting
  const calculateMaturity = (amount: number, rate: number, start: string, months: number) => {
    const startDate = new Date(start);
    const maturityDate = new Date(start);
    maturityDate.setMonth(startDate.getMonth() + Number(months));

    // Calculate total days for precision
    const diffTime = Math.abs(maturityDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Formula: (Principal * Rate * Days) / (365 * 100)
    const interest = (amount * rate * totalDays) / (365 * 100);
    
    return {
      interest: Math.round(interest),
      total: Math.round(amount + interest),
      isFinished: maturityDate <= new Date(),
      days: totalDays,
      finishDateStr: maturityDate.toLocaleDateString('en-GB', { 
        day: '2-digit', month: 'short', year: '2-digit' 
      }).replace(/ /g, '-')
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(formData.start_date);
    const payload = {
      amount: Number(formData.amount),
      start_date: formData.start_date,
      interest_rate: Number(formData.interest_rate),
      tenure_months: Number(formData.tenure_months),
      month: dateObj.toLocaleString('default', { month: 'long' }),
      year: dateObj.getFullYear().toString(),
      status: "Active"
    };

    try {
      if (editingId) {
        await updateFixedDeposit(editingId, payload);
        setEditingId(null);
      } else {
        await addFixedDeposit(payload);
      }
      setFormData({ ...formData, amount: "" });
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const startEdit = (d: any) => {
    setEditingId(d.id);
    setFormData({
      amount: d.amount.toString(),
      start_date: d.start_date,
      interest_rate: d.interest_rate.toString(),
      tenure_months: d.tenure_months.toString()
    });
  };

  const totals = useMemo(() => {
    return fixedDeposits.reduce((acc, d) => {
      const calc = calculateMaturity(d.amount, d.interest_rate, d.start_date, d.tenure_months);
      return {
        principal: acc.principal + Number(d.amount),
        interest: acc.interest + (calc.isFinished ? calc.interest : 0)
      };
    }, { principal: 0, interest: 0 });
  }, [fixedDeposits]);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto bg-slate-50/30 min-h-screen">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
            <Banknote size={24} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Society Treasury Ledger</h1>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
          <PlusCircle size={18} className="mr-2"/> Add New FD
        </Button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Principal Amount", val: totals.principal, icon: Wallet, color: "bg-white text-emerald-900 border-emerald-100" },
          { label: "Total Realized Interest", val: totals.interest, icon: TrendingUp, color: "bg-white text-blue-900 border-blue-100" },
          { label: "Total Maturity Value", val: totals.principal + totals.interest, icon: Banknote, color: "bg-[#064e3b] text-white border-none" }
        ].map((card, i) => (
          <Card key={i} className={`${card.color} shadow-sm border rounded-2xl`}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">{card.label}</span>
                <card.icon size={16} className="opacity-50" />
              </div>
              <div className="text-3xl font-bold">৳{card.val.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* FORM SECTION */}
        <Card className="lg:col-span-1 border-slate-200 shadow-sm rounded-xl h-fit sticky top-6">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-lg text-emerald-800 flex justify-between items-center font-bold">
              <span className="flex items-center gap-2">
                {editingId ? <Edit2 size={18}/> : <PlusCircle size={18} />} 
                {editingId ? "Edit Entry" : "New Bank Entry"}
              </span>
              {editingId && <X className="cursor-pointer text-slate-400" onClick={() => {setEditingId(null); setFormData({...formData, amount: ""})}}/>}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Start Date</Label>
                <div className="relative">
                  <Input type="date" className="pl-9" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                  <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Principal Amount (৳)</Label>
                <Input type="number" required placeholder="0" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Rate (%)</Label>
                  <Input type="number" step="0.001" value={formData.interest_rate} onChange={(e) => setFormData({...formData, interest_rate: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Tenure (M)</Label>
                  <Input type="number" required value={formData.tenure_months} onChange={(e) => setFormData({...formData, tenure_months: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className={`w-full font-bold h-11 rounded-lg mt-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-700 hover:bg-emerald-800'}`}>
                {editingId ? "Update Record" : "Save Deposit"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* TABLE SECTION */}
        <Card className="lg:col-span-3 border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-md text-slate-700 flex items-center gap-2 font-bold">
              <Clock size={18} className="text-slate-400" /> Deposit History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-widest font-bold border-b">
                <tr>
                  <th className="p-4 text-left">Period / Status</th>
                  <th className="p-4 text-center">Principal (BDT)</th>
                  <th className="p-4 text-center">Rate (%)</th>
                  <th className="p-4 text-center">Tenure</th>
                  <th className="p-4 text-center">Finish Date (Auto)</th>
                  <th className="p-4 text-center">Maturity Est.</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixedDeposits.map((d) => {
                  const calc = calculateMaturity(d.amount, d.interest_rate, d.start_date, d.tenure_months);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{d.month} {d.year}</div>
                        <Badge variant="outline" className={`mt-1.5 text-[9px] px-2 py-0 h-5 font-bold rounded-full ${calc.isFinished ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                          {calc.isFinished ? <CheckCircle2 size={10} className="mr-1" /> : <Clock size={10} className="mr-1" />}
                          {calc.isFinished ? "FINISHED" : "ACTIVE"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700">৳{d.amount.toLocaleString()}</td>
                      <td className="p-4 text-center font-bold text-blue-600">{d.interest_rate}%</td>
                      <td className="p-4 text-center text-slate-500 font-medium">{d.tenure_months} Months</td>
                      <td className="p-4 text-center font-mono text-slate-600 text-xs font-bold">{calc.finishDateStr}</td>
                      <td className="p-4 text-center">
                        <div className="bg-[#002e25] text-[#48f0c3] px-3 py-1.5 rounded-lg inline-block font-bold text-xs">
                          ৳{calc.total.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(d)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200">
                            <Edit2 size={14}/>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteFixedDeposit(d.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200">
                            <Trash2 size={14}/>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {fixedDeposits.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                No fixed deposits recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}