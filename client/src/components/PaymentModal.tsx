import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ImageIcon, CheckCircle2 } from "lucide-react";

interface PaymentModalProps {
  // Added month to the signature to match our database
  onSubmit: (amount: number, proofUrl: string, month: string) => void;
}

export function PaymentModal({ onSubmit }: PaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("7500");
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      /**
       * FREE TIER TIP: 
       * Instead of paid storage, you can use a free service like ImgBB API 
       * or simply use a temporary placeholder until you set up Supabase Storage (which is also free).
       * For now, we will pass a placeholder URL.
       */
      const proofUrl = "https://placehold.co/600x400?text=Payment+Receipt"; 
      
      onSubmit(Number(amount), proofUrl, month);
      
      setOpen(false);
      setFile(null);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const monthsList = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ].map(m => `${m} ${new Date().getFullYear()}`);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Upload className="w-4 h-4" />
          Submit Instalment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Monthly Instalment</DialogTitle>
          <DialogDescription>
            Submit your deposit proof. Admin will verify and update your status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (৳)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {monthsList.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof">Payment Proof (Screenshot)</Label>
            <div className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${file ? 'border-emerald-500 bg-emerald-50/50' : 'border-input hover:bg-muted/50'}`}>
               <input 
                 type="file" 
                 id="proof" 
                 className="hidden" 
                 onChange={(e) => setFile(e.target.files?.[0] || null)}
                 accept="image/*"
                 required
               />
               <label htmlFor="proof" className="cursor-pointer flex flex-col items-center gap-2 w-full">
                 {file ? (
                   <>
                     <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                     <span className="text-sm font-medium text-emerald-700">{file.name}</span>
                     <span className="text-xs text-emerald-600">Click to change</span>
                   </>
                 ) : (
                   <>
                     <ImageIcon className="w-8 h-8 text-muted-foreground" />
                     <span className="text-sm text-muted-foreground">Click to upload bKash/Nagad receipt</span>
                     <span className="text-xs text-muted-foreground/60">(Max size: 2MB)</span>
                   </>
                 )}
               </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isUploading}>
              {isUploading ? "Processing..." : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
