// src/pages/SocietyTreasury.tsx
import { useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, ArrowDownWideDot } from "lucide-react";

export default function SocietyTreasury() {
  const { members, updateMemberInterest } = useSociety();
  const [totalProfit, setTotalProfit] = useState("");

  const collectiveSavings = members.reduce((sum, m) => 
    sum + (m.totalInstalmentPaid || 0) + (m.fixedDeposit || 0), 0
  );

  const handleDistribute = async () => {
    const amount = Number(totalProfit);
    if (amount <= 0) return;

    // The Logic: Each member gets a portion based on their share of total savings
    for (const member of members) {
      const memberSavings = (member.totalInstalmentPaid || 0) + (member.fixedDeposit || 0);
      const share = memberSavings / collectiveSavings;
      const memberGain = amount * share;
      
      const newInterest = (member.totalInterestEarned || 0) + memberGain;
      await updateMemberInterest(member.id, newInterest);
    }
    setTotalProfit("");
    alert("Profit distributed successfully based on member shares!");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <h1 className="text-3xl font-serif font-bold text-emerald-900">Interest & Profit Distribution</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-emerald-100 shadow-md">
          <CardHeader className="bg-emerald-900 text-white">
            <CardTitle>Distribute Society Earnings</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Input 
              type="number" 
              placeholder="Enter Total Profit to Distribute (৳)" 
              value={totalProfit}
              onChange={(e) => setTotalProfit(e.target.value)}
            />
            <Button className="w-full bg-emerald-700" onClick={handleDistribute}>
              Calculate & Distribute Proportionally
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}