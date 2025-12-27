import { useSociety } from "@/context/SocietyContext";
import { StatCard } from "@/components/StatCard";
import { TransactionTable } from "@/components/TransactionTable";
import { PaymentModal } from "@/components/PaymentModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  PiggyBank, 
  TrendingUp, 
  Wallet,
  LandPlot,
  Download,
  ShieldCheck
} from "lucide-react";

export default function MemberDashboard() {
  // Destructure society data and the submission function from context
  const { currentUser, transactions, societyTotalFund, submitInstalment } = useSociety();

  if (!currentUser) return (
    <div className="flex items-center justify-center h-64">
       <p className="text-emerald-700 font-serif animate-pulse text-lg">Loading Member Profile...</p>
    </div>
  );

  // Filter transactions using society_id to match your Supabase schema
  const myTransactions = transactions.filter(t => t.memberId === currentUser.society_id);
  
  // Calculate total individual savings based on user profile fields
  const totalSavings = (currentUser.totalInstalmentPaid || 0) + 
                       (currentUser.fixedDeposit || 0) + 
                       (currentUser.totalInterestEarned || 0);

  // CSV Export Logic for Personal Statement
  const handleExportStatement = () => {
    const headers = ["Date", "Month", "Amount", "Status"];
    const rows = myTransactions.map(t => [
      t.date,
      t.month,
      `৳${t.amount}`,
      t.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + `Account Statement for ${currentUser.name}\n`
      + `Member ID: ${currentUser.society_id}\n`
      + `Total Personal Savings: ৳${totalSavings}\n\n`
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentUser.name}_Statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-900">Welcome, {currentUser.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Member ID
            </span>
            <span className="font-mono text-sm">{currentUser.society_id}</span>
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportStatement}
          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm"
        >
          <Download className="mr-2 h-4 w-4" /> Download Statement
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Total Savings"
          value={`৳${totalSavings.toLocaleString()}`}
          icon={Wallet}
          description="Combined individual balance"
          className="border-l-4 border-l-emerald-600 shadow-sm bg-white"
        />
        <StatCard
          title="Monthly Instalments"
          value={`৳${(currentUser.totalInstalmentPaid || 0).toLocaleString()}`}
          icon={PiggyBank}
          description="Accumulated monthly savings"
          className="border-l-4 border-l-amber-500 shadow-sm bg-white"
        />
        <StatCard
          title="Fixed Deposit"
          value={`৳${(currentUser.fixedDeposit || 0).toLocaleString()}`}
          icon={LandPlot}
          description={`Profit Earned: ৳${(currentUser.totalInterestEarned || 0).toLocaleString()}`}
          className="border-l-4 border-l-blue-500 shadow-sm bg-white"
        />
        <StatCard
          title="Society Fund"
          value={`৳${societyTotalFund.toLocaleString()}`}
          icon={TrendingUp}
          description="Total Collective Capital"
          className="border-l-4 border-l-slate-400 shadow-sm bg-white"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-emerald-100/50 p-1">
          <TabsTrigger value="overview">Snapshot</TabsTrigger>
          <TabsTrigger value="instalments">Contribution History</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-emerald-100 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-slate-50/50 py-4">
                <CardTitle className="text-emerald-900 font-serif text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest transactions and verification status.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <TransactionTable transactions={myTransactions.slice(0, 5)} />
              </CardContent>
            </Card>

            <Card className="border-emerald-100 shadow-sm bg-emerald-50/20">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-emerald-800">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Instalments</span>
                  <span className="font-mono font-bold">৳{(currentUser.totalInstalmentPaid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Fixed Deposit</span>
                  <span className="font-mono font-bold">৳{(currentUser.fixedDeposit || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Interest Profit</span>
                  <span className="font-mono font-bold text-emerald-600">+ ৳{(currentUser.totalInterestEarned || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-emerald-900">Total Equity</span>
                  <span className="font-mono font-bold text-emerald-900">৳{totalSavings.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* INSTALMENTS TAB */}
        <TabsContent value="instalments" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#064e3b] p-8 rounded-2xl border border-emerald-800 shadow-xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Submit Monthly Payment</h3>
              <p className="text-emerald-100/80 text-sm max-w-md leading-relaxed">
                Payments are due by the end of each month.
                Fines apply after the 1st (৳500) and 5th (৳1000).
                Upload your transaction receipt for verification.
              </p>
            </div>
            <div className="relative z-10">
              {/* FIXED MODAL PROPS: Added society_id and updated onSubmit logic */}
              <PaymentModal 
                userSocietyId={currentUser.society_id}
                onSubmit={(amount, proofUrl, month, lateFee, societyId) => {
                  if (typeof submitInstalment === 'function') {
                    // Pass all 5 required parameters to your context
                    submitInstalment(amount, proofUrl, month, lateFee, societyId);
                  } else {
                    console.error("submitInstalment function missing from context");
                  }
                }} 
              />
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10">
                <PiggyBank size={160} />
            </div>
          </div>

          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 py-4">
              <CardTitle className="text-emerald-900 font-serif text-lg">Full Transaction Ledger</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <TransactionTable transactions={myTransactions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}