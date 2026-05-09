"use client"

import { useEffect, useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Search, Building2, User, Mail, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function SettlementReportPage() {
  const { members, transactions, fixedDeposits } = useSociety();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [reportDraft, setReportDraft] = useState<any | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("settlement_report_draft");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setReportDraft(parsed);
      
      // Use email from draft if available, otherwise lookup from members
      if (parsed.member_email) {
        setEmailInput(parsed.member_email);
      } else if (parsed.member_id) {
        const member = members.find(m => m.id === parsed.member_id);
        if (member?.email) {
          setEmailInput(member.email);
        }
      }
    } catch (error) {
      console.error("Failed to load settlement report draft", error);
    }
  }, [members]);

  // When a member is selected from the left list, generate the settlement report automatically
  useEffect(() => {
    if (!selectedMemberId) return;
    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;
    try {
      const generated = calculateSettlement(member);
      setReportDraft(generated);
      if (member.email) setEmailInput(member.email);
      // scroll to top of page to show report
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error('Failed to auto-generate settlement for selected member', e);
    }
  }, [selectedMemberId, members]);

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
  const settlement = reportDraft || (selectedMember ? calculateSettlement(selectedMember) : null);

  const handleSendEmail = async () => {
    if (!emailInput.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (!settlement) {
      toast({
        title: "No Settlement Data",
        description: "Please generate a settlement report first",
        variant: "destructive"
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_email: emailInput.trim(),
          member_name: settlement.member_name,
          email_type: "settlement",
          settlement_data: settlement
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send email");
      }

      toast({
        title: "Success",
        description: `Settlement report sent to ${emailInput}`,
        variant: "default"
      });

      setShowEmailDialog(false);
    } catch (error: any) {
      toast({
        title: "Error Sending Email",
        description: error.message || "An error occurred while sending the email",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Calculate total deductions
  const calculateTotalDeductions = (s: any) => {
    return (
      s.unpaid_installments +
      s.closing_fee +
      s.disclosure_fee +
      s.society_fee +
      s.early_settlement_fee
    );
  };

  const totalDeductions = settlement ? calculateTotalDeductions(settlement) : 0;
  const netAmount = settlement
    ? Math.max(0, settlement.total_inflow - totalDeductions)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Building2 className="h-8 w-8 text-emerald-400" />
              Settlement Reports
            </h1>
            <p className="text-slate-400 mt-1">Generate and send settlement reports to members</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/admin/members')}
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
          >
            ← Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Member Search Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-0 bg-white sticky top-8">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                <CardTitle className="text-lg text-slate-900">Select Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300"
                  />
                </div>

                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {filteredMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedMemberId === member.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-emerald-300 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-bold text-slate-900 text-sm">{member.full_name}</p>
                      <p className="text-xs text-slate-500 font-mono">{member.society_id}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Professional Settlement Report */}
          {settlement && (
            <div className="lg:col-span-3">
              <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border-0">
                {/* Report Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-12 text-white">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-4xl font-black mb-2">Settlement Report</h2>
                      <p className="text-slate-300 text-sm">Financial Settlement & Account Closure</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-block bg-emerald-500/20 border border-emerald-400 rounded-lg px-4 py-2">
                        <p className="text-emerald-300 text-xs font-bold uppercase">Ready to Process</p>
                        <p className="text-emerald-200 text-lg font-black">{settlement.settlement_date}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                <div className="p-8 space-y-8">
                  {/* Member Details Section */}
                  <div className="border-b-2 border-slate-200 pb-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Member Information</h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold mb-1">Full Name</p>
                        <p className="text-2xl font-black text-slate-900">{settlement.member_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold mb-1">Society ID</p>
                        <p className="text-2xl font-black text-slate-900 font-mono">{settlement.society_id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Inflow Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-emerald-500" />
                      Inflow Details
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-emerald-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-left font-bold text-slate-900">Description</th>
                            <th className="px-6 py-4 text-right font-bold text-slate-900">Amount (৳)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-700">Member Contributions</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                              {settlement.contribution_total.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-700">Dividend Earnings</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                              {settlement.earned_dividends.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </td>
                          </tr>
                          {settlement.fixed_deposits.length > 0 && (
                            <tr className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-slate-700">Fixed Deposits (Maturity Value)</td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                {settlement.fixed_deposits_total_maturity.toLocaleString(undefined, {maximumFractionDigits: 0})}
                              </td>
                            </tr>
                          )}
                          <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                            <td className="px-6 py-4 font-bold text-emerald-900">Total Inflow</td>
                            <td className="px-6 py-4 text-right font-mono font-black text-emerald-900 text-lg">
                              {settlement.total_inflow.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Fixed Deposits Details (if any) */}
                  {settlement.fixed_deposits.length > 0 && (
                    <div className="space-y-4 bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Fixed Deposit Breakdown</h3>
                      <div className="space-y-2">
                        {settlement.fixed_deposits.map((fd: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm bg-white p-3 rounded border border-blue-100">
                            <span className="text-slate-700">
                              {fd.amount.toLocaleString()} @ {fd.interest_rate}% for {fd.tenure_months} months ({fd.status})
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              ৳{fd.maturity_amount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deductions Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-red-500" />
                      Deductions
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-red-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-left font-bold text-slate-900">Description</th>
                            <th className="px-6 py-4 text-right font-bold text-slate-900">Amount (৳)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {settlement.unpaid_installments > 0 && (
                            <tr className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-red-700 font-medium">Unpaid Installments</td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-red-700">
                                {settlement.unpaid_installments.toLocaleString()}
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-red-700 font-medium">Disclosure Fee</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-red-700">
                              {settlement.disclosure_fee.toLocaleString()}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-red-700 font-medium">Society Fee</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-red-700">
                              {settlement.society_fee.toLocaleString()}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-red-700 font-medium">Closing Fee</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-red-700">
                              {settlement.closing_fee.toLocaleString()}
                            </td>
                          </tr>
                          {settlement.early_settlement_fee > 0 && (
                            <tr className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-red-700 font-medium">Early Settlement Fee (5%)</td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-red-700">
                                {settlement.early_settlement_fee.toLocaleString(undefined, {maximumFractionDigits: 0})}
                              </td>
                            </tr>
                          )}
                          <tr className="bg-red-50 border-t-2 border-red-200">
                            <td className="px-6 py-4 font-bold text-red-900">Total Deductions</td>
                            <td className="px-6 py-4 text-right font-mono font-black text-red-900 text-lg">
                              {totalDeductions.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Net Settlement Amount */}
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-lg p-8">
                    <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest mb-3">Net Settlement Amount Payable</p>
                    <p className="text-5xl font-black text-emerald-900 font-mono">
                      ৳{netAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </p>
                    <p className="text-emerald-700 text-xs mt-2">Amount after all deductions</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 print:hidden pt-4 border-t border-slate-200">
                    <Button 
                      onClick={() => window.print()}
                      className="flex-1 gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 h-auto rounded-lg"
                    >
                      <Printer className="h-5 w-5" />
                      Print & Download
                    </Button>
                    <Button 
                      onClick={() => setShowEmailDialog(true)}
                      disabled={isSendingEmail}
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 h-auto rounded-lg disabled:opacity-50"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-5 w-5" />
                          Send Report
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Report Footer */}
                <div className="print:block hidden bg-slate-100 border-t border-slate-300 px-8 py-4 text-center text-xs text-slate-600">
                  <p>This is an official settlement report. Please retain for your records.</p>
                  <p>Generated on {settlement.settlement_date}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!settlement && (
            <div className="lg:col-span-3 flex items-center justify-center">
              <div className="bg-white shadow-xl rounded-2xl w-full py-20 text-center border-0">
                <User className="h-20 w-20 mx-auto text-slate-300 mb-6" />
                <p className="text-slate-500 text-xl font-semibold">Select a member to generate their settlement report</p>
                <p className="text-slate-400 text-sm mt-2">The professional report will appear here</p>
              </div>
            </div>
          )}
        </div>

      {/* Email Send Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Settlement Report</DialogTitle>
            <DialogDescription>
              Enter the email address to send the settlement report to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Recipient Email
              </label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isSendingEmail}
                className="w-full"
              />
            </div>
            <p className="text-xs text-slate-500">
              The settlement report will be sent to this email address with a professional HTML format.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEmailDialog(false)}
                disabled={isSendingEmail}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
