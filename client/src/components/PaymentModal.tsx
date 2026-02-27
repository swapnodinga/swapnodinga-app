"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ImageIcon, AlertCircle, Loader2 } from "lucide-react";

interface PaymentModalProps {
  // Updated signature to match SocietyContext: (amount, file, month)
  onSubmit: (amount: number, file: File, month: string) => Promise<void>;
  userSocietyId: string; 
}

export function PaymentModal({ onSubmit, userSocietyId }: PaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("7500");
  const [month, setMonth] = useState(""); 
  const [lateFee, setLateFee] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const monthsList = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });

  useEffect(() => {
    if (!month) return;
    
    const today = new Date();
    const [monthName, yearStr] = month.split(' ');
    const year = parseInt(yearStr);
    const months = ["january", "february", "march", "april", "may", "june", 
                    "july", "august", "september", "october", "november", "december"];
    const monthIndex = months.indexOf(monthName.toLowerCase());

    const nextMonth = (monthIndex + 1) % 12;
    const nextMonthYear = monthIndex === 11 ? year + 1 : year;
    
    const firstOfNextMonth = new Date(nextMonthYear, nextMonth, 1);
    const fifthOfNextMonth = new Date(nextMonthYear, nextMonth, 5);

    if (today > fifthOfNextMonth) {
      setLateFee(1000); 
    } else if (today >= firstOfNextMonth) {
      setLateFee(500);  
    } else {
      setLateFee(0);    
    }
  }, [month]);

  const totalAmount = Number(amount) + lateFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!month || !file) return alert("Please select a month and upload your receipt.");

    setIsProcessing(true);
    try {
      // Pass the raw File object to SocietyContext's submitInstalment
      // The context now handles the Supabase storage upload and API call
      await onSubmit(totalAmount, file, month);
      
      // Cleanup and close on success
      setOpen(false);
      setFile(null);
      setMonth("");
      setAmount("7500");
    } catch (error: any) {
      console.error("Payment submission error:", error);
      alert("Submission failed. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Upload className="w-4 h-4 mr-2" /> Submit Instalment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-900">Monthly Instalment</DialogTitle>
            <DialogDescription>
              Submit payment for <strong>{userSocietyId}</strong>.
              Late fees apply after the 1st and 5th.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600 font-medium">Amount (৳)</Label>
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  required 
                  className="border-slate-200 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 font-medium">Month</Label>
                <Select value={month} onValueChange={setMonth} required>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {monthsList.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {lateFee > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-center gap-2 text-amber-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Late Fee Applied: <strong>৳{lateFee}</strong></span>
              </div>
            )}

            <div 
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors ${
                file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'
              }`}
              onClick={() => document.getElementById('receipt-upload')?.click()}
            >
              <input 
                type="file" 
                id="receipt-upload" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                accept="image/*" 
                required 
              />
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className={`w-8 h-8 ${file ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className={`text-xs font-medium ${file ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {file ? file.name : "Click to Upload Receipt"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full bg-emerald-900 hover:bg-emerald-950 text-white h-11" 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                `Pay ৳${totalAmount}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}