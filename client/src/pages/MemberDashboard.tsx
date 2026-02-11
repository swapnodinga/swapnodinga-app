"use client"

import React from "react"
import { useSociety } from "@/context/SocietyContext"
import { 
  TrendingUp, 
  History, 
  Wallet, 
  Building2, 
  PieChart, 
  ArrowUpRight 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MemberDashboard() {
  const { 
    currentUser, 
    transactions, 
    societyTotalFund, 
    isLoading 
  } = useSociety()

  // Filter personal transactions for the history list
  const myTransactions = transactions
    .filter(t => String(t.member_id) === String(currentUser?.id))
    .slice(0, 5)

  // Calculate Personal Contribution (This is okay to do locally as it's user-specific)
  const myTotalPaid = transactions
    .filter(t => String(t.member_id) === String(currentUser?.id) && t.status === "Approved")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-[150px] w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {currentUser?.full_name || "Member"}
          </h1>
          <p className="text-slate-500 mt-1">Here is your society capital overview.</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
          <span className="text-emerald-700 font-medium flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            ID: {currentUser?.society_id}
          </span>
        </div>
      </div>

      {/* Capital Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SOCIETY TOTAL FUND - FIXED VALUE FROM CONTEXT */}
        <Card className="relative overflow-hidden border-none bg-slate-900 text-white shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-400" />
              SOCIETY TOTAL FUND
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter">
              ৳{Math.round(societyTotalFund).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              COLLECTIVE POOL
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Building2 className="h-20 w-20" />
          </div>
        </Card>

        {/* PERSONAL CONTRIBUTION */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              MY CONTRIBUTION
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              ৳{myTotalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-2">Total approved installments</p>
          </CardContent>
        </Card>

        {/* PERFORMANCE / STATUS */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-purple-500" />
              PORTFOLIO SHARE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {societyTotalFund > 0 
                ? ((myTotalPaid / societyTotalFund) * 100).toFixed(2) 
                : "0"}%
            </div>
            <p className="text-xs text-slate-400 mt-2">Your stake in the society</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400" />
            <CardTitle>Recent Payments</CardTitle>
          </div>
          <button className="text-sm text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
            View All <ArrowUpRight className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          {myTransactions.length > 0 ? (
            <div className="space-y-4">
              {myTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{tx.month} Installment</span>
                    <span className="text-xs text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-slate-900">৳{tx.amount.toLocaleString()}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      tx.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                      tx.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No recent payment activity found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}