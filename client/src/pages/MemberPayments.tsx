"use client"

import React, { useState, useMemo } from "react";
import { useSociety } from "@/context/SocietyContext";
import { TransactionTable } from "@/components/TransactionTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Check, UploadCloud, X, MailCheck } from "lucide-react";

export default function MyPayments() {
  const { currentUser, transactions, submitInstalment } = useSociety();
  
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("December");
  const [baseAmount, setBaseAmount] = useState(8000);
  const [file, setFile] = useState<File | null>(null);

  const myTransactions = transactions.filter(t => String(t.member_id) === String(currentUser?.id));

  const lateFine = useMemo(() => {
    const today = new Date();
    const currentMonthIdx = today.getMonth(); 
    const currentYear = today.getFullYear(); 

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const selectedMonthIdx = monthNames.indexOf(month);
    const selectedYear = parseInt(year);

    if (selectedYear > currentYear) return 0;
    if (selectedYear === currentYear && selectedMonthIdx >= currentMonthIdx) return 0;

    return 1000;
  }, [month, year]);

  const totalToPay = baseAmount + lateFine;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setIsSubmitting(true);
    try {
      const billingPeriod = `${month} ${year}`;
      
      // Removed the alert() call from here to prevent the double notification
      await submitInstalment(totalToPay, file, billingPeriod);
      
      setShowSuccess(true);
      setShowForm(false);
      setFile(null);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 relative min-h-screen">
      
      {showSuccess && (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top duration-500">
          <div className="bg-[#059669] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-emerald-400/30">
            <MailCheck size={20}/>
            <div>
              <p className="font-bold text-[13px]">Payment has been successfully submitted.</p>
              <p className="text-[10px] opacity-90">A confirmation mail will be sent once approved.</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="ml-2 hover:bg-white/10 p-1 rounded-lg">
              <X size={16}/>
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="bg-[#002b1b] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 border border-emerald-900/50 shadow-lg">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Submit Monthly Payment</h2>
            <p className="text-emerald-200/60 text-[11px] md:text-xs max-w-lg font-medium">
              Payments are due by the end of each month. Fines apply after the 1st (৳500) and 5th (৳1000). 
              Upload your transaction receipt for verification.
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-[#00c67d] hover:bg-[#00b06f] text-[#002b1b] font-black py-5 px-8 rounded-full flex gap-2 group transition-all"
          >
            Submit Instalment <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
          </Button>
        </div>
      )}

      {showForm && (
        <div className="max-w-md mx-auto py-2 animate-in zoom-in-95 duration-200 relative z-40">
          <Card className="border-none shadow-2xl rounded-[32px] bg-white overflow-visible">
            <CardContent className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Year</label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50 h-9 text-xs font-bold">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[999] bg-white border border-slate-200 shadow-xl rounded-xl">
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Month</label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50 h-9 text-xs font-bold">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[999] bg-white border border-slate-200 shadow-xl rounded-xl">
                      {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                        <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Amount (BDT)</label>
                <Input type="number" value={baseAmount} onChange={(e) => setBaseAmount(Number(e.target.value))} className="rounded-xl border-slate-100 bg-slate-50/50 h-9 font-bold text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proof of Payment</label>
                <div className="relative border-2 border-dashed border-emerald-100 rounded-xl p-3 bg-emerald-50/10 text-center hover:bg-emerald-50/30 transition-all cursor-pointer">
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <UploadCloud size={18} className="text-emerald-400 mx-auto mb-1"/>
                  <p className="text-[9px] text-emerald-900 font-bold truncate px-2">{file ? file.name : "Upload receipt"}</p>
                </div>
              </div>

              <div className="bg-[#f0fdf4] border border-emerald-50 rounded-2xl py-3 text-center">
                <p className="text-emerald-600 text-[8px] font-black uppercase tracking-widest mb-0.5">
                  Late Fine: <span className="text-emerald-500">৳{lateFine}</span>
                </p>
                <h3 className="text-2xl font-black text-[#004d33] tracking-tighter">৳{totalToPay.toLocaleString()}</h3>
                <p className="text-[#004d33]/30 text-[7px] font-bold uppercase">Total to pay</p>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleUpload}
                  disabled={isSubmitting || !file}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white rounded-xl h-10 font-black text-[11px] tracking-widest shadow-lg shadow-emerald-100"
                >
                  {isSubmitting ? "PROCESSING..." : "SUBMIT TO VERIFY"}
                </Button>
                <button onClick={() => setShowForm(false)} className="w-full text-slate-400 text-[8px] font-black uppercase tracking-widest">Cancel</button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-4 border-emerald-600 pl-3">Recent Transactions</h2>
        <TransactionTable transactions={myTransactions} isAdmin={false} />
      </div>
    </div>
  );
}