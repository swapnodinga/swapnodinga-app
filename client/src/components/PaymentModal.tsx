import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

interface PaymentModalProps {
  onSubmit: (amount: number, proofUrl: string) => void;
}

export function PaymentModal({ onSubmit }: PaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("5000");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock upload URL
    const mockUrl = "https://placehold.co/400x600?text=Uploaded+Proof";
    onSubmit(Number(amount), mockUrl);
    setOpen(false);
    setAmount("5000");
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Submit Instalment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Monthly Instalment</DialogTitle>
          <DialogDescription>
            Enter the amount deposited and upload a proof of payment (screenshot/receipt).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
            <Label htmlFor="proof">Payment Proof</Label>
            <div className="border-2 border-dashed border-input rounded-md p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
               <input 
                 type="file" 
                 id="proof" 
                 className="hidden" 
                 onChange={(e) => setFile(e.target.files?.[0] || null)}
                 accept="image/*,.pdf"
               />
               <label htmlFor="proof" className="cursor-pointer flex flex-col items-center gap-2">
                 <Upload className="w-8 h-8 text-muted-foreground" />
                 <span className="text-sm text-muted-foreground">
                   {file ? file.name : "Click to upload image or PDF"}
                 </span>
               </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Submit for Approval</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
