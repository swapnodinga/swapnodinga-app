import Layout from "@/components/Layout";
import { useSociety } from "@/context/SocietyContext";
import { StatCard } from "@/components/StatCard";
import { TransactionTable } from "@/components/TransactionTable";
import { PaymentModal } from "@/components/PaymentModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PiggyBank, 
  TrendingUp, 
  Wallet,
  LandPlot 
} from "lucide-react";

export default function MemberDashboard() {
  const { currentUser, transactions, societyTotalFund, submitInstalment } = useSociety();

  if (!currentUser) return <div>Loading...</div>;

  const myTransactions = transactions.filter(t => t.memberId === currentUser.id);
  const totalSavings = currentUser.totalInstalmentPaid + currentUser.fixedDeposit + currentUser.totalInterestEarned;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Welcome, {currentUser.name}</h1>
          <p className="text-muted-foreground">Here is your financial overview for Swapnodinga.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="My Total Savings"
            value={`৳${totalSavings.toLocaleString()}`}
            icon={Wallet}
            description="Instalments + FD + Interest"
            className="border-l-primary"
          />
          <StatCard
            title="Monthly Instalments"
            value={`৳${currentUser.totalInstalmentPaid.toLocaleString()}`}
            icon={PiggyBank}
            description={`Due: ৳${currentUser.monthlyInstalment}/month`}
            className="border-l-secondary"
          />
          <StatCard
            title="Fixed Deposit"
            value={`৳${currentUser.fixedDeposit.toLocaleString()}`}
            icon={LandPlot}
            description={`+ ৳${currentUser.totalInterestEarned.toLocaleString()} Interest`}
            className="border-l-accent"
          />
          <StatCard
            title="Society Total Fund"
            value={`৳${societyTotalFund.toLocaleString()}`}
            icon={TrendingUp}
            description="Collective achievement"
            className="border-l-chart-4"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="instalments">Instalments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest transactions and approvals.</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionTable transactions={myTransactions.slice(0, 5)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instalments" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary/5 p-6 rounded-lg border border-primary/10">
              <div>
                <h3 className="text-lg font-bold text-primary mb-1">Make a Contribution</h3>
                <p className="text-sm text-muted-foreground">Upload your payment proof for this month's instalment.</p>
              </div>
              <PaymentModal onSubmit={submitInstalment} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionTable transactions={myTransactions} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
