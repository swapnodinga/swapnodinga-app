"use client"

import { useEffect, useState } from "react";
import { useSociety } from "@/context/SocietyContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Search, Building2, User, Mail, Loader2, Download } from "lucide-react";
import { useLocation } from "wouter";
import { buildSettlementReportHtml, normalizeSettlementReport } from "@shared/settlement-report";

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
  const [deductionsEdit, setDeductionsEdit] = useState<Record<string, { amount: number; selected: boolean }>>({
    unpaid_installments: { amount: 0, selected: true },
    closing_fee: { amount: 500, selected: true },
    disclosure_fee: { amount: 100, selected: true },
    society_fee: { amount: 500, selected: true },
    early_settlement_fee: { amount: 0, selected: true }
  });
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
    // Reset deductions editor
    setDeductionsEdit({
      unpaid_installments: { amount: 0, selected: true },
      closing_fee: { amount: 500, selected: true },
      disclosure_fee: { amount: 100, selected: true },
      society_fee: { amount: 500, selected: true },
      early_settlement_fee: { amount: 0, selected: true }
    });

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
      society_fee: 500,
      early_settlement_fee: memberFDDetails.some((fd: any) => fd.status === "ACTIVE")
        ? (memberContribution * 5) / 100
        : 0,
      total_inflow: memberContribution + memberEquityShare + totalFDMaturity,
      settlement_date: new Date().toLocaleDateString("en-GB")
    };
  };

  const applyDeductionsEdit = (baseSettlement: any) => {
    const result = { ...baseSettlement };
    let totalDed = 0;
    Object.entries(deductionsEdit).forEach(([key, cfg]: [string, any]) => {
      result[key] = cfg.selected ? cfg.amount : 0;
      if (cfg.selected) totalDed += cfg.amount;
    });
    result.total_selected_deductions = totalDed;
    return result;
  };

  const selectedMember = selectedMemberId ? members.find(m => m.id === selectedMemberId) : null;
  const baseSettlement = reportDraft || (selectedMember ? calculateSettlement(selectedMember) : null);
  const settlement = baseSettlement ? applyDeductionsEdit(baseSettlement) : null;
  const report = settlement ? normalizeSettlementReport(settlement) : null;

  const handlePrintReport = () => {
    if (!settlement) return;
    try {
      const html = buildSettlementReportHtml(settlement);
      // Use iframe approach for more reliable printing
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        toast({
          title: "Print Failed",
          description: "Unable to access iframe document",
          variant: "destructive"
        });
        return;
      }
      
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 500);
    } catch (error: any) {
      console.error("Print error:", error);
      toast({
        title: "Print Error",
        description: error.message || "Failed to prepare report for printing",
        variant: "destructive"
      });
    }
  };

  const handleDownloadReport = () => {
    if (!settlement) return;
    const html = buildSettlementReportHtml(settlement);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `settlement-report-${report?.societyId || settlement.society_id || "member"}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

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
      const reportHtml = buildSettlementReportHtml(settlement);
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_email: emailInput.trim(),
          member_name: settlement.member_name,
          email_type: "settlement",
          settlement_data: {
            ...settlement,
            report_html: reportHtml
          }
        })
      });

      // Read response body once as text first
      const responseText = await response.text();
      let data = { message: "Unknown error" };
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        console.error("Response text:", responseText);
        data = { message: responseText || "Server returned invalid response" };
      }

      if (!response.ok) {
        console.error("Email API error response:", { status: response.status, data });
        throw new Error(data?.message || `Failed to send email (Status: ${response.status})`);
      }

      toast({
        title: "Success",
        description: `Settlement report sent to ${emailInput}`,
        variant: "default"
      });

      setShowEmailDialog(false);
      setEmailInput("");
    } catch (error: any) {
      console.error("Email sending error:", error);
      console.error("Full error details:", { error, stack: error.stack });
      toast({
        title: "Error Sending Email",
        description: error.message || "An error occurred while sending the email",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-emerald-600" />
              Settlement Reports
            </h1>
            <p className="text-slate-600 mt-1">Generate, print, download, and email a clean one-page settlement report.</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/admin/members')} className="w-fit">
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 shadow-sm border-slate-200 print:hidden">
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

              <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-1">
                {filteredMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selectedMemberId === member.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-emerald-300 bg-white"
                    }`}
                  >
                    <p className="font-bold text-slate-900">{member.full_name}</p>
                    <p className="text-xs text-slate-500 font-mono">{member.society_id}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {report ? (
            <div className="lg:col-span-3 print:col-span-4">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 md:px-8 py-8 text-white flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">Settlement Report</h2>
                    <p className="text-slate-300 mt-2">Prepared for final settlement review and sharing</p>
                  </div>
                  <Badge className="bg-emerald-500 text-white w-fit">Report Ready</Badge>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Member Information</p>
                      <p className="text-2xl font-black text-slate-900">{report.memberName}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Society ID</p>
                      <p className="text-2xl font-black text-slate-900 font-mono">{report.societyId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-[0.14em]">Contributions</p>
                      <p className="mt-2 text-3xl font-black text-emerald-950 font-mono">{`৳${report.contributionTotal.toLocaleString('en-US')}`}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-[0.14em]">Dividends</p>
                      <p className="mt-2 text-3xl font-black text-blue-950 font-mono">{`৳${report.earnedDividends.toLocaleString('en-US')}`}</p>
                    </div>
                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                      <p className="text-xs font-bold text-violet-700 uppercase tracking-[0.14em]">Total Inflow</p>
                      <p className="mt-2 text-3xl font-black text-violet-950 font-mono">{`৳${report.totalInflow.toLocaleString('en-US')}`}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="bg-red-50 px-5 py-4 border-b border-slate-200">
                      <h3 className="text-lg font-black text-red-900">Deductions</h3>
                    </div>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-slate-200">
                        {report.deductions.map((deduction) => (
                          <tr key={deduction.key} className="hover:bg-slate-50">
                            <td className="px-5 py-4 text-slate-700 font-medium">{deduction.label}</td>
                            <td className="px-5 py-4 text-right font-mono font-bold text-red-700">{`৳${deduction.amount.toLocaleString('en-US')}`}</td>
                          </tr>
                        ))}
                        <tr className="bg-red-50">
                          <td className="px-5 py-4 font-bold text-red-900">Total Deductions</td>
                          <td className="px-5 py-4 text-right font-mono font-black text-red-900 text-lg">{`৳${report.totalDeductions.toLocaleString('en-US')}`}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6">
                    <p className="text-xs font-bold tracking-[0.16em] uppercase text-emerald-700">Net Transfer Amount</p>
                    <p className="mt-2 text-5xl font-black text-emerald-950 font-mono">{`৳${report.netAmount.toLocaleString('en-US')}`}</p>
                    <p className="mt-2 text-sm text-emerald-700">This is the final amount payable after deductions.</p>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row print:hidden">
                    <Button className="flex-1 gap-2 bg-slate-800 hover:bg-slate-900" onClick={handlePrintReport}>
                      <Printer className="h-4 w-4" />
                      Print Report
                    </Button>
                    <Button className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleDownloadReport}>
                      <Download className="h-4 w-4" />
                      Download HTML
                    </Button>
                    <Button
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setShowEmailDialog(true)}
                      disabled={isSendingEmail}
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Send via Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-3 print:col-span-4 flex items-center justify-center">
              <Card className="w-full shadow-sm border-slate-200">
                <CardContent className="py-20 text-center">
                  <User className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 text-lg">Select a member to view their settlement report</p>
                </CardContent>
              </Card>
            </div>
          )}

          {baseSettlement && (
            <div className="lg:col-span-3 print:col-span-4">
              <Card className="shadow-md border-amber-200 bg-amber-50 print:hidden">
                <CardHeader className="pb-3 bg-amber-100 border-b border-amber-200">
                  <CardTitle className="text-amber-900">Customize Deductions</CardTitle>
                  <p className="text-xs text-amber-700 mt-2 font-normal">Select which deductions to include and edit amounts</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {Object.entries(deductionsEdit).map(([key, cfg]: [string, any]) => {
                    const labels: Record<string, string> = {
                      unpaid_installments: "Unpaid Installments",
                      closing_fee: "Closing Fee",
                      disclosure_fee: "Disclosure Fee",
                      society_fee: "Society Fee",
                      early_settlement_fee: "Early Settlement Fee"
                    };
                    return (
                      <div key={key} className="flex items-center gap-3 p-2 bg-white rounded border border-amber-100">
                        <Checkbox
                          checked={cfg.selected}
                          onCheckedChange={(checked) => setDeductionsEdit(prev => ({...prev, [key]: {...prev[key], selected: !!checked}}))}
                        />
                        <span className="flex-1 text-sm font-medium text-slate-700">{labels[key]}</span>
                        <Input type="number" value={cfg.amount} onChange={(e) => setDeductionsEdit(prev => ({...prev, [key]: {...prev[key], amount: Number(e.target.value) || 0}}))} className="w-20 h-8 text-right text-xs" min="0" />
                        <span className="text-xs text-slate-500 w-8">৳</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
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
