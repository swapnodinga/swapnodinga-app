import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/StatCard";
import { TransactionTable } from "@/components/TransactionTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Wallet, PiggyBank, TrendingUp, Landmark, FileDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalInstalments: 0,
    totalFixedDeposits: 0,
    totalInterest: 0,
    totalFund: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Requirement: Fetch live totals from Supabase tables
const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      // 1. Fetching from "Installments" exactly as shown in your sidebar
      const { data: installmentsData, error: instError } = await supabase
        .from('Installments') 
        .select('amount')
        .eq('status', 'Approved');

      if (instError) console.error("Check table name 'Installments':", instError);
      
      // 2. Fetch Fixed Deposits
      const { data: depositsData } = await supabase
        .from('fixed_deposits')
        .select('amount');

      // 3. Fetch Total Interest
      const { data: interestData } = await supabase
        .from('member_profit_records')
        .select('amount_earned');

      // Calculate Sums with Number conversion to prevent string concatenation
      const sumInstalments = installmentsData?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;
      const sumDeposits = depositsData?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;
      const sumInterest = interestData?.reduce((sum, item) => sum + Number(item.amount_earned || 0), 0) || 0;

      setStats({
        totalInstalments: sumInstalments,
        totalFixedDeposits: sumDeposits,
        totalInterest: sumInterest,
        // Requirement: Total Fund MUST be the sum of all three categories
        totalFund: sumInstalments + sumDeposits + sumInterest 
      });
    } catch (error) {
      console.error("Dashboard calculation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const chartData = [
    { name: 'Instalments', value: stats.totalInstalments },
    { name: 'Fixed Deposits', value: stats.totalFixedDeposits },
    { name: 'Interest', value: stats.totalInterest }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-900 uppercase">Admin Dashboard</h1>
          <p className="text-muted-foreground italic text-sm">Supabase Real-time Cloud Data</p>
        </div>
        <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          <FileDown className="w-4 h-4" /> Export Excel
        </Button>
      </div>

      {/* Requirement: Updated Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="TOTAL FUND" 
          value={isLoading ? "..." : `৳${stats.totalFund.toLocaleString()}`} 
          icon={Wallet} 
          className="border-l-4 border-l-emerald-600 shadow-sm" 
        />
        <StatCard 
          title="TOTAL INSTALMENTS" 
          value={isLoading ? "..." : `৳${stats.totalInstalments.toLocaleString()}`} 
          icon={PiggyBank} 
          className="border-l-4 border-l-amber-500 shadow-sm" 
        />
        <StatCard 
          title="FIXED DEPOSITS" 
          value={isLoading ? "..." : `৳${stats.totalFixedDeposits.toLocaleString()}`} 
          icon={TrendingUp} 
          className="border-l-4 border-l-blue-500 shadow-sm" 
        />
        {/* Requirement: Replaced Active Members with Total Interest */}
        <StatCard 
          title="TOTAL INTEREST" 
          value={isLoading ? "..." : `৳${stats.totalInterest.toLocaleString()}`} 
          icon={Landmark} 
          className="border-l-4 border-l-purple-500 shadow-sm" 
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-emerald-100/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Distribution History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2 border-emerald-100 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b mb-4">
              <CardTitle className="text-emerald-900 text-lg uppercase tracking-tight">Financial Mix</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `৳${v/1000}K`} />
                  <Tooltip formatter={(value) => `৳${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#065f46" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-emerald-100 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b mb-4">
              <CardTitle className="text-emerald-900 text-lg uppercase tracking-tight">Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium">Instalment Contribution</span>
                    <span className="font-bold">৳{stats.totalInstalments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium">Fixed Deposit Capital</span>
                    <span className="font-bold">৳{stats.totalFixedDeposits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border-t-2 border-emerald-100">
                    <span className="text-sm font-bold text-emerald-700 text-lg">Total Liquid Assets</span>
                    <span className="font-black text-emerald-800 text-lg">৳{stats.totalFund.toLocaleString()}</span>
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}