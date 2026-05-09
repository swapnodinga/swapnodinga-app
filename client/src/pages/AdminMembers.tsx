import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useSociety } from '../context/SocietyContext';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CheckCircle, UserPlus, ShieldAlert, ShieldOff, ShieldCheck, Calculator, Loader2, X } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminMembers() {
  const { members, approveMember, setMemberStatus, transactions, fixedDeposits } = useSociety();
  const [, setLocation] = useLocation();
  const [settlementModal, setSettlementModal] = useState<any>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [selectedDeductions, setSelectedDeductions] = useState<Record<string, boolean>>({
    unpaid_installments: true,
    closing_fee: true,
    disclosure_fee: false,
    society_fee: false,
    early_exit_penalty: false
  });
  const [deductionAmounts, setDeductionAmounts] = useState<Record<string, number>>({
    unpaid_installments: 0,
    closing_fee: 0,
    disclosure_fee: 0,
    society_fee: 0,
    early_exit_penalty: 0
  });

  const resetSelectedDeductions = () => {
    setSelectedDeductions({
      unpaid_installments: true,
      closing_fee: true,
      disclosure_fee: false,
      society_fee: false,
      early_exit_penalty: false
    });
    setDeductionAmounts({
      unpaid_installments: 0,
      closing_fee: 0,
      disclosure_fee: 0,
      society_fee: 0,
      early_exit_penalty: 0
    });
  };

  /**
   * IMPROVED FILTERING LOGIC
   * We treat 'null', 'undefined', or empty status as 'pending' to ensure 
   * no registered member is hidden from the admin.
   */
  const pendingMembers = members.filter(m => {
    const status = (m.status || 'pending').toLowerCase().trim();
    return status === 'pending' || status === 'waiting' || status === 'new';
  });

  const activeMembers = members.filter(m => {
    const status = (m.status || '').toLowerCase().trim();
    return status === 'active' || status === 'approved';
  });

  const frozenMembers = members.filter(m => (m.status || '').toLowerCase().trim() === 'frozen');
  const deactivatedMembers = members.filter(m => (m.status || '').toLowerCase().trim() === 'deactivated');

  // Client-side settlement preview calculation
  const calculateSettlementPreview = (member: any) => {
    try {
      // 1. Member contribution (approved installments)
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

      // 4. Calculate realized interest from fixed deposits
      let totalRealizedInterest = 0;
      const today = new Date();

      (fixedDeposits || []).forEach((fd: any) => {
        try {
          const start = new Date(fd.start_date);
          const tenure = Number(fd.tenure_months) || 3;
          const maturity = new Date(start);
          maturity.setMonth(maturity.getMonth() + tenure);

          if (maturity <= today) {
            const interest = (Number(fd.amount) * Number(fd.interest_rate) * tenure) / 1200;
            totalRealizedInterest += interest;
          }
        } catch (e) {
          console.log("Error processing FD:", e);
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
        const maturityAmount = Number(fd.amount) + interest;

        return {
          id: fd.id,
          amount: Number(fd.amount),
          interest_rate: Number(fd.interest_rate),
          tenure_months: Number(fd.tenure_months),
          start_date: fd.start_date,
          status: isMatured ? "MATURED" : "ACTIVE",
          calculated_interest: interest,
          maturity_amount: isMatured ? maturityAmount : Number(fd.amount),
          maturity_date: maturity.toISOString().split("T")[0]
        };
      });

      // 7. Deductions
      const CLOSING_FEE = 500;
      const DISCLOSURE_FEE = 100;
      const SOCIETY_FEE = 250;
      const EARLY_EXIT_PENALTY_PERCENT = 5;

      const hasActiveFDs = memberFDDetails.some((fd: any) => fd.status === "ACTIVE");
      const earlyExitPenalty = hasActiveFDs
        ? (memberContribution * EARLY_EXIT_PENALTY_PERCENT) / 100
        : 0;

      const totalDeductions = unpaidAmount + CLOSING_FEE + DISCLOSURE_FEE + SOCIETY_FEE + earlyExitPenalty;

      // 8. Net transfer amount
      const totalFDMaturity = memberFDDetails.reduce(
        (sum: number, fd: any) => sum + fd.maturity_amount,
        0
      );
      const netTransferAmount =
        memberContribution + memberEquityShare + totalFDMaturity - totalDeductions;

      return {
        member_id: member.id,
        member_email: member.email,
        member_name: member.full_name,
        society_id: member.society_id,
        contribution_total: memberContribution,
        earned_dividends: memberEquityShare,
        fixed_deposits: memberFDDetails,
        fixed_deposits_total_maturity: totalFDMaturity,
        deductions: {
          unpaid_installments: unpaidAmount,
          closing_fee: CLOSING_FEE,
          disclosure_fee: DISCLOSURE_FEE,
          society_fee: SOCIETY_FEE,
          early_exit_penalty: earlyExitPenalty,
          total: totalDeductions
        },
        calculated_interest: memberEquityShare,
        net_transfer_amount: Math.max(0, netTransferAmount),
        summary: {
          inflow: memberContribution + memberEquityShare + totalFDMaturity,
          outflow: totalDeductions,
          net_payout: Math.max(0, netTransferAmount)
        }
      };
    } catch (err: any) {
      console.error("Settlement calculation error:", err);
      throw err;
    }
  };

  const handleSettlementClick = async (member: any) => {
    setSettlementLoading(true);
    try {
      const preview = calculateSettlementPreview(member);
      setSelectedDeductions({
        unpaid_installments: true,
        closing_fee: true,
        disclosure_fee: true,
        society_fee: true,
        early_exit_penalty: preview.deductions.early_exit_penalty > 0
      });
      setDeductionAmounts({
        unpaid_installments: preview.deductions.unpaid_installments,
        closing_fee: preview.deductions.closing_fee,
        disclosure_fee: preview.deductions.disclosure_fee,
        society_fee: preview.deductions.society_fee,
        early_exit_penalty: preview.deductions.early_exit_penalty
      });
      setSettlementModal(preview);
    } catch (err) {
      console.error("Settlement preview failed:", err);
      alert("Failed to calculate settlement preview: " + (err as any).message);
    } finally {
      setSettlementLoading(false);
    }
  };

  const getSelectedDeductionsTotal = () => (
    (selectedDeductions.unpaid_installments ? deductionAmounts.unpaid_installments : 0) +
    (selectedDeductions.closing_fee ? deductionAmounts.closing_fee : 0) +
    (selectedDeductions.disclosure_fee ? deductionAmounts.disclosure_fee : 0) +
    (selectedDeductions.society_fee ? deductionAmounts.society_fee : 0) +
    (selectedDeductions.early_exit_penalty ? deductionAmounts.early_exit_penalty : 0)
  );

  const handleGenerateReport = () => {
    if (!settlementModal) return;

    const deductions = {
      early_settlement_deduction_fee: {
        selected: selectedDeductions.disclosure_fee,
        amount: deductionAmounts.disclosure_fee
      },
      society_fee: {
        selected: selectedDeductions.society_fee,
        amount: deductionAmounts.society_fee
      },
      unpaid_installments: {
        selected: selectedDeductions.unpaid_installments,
        amount: deductionAmounts.unpaid_installments
      },
      closing_fee: {
        selected: selectedDeductions.closing_fee,
        amount: deductionAmounts.closing_fee
      },
      early_settlement_fee: {
        selected: selectedDeductions.early_exit_penalty,
        amount: deductionAmounts.early_exit_penalty
      }
    };

    const totalDeductions = getSelectedDeductionsTotal();
    const payload = {
      source: "settlement-modal",
      generated_at: new Date().toISOString(),
      member_id: settlementModal.member_id,
      member_email: settlementModal.member_email,
      member_name: settlementModal.member_name,
      society_id: settlementModal.society_id,
      contribution_total: settlementModal.contribution_total,
      earned_dividends: settlementModal.earned_dividends,
      fixed_deposits: settlementModal.fixed_deposits,
      fixed_deposits_total_maturity: settlementModal.fixed_deposits_total_maturity,
      total_inflow: settlementModal.summary.inflow,
      deductions,
      total_selected_deductions: totalDeductions,
      net_settlement_amount: Math.max(0, settlementModal.summary.inflow - totalDeductions)
    };

    localStorage.setItem("settlement_report_draft", JSON.stringify(payload));
    setSettlementModal(null);
    resetSelectedDeductions();
    setLocation("/admin/settlement-reports");
  };

  const MemberTable = ({ data, showApprove = false, showStatusActions = false, showSettlement = false }: { data: any[], showApprove?: boolean, showStatusActions?: boolean, showSettlement?: boolean }) => (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold">Member ID</TableHead>
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              {showApprove && <TableHead className="font-bold text-right">Action</TableHead>}
              {showStatusActions && <TableHead className="font-bold text-right">Action</TableHead>}
              {showSettlement && <TableHead className="font-bold text-right">Settlement</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(showApprove || showStatusActions || showSettlement) ? 5 : 4} className="text-center py-12 text-slate-400">
                  <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No members found in this category.</p>
                </TableCell>
              </TableRow>
            ) : (
              data.map((member) => (
                <TableRow key={member.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-mono text-xs font-bold text-emerald-700">
                    {member.society_id || 'PENDING'}
                  </TableCell>
                  <TableCell className="font-medium">{member.full_name || member.name}</TableCell>
                  <TableCell className="text-slate-500">{member.email}</TableCell>
                  <TableCell>
                    <Badge 
                      className="capitalize"
                      variant={
                        (member.status || '').toLowerCase() === 'active' || 
                        (member.status || '').toLowerCase() === 'approved' 
                        ? 'default' : 'secondary'
                      }
                    >
                      {member.status || 'pending'}
                    </Badge>
                  </TableCell>
                  {showApprove && (
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => approveMember(member.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 h-8 gap-2"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                    </TableCell>
                  )}
                  {showStatusActions && (
                    <TableCell className="text-right space-x-2">
                      {['frozen', 'deactivated'].includes(String(member.status || '').toLowerCase()) ? (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={async () => {
                            try {
                              await setMemberStatus(member.id, 'active')
                            } catch (err) {
                              console.error("Reactivate failed:", err)
                              alert("Failed to reactivate member: " + (err as any).message)
                            }
                          }}
                          className="h-8 gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <ShieldCheck className="h-4 w-4" /> Reactivate
                        </Button>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                await setMemberStatus(member.id, 'frozen')
                              } catch (err) {
                                console.error("Freeze failed:", err)
                                alert("Failed to freeze member: " + (err as any).message)
                              }
                            }}
                            className="h-8 gap-2"
                          >
                            <ShieldAlert className="h-4 w-4" /> Freeze
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                await setMemberStatus(member.id, 'deactivated')
                              } catch (err) {
                                console.error("Deactivate failed:", err)
                                alert("Failed to deactivate member: " + (err as any).message)
                              }
                            }}
                            className="h-8 gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                          >
                            <ShieldOff className="h-4 w-4" /> Deactivate
                          </Button>
                        </>
                      )}
                    </TableCell>
                  )}
                  {showSettlement && (
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={settlementLoading}
                        onClick={() => handleSettlementClick(member)}
                        className="h-8 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        {settlementLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Calculator className="h-4 w-4" />
                        )}
                        Settlement
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Users className="h-7 w-7 text-emerald-600" /> 
          Member Management
        </h2>
        <p className="text-slate-500 text-sm">Approve new applications and manage existing society members.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="pending" className="rounded-lg px-6">
            Pending Requests ({pendingMembers.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg px-6">
            Active Members ({activeMembers.length})
          </TabsTrigger>
          <TabsTrigger value="settlement" className="rounded-lg px-6">
            Settlement
          </TabsTrigger>
          <TabsTrigger value="suspended" className="rounded-lg px-6">
            Frozen / Deactivated ({frozenMembers.length + deactivatedMembers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <MemberTable data={pendingMembers} showApprove={true} />
        </TabsContent>

        <TabsContent value="active">
          <MemberTable data={activeMembers} showStatusActions={true} />
        </TabsContent>

        <TabsContent value="settlement">
          <MemberTable data={activeMembers} showSettlement={true} />
        </TabsContent>

        <TabsContent value="suspended">
          <MemberTable data={[...frozenMembers, ...deactivatedMembers]} showStatusActions={true} />
        </TabsContent>
      </Tabs>

      {/* Settlement Preview Modal - Improved */}
      {settlementModal && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <Card className="w-full max-w-2xl h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] shadow-2xl border-emerald-200 flex flex-col overflow-hidden">
            <CardHeader className="shrink-0 border-b py-4 sm:py-5 flex flex-row items-start justify-between bg-gradient-to-r from-emerald-50 to-blue-50">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">Settlement Preview</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  {settlementModal.member_name} ({settlementModal.society_id})
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSettlementModal(null);
                  resetSelectedDeductions();
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 space-y-4 overflow-y-auto py-4 sm:py-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 p-3 sm:p-4 rounded-lg border border-emerald-200">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase">Contributions</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-900 font-mono leading-none">
                    ৳{settlementModal.contribution_total.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                  <p className="text-[11px] font-bold text-blue-700 uppercase">Dividends</p>
                  <p className="text-xl sm:text-2xl font-black text-blue-900 font-mono leading-none">
                    ৳{settlementModal.earned_dividends.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
                  <p className="text-[11px] font-bold text-purple-700 uppercase">Inflow Total</p>
                  <p className="text-xl sm:text-2xl font-black text-purple-900 font-mono leading-none">
                    ৳{settlementModal.summary.inflow.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </p>
                </div>
              </div>

              {/* Fixed Deposits */}
              {settlementModal.fixed_deposits && settlementModal.fixed_deposits.length > 0 && (
                <Card className="bg-slate-50 border-slate-200">
                  <CardHeader className="py-3 pb-2">
                    <CardTitle className="text-sm font-bold">Fixed Deposits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-3">
                    {settlementModal.fixed_deposits.map((fd: any, i: number) => (
                      <div key={i} className="flex justify-between items-center gap-3 bg-white p-2.5 rounded border border-slate-200">
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800">
                            ৳{fd.amount.toLocaleString()} @ {fd.interest_rate}% for {fd.tenure_months}mo
                          </p>
                          <p className="text-xs text-slate-500">
                            Status: <Badge variant="outline" className="text-[9px]">{fd.status}</Badge>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Interest</p>
                          <p className="text-base sm:text-lg font-black text-emerald-600 leading-none">
                            ৳{fd.calculated_interest.toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2.5 flex justify-between items-center font-bold">
                      <span className="text-slate-700">FD Maturity Total</span>
                      <span className="text-base sm:text-lg font-mono text-slate-900">
                        ৳{settlementModal.fixed_deposits_total_maturity.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Deductions - SELECTABLE */}
              <Card className="bg-red-50 border-red-200">
                <CardHeader className="py-3 pb-2">
                  <CardTitle className="text-sm font-bold text-red-900">Deductions (Admin Select)</CardTitle>
                  <p className="text-xs text-red-700 mt-1">Check/uncheck and edit the amount for each fee</p>
                </CardHeader>
                <CardContent className="space-y-2.5 pb-4">
                  {/* Disclosure Fee */}
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded border border-red-100 hover:bg-red-50/50 transition-colors">
                    <Checkbox
                      id="disclosure"
                      checked={selectedDeductions.disclosure_fee}
                      onCheckedChange={(checked) =>
                        setSelectedDeductions(prev => ({
                          ...prev,
                          disclosure_fee: !!checked
                        }))
                      }
                    />
                    <div className="flex-1">
                      <label htmlFor="disclosure" className="text-sm font-semibold text-slate-800 cursor-pointer leading-none">
                        Early Settlement Deduction Fee
                      </label>
                      <p className="text-[11px] text-slate-500">25% was deducted from total amount (installment + dividends)</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={deductionAmounts.disclosure_fee}
                      onChange={(e) => setDeductionAmounts(prev => ({ ...prev, disclosure_fee: Number(e.target.value) || 0 }))}
                      className="w-24 sm:w-28 h-8 sm:h-9 text-right font-mono"
                    />
                  </div>

                  {/* Society Fee */}
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded border border-red-100 hover:bg-red-50/50 transition-colors">
                    <Checkbox
                      id="society"
                      checked={selectedDeductions.society_fee}
                      onCheckedChange={(checked) =>
                        setSelectedDeductions(prev => ({
                          ...prev,
                          society_fee: !!checked
                        }))
                      }
                    />
                    <div className="flex-1">
                      <label htmlFor="society" className="text-sm font-semibold text-slate-800 cursor-pointer leading-none">
                        Society Fee
                      </label>
                      <p className="text-[11px] text-slate-500">Society administration adjustment</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={deductionAmounts.society_fee}
                      onChange={(e) => setDeductionAmounts(prev => ({ ...prev, society_fee: Number(e.target.value) || 0 }))}
                      className="w-24 sm:w-28 h-8 sm:h-9 text-right font-mono"
                    />
                  </div>

                  {/* Unpaid Installments */}
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded border border-red-100 hover:bg-red-50/50 transition-colors">
                    <Checkbox
                      id="unpaid"
                      checked={selectedDeductions.unpaid_installments}
                      onCheckedChange={(checked) =>
                        setSelectedDeductions(prev => ({
                          ...prev,
                          unpaid_installments: !!checked
                        }))
                      }
                    />
                    <div className="flex-1">
                      <label htmlFor="unpaid" className="text-sm font-semibold text-slate-800 cursor-pointer leading-none">
                        Unpaid Installments
                      </label>
                      <p className="text-[11px] text-slate-500">From pending/rejected payments</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={deductionAmounts.unpaid_installments}
                      onChange={(e) => setDeductionAmounts(prev => ({ ...prev, unpaid_installments: Number(e.target.value) || 0 }))}
                      className="w-24 sm:w-28 h-8 sm:h-9 text-right font-mono"
                    />
                  </div>

                  {/* Closing Fee */}
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded border border-red-100 hover:bg-red-50/50 transition-colors">
                    <Checkbox
                      id="closing"
                      checked={selectedDeductions.closing_fee}
                      onCheckedChange={(checked) =>
                        setSelectedDeductions(prev => ({
                          ...prev,
                          closing_fee: !!checked
                        }))
                      }
                    />
                    <div className="flex-1">
                      <label htmlFor="closing" className="text-sm font-semibold text-slate-800 cursor-pointer leading-none">
                        Closing Fee
                      </label>
                      <p className="text-[11px] text-slate-500">Account closure administrative fee</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={deductionAmounts.closing_fee}
                      onChange={(e) => setDeductionAmounts(prev => ({ ...prev, closing_fee: Number(e.target.value) || 0 }))}
                      className="w-24 sm:w-28 h-8 sm:h-9 text-right font-mono"
                    />
                  </div>

                  {/* Early Settlement Fee */}
                  {settlementModal.deductions.early_exit_penalty > 0 && (
                    <div className="flex items-center gap-3 p-2.5 bg-white rounded border border-red-100 hover:bg-red-50/50 transition-colors">
                      <Checkbox
                        id="penalty"
                        checked={selectedDeductions.early_exit_penalty}
                        onCheckedChange={(checked) =>
                          setSelectedDeductions(prev => ({
                            ...prev,
                            early_exit_penalty: !!checked
                          }))
                        }
                      />
                      <div className="flex-1">
                        <label htmlFor="penalty" className="text-sm font-semibold text-slate-800 cursor-pointer leading-none">
                          Early Settlement Fee (5%)
                        </label>
                        <p className="text-[11px] text-slate-500">Applied when active FDs exist</p>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={deductionAmounts.early_exit_penalty}
                        onChange={(e) => setDeductionAmounts(prev => ({ ...prev, early_exit_penalty: Number(e.target.value) || 0 }))}
                        className="w-24 sm:w-28 h-8 sm:h-9 text-right font-mono"
                      />
                    </div>
                  )}

                  {/* Total Deductions */}
                  <div className="border-t pt-2.5 flex justify-between items-center font-bold bg-red-100/50 p-2.5 rounded">
                    <span className="text-red-900">Total Selected Deductions</span>
                    <span className="font-mono text-base sm:text-lg text-red-700">
                      ৳{getSelectedDeductionsTotal().toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Net Payout - UPDATED */}
              <div className="bg-emerald-100 p-4 sm:p-5 rounded-lg border-2 border-emerald-400">
                <p className="text-sm font-bold text-emerald-700 uppercase mb-2">Net Transfer Amount</p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-900 font-mono leading-none">
                  ৳{Math.max(0, 
                    settlementModal.summary.inflow - getSelectedDeductionsTotal()
                  ).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </p>
                <p className="text-xs text-emerald-600 mt-2">
                  This is a preview only. No transaction has been recorded yet.
                </p>
              </div>
            </CardContent>

            <div className="shrink-0 border-t bg-white p-3 sm:p-4">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSettlementModal(null);
                    resetSelectedDeductions();
                  }}
                >
                  Close
                </Button>
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleGenerateReport}
                >
                  Generate Report
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}