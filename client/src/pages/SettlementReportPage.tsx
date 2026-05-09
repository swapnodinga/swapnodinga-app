"use client"

import { useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Download, Search, Building2, User, Calendar } from "lucide-react";

export default function SettlementReportPage() {
  const { members, transactions, fixedDeposits } = useSociety();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Filter members by search
  const filteredMembers = members.filter(m =>
    (m.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.society_id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate settlement for a member
  const calculateSettlement = (member: any) => {
    // 1. Member contribution
    const memberInstallments = (transactions || []).filter(
      (t: any) => t.member_id === member.id
    );
    const approvedInstallments = memberInstallments.filter(
      (i: any) => i.status?.toLowerCase() === "approved"
    );
    const memberContribution = approvedInstallments.reduce(
      (sum: number, i: any) => sum + Number(i.amount || 0),
      0
    );

    // 2. Unpaid installments
    const pendingInstallments = memberInstallments.filter(
      (i: any) => i.status?.toLowerCase() === "pending"
    );
    const unpaidAmount = pendingInstallments.reduce(
      (sum: number, i: any) => sum + Number(i.amount || 0),
      0
    );

    // 3. Calculate total society contribution for dividend share
    const allApprovedInstallments = (transactions || []).filter(
      (t: any) => t.status?.toLowerCase() === "approved"
    );
    const totalSocietyContribution = allApprovedInstallments.reduce(
      (sum: number, i: any) => sum + Number(i.amount || 0),
      0
    );

    // 4. Calculate realized interest
    let totalRealizedInterest = 0;
    const today = new Date();

    (fixedDeposits || []).forEach((fd: any) => {
      const start = new Date(fd.start_date);
      const tenure = Number(fd.tenure_months) || 3;
      const maturity = new Date(start);
      maturity.setMonth(maturity.getMonth() + tenure);

      if (maturity <= today) {
        const interest = (Number(fd.amount) * Number(fd.interest_rate) * tenure) / 1200;
        totalRealizedInterest += interest;
      }
    });

    // 5. Member's dividend share
    const memberEquityShare =
      totalSocietyContribution > 0
        ? (memberContribution / totalSocietyContribution) * totalRealizedInterest
        : 0;

    // 6. Member's fixed deposits
    const memberFDs = (fixedDeposits || []).filter(
      (fd: any) => fd.member_id === member.id
    );

    const memberFDDetails = memberFDs.map((fd: any) => {
      const start = new Date(fd.start_date);
      const tenure = Number(fd.tenure_months) || 3;
      const maturity = new Date(start);
      maturity.setMonth(maturity.getMonth() + tenure);

      const interest = (Number(fd.amount) * Number(fd.interest_rate) * tenure) / 1200;
      const isMatured = maturity <= today;

      return {
        amount: Number(fd.amount),
        interest_rate: Number(fd.interest_rate),
        tenure_months: Number(fd.tenure_months),
        calculated_interest: interest,
        maturity_amount: Number(fd.amount) + interest,
        status: isMatured ? "MATURED" : "ACTIVE"
      };
    });

    const totalFDMaturity = memberFDDetails.reduce(
      (sum: number, fd: any) => sum + fd.maturity_amount,
      0
    );

    return {
      member_name: member.full_name,
      society_id: member.society_id,
      contribution_total: memberContribution,
      earned_dividends: memberEquityShare,
      fixed_deposits: memberFDDetails,
      fixed_deposits_total_maturity: totalFDMaturity,
      unpaid_installments: unpaidAmount,
      closing_fee: 500,
      disclosure_fee: 100,
      society_fee: 250,
      early_settlement_fee: memberFDDetails.some((fd: any) => fd.status === "ACTIVE")
        ? (memberContribution * 5) / 100
        : 0,
      total_inflow: memberContribution + memberEquityShare + totalFDMaturity,
      settlement_date: new Date().toLocaleDateString("en-GB")
    };
  };

  const selectedMember = selectedMemberId ? members.find(m => m.id === selectedMemberId) : null;
  const settlement = selectedMember ? calculateSettlement(selectedMember) : null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-emerald-600" />
          Settlement Reports
        </h1>
        <p className="text-slate-600">Generate and send settlement reports to members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Search */}
        <Card className="lg:col-span-1 shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Select Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedMemberId === member.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-300 bg-white"
                  }`}
                >
                  <p className="font-bold text-slate-900">{member.full_name}</p>
                  <p className="text-xs text-slate-500">{member.society_id}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settlement Report Preview */}
        {settlement && (
          <Card className="lg:col-span-2 shadow-sm border-emerald-200 bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Settlement Report</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Prepared on {settlement.settlement_date}</p>
                </div>
                <Badge className="bg-emerald-600">Report Ready</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Member Info */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Member Information</p>
                <p className="text-lg font-bold text-slate-900">{settlement.member_name}</p>
                <p className="text-sm text-slate-600 font-mono">{settlement.society_id}</p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase">Contributions</p>
                  <p className="text-xl font-black text-emerald-900 font-mono">
                    ৳{settlement.contribution_total.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-[11px] font-bold text-blue-700 uppercase">Dividends</p>
                  <p className="text-xl font-black text-blue-900 font-mono">
                    ৳{settlement.earned_dividends.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-[11px] font-bold text-purple-700 uppercase">Total Inflow</p>
                  <p className="text-xl font-black text-purple-900 font-mono">
                    ৳{settlement.total_inflow.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </p>
                </div>
              </div>

              {/* Fixed Deposits */}
              {settlement.fixed_deposits.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm font-bold text-slate-900 mb-3">Fixed Deposits at Maturity</p>
                  <div className="space-y-2">
                    {settlement.fixed_deposits.map((fd: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm bg-white p-2 rounded">
                        <span className="text-slate-700">
                          ৳{fd.amount.toLocaleString()} @ {fd.interest_rate}% ({fd.tenure_months}mo)
                        </span>
                        <span className="font-mono font-bold">
                          ৳{fd.maturity_amount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deductions */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm font-bold text-red-900 mb-3">Deductions</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between bg-white p-2 rounded">
                    <span className="text-red-700">Disclosure Fee</span>
                    <span className="font-mono font-bold">৳{settlement.disclosure_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded">
                    <span className="text-red-700">Society Fee</span>
                    <span className="font-mono font-bold">৳{settlement.society_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded">
                    <span className="text-red-700">Unpaid Installments</span>
                    <span className="font-mono font-bold">৳{settlement.unpaid_installments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded">
                    <span className="text-red-700">Closing Fee</span>
                    <span className="font-mono font-bold">৳{settlement.closing_fee.toLocaleString()}</span>
                  </div>
                  {settlement.early_settlement_fee > 0 && (
                    <div className="flex justify-between bg-white p-2 rounded">
                      <span className="text-red-700">Early Settlement Fee (5%)</span>
                      <span className="font-mono font-bold">৳{settlement.early_settlement_fee.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-red-900">
                    <span>Total Deductions</span>
                    <span className="font-mono">৳{(settlement.unpaid_installments + settlement.closing_fee + settlement.disclosure_fee + settlement.society_fee + settlement.early_settlement_fee).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                </div>
              </div>

              {/* Net Payout */}
              <div className="bg-emerald-100 p-6 rounded-lg border-2 border-emerald-400">
                <p className="text-sm font-bold text-emerald-700 uppercase mb-2">Net Settlement Amount Payable</p>
                <p className="text-4xl font-black text-emerald-900 font-mono">
                  ৳{Math.max(0, settlement.total_inflow - (settlement.unpaid_installments + settlement.closing_fee + settlement.disclosure_fee + settlement.society_fee + settlement.early_settlement_fee)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 print:hidden">
                <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
                <Button variant="outline" className="flex-1 gap-2" disabled>
                  <Download className="h-4 w-4" />
                  Send via Email (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!settlement && (
          <Card className="lg:col-span-2 shadow-sm border-slate-200">
            <CardContent className="pt-12 pb-12 text-center">
              <User className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Select a member to view their settlement report</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body, * { background: white !important; }
          .print\\:hidden { display: none !important; }
          .no-print { display: none; }
        }
      `}</style>
    </div>
  );
}
