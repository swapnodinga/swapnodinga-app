import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ImageIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase"; 

interface PaymentModalProps {
  onSubmit: (amount: number, proofUrl: string, month: string, lateFee: number, societyId: string) => void;
  userSocietyId: string; 
}

export function PaymentModal({ onSubmit, userSocietyId }: PaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("7500");
  const [month, setMonth] = useState(""); 
  const [lateFee, setLateFee] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

    setIsUploading(true);
    try {
      // 3. CORRECTED UPLOAD PATH: Removing 'receipts/' folder prefix
      const fileExt = file.name.split('.').pop();
      const fileName = `${userSocietyId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payments')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // GET PUBLIC URL: Must match the path used in .upload()
      const { data: { publicUrl } } = supabase.storage
        .from('payments')
        .getPublicUrl(fileName);
      
      // 4. SUBMIT TRANSACTION
      await onSubmit(totalAmount, publicUrl, month, lateFee, userSocietyId);
      
      setOpen(false);
      setFile(null);
      setMonth("");
    } catch (error: any) {
      // Clearer error reporting for debugging
      console.error("Payment submission error:", error);
      alert("Submission failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Upload className="w-4 h-4 mr-2" /> Submit Instalment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Monthly Instalment</DialogTitle>
            <DialogDescription>
              Submit payment for <strong>{userSocietyId}</strong>.
              Late fees apply after the 1st and 5th.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (৳)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={month} onValueChange={setMonth} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {monthsList.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {lateFee > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-center gap-2 text-amber-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Late Fee Applied: ৳{lateFee}</span>
              </div>
            )}

            <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
              <input type="file" id="proof" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="image/*" required />
              <label htmlFor="proof" className="cursor-pointer flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-slate-400" />
                <span className="text-xs text-slate-500">{file ? file.name : "Upload Receipt"}</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full bg-emerald-900 text-white" disabled={isUploading}>
              {isUploading ? "Submitting..." : `Pay ৳${totalAmount}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}