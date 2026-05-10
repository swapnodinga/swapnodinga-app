type DeductionEntry = {
  key: string;
  label: string;
  amount: number;
  selected: boolean;
};

type SettlementInput = Record<string, any>;

const formatAmount = (value: number) =>
  `৳${Math.round(Number(value || 0)).toLocaleString('en-US')}`;

const deductionLabels: Record<string, string> = {
  unpaid_installments: 'Unpaid Installments',
  closing_fee: 'Closing Fee',
  disclosure_fee: 'Disclosure Fee',
  society_fee: 'Society Fee',
  early_exit_penalty: 'Early Settlement Fee',
  early_settlement_fee: 'Early Settlement Fee',
  early_settlement_deduction_fee: 'Early Settlement Deduction Fee',
};

const getDeductionEntries = (settlement: SettlementInput): DeductionEntry[] => {
  const fromNested = settlement.deductions && typeof settlement.deductions === 'object'
    ? Object.entries(settlement.deductions).map(([key, value]: [string, any]) => ({
        key,
        label: deductionLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
        amount: Number(value?.amount || 0),
        selected: Boolean(value?.selected),
      }))
    : [];

  if (fromNested.length > 0) return fromNested.filter((entry) => entry.selected || entry.amount > 0);

  const directMap: Array<[string, string, number, boolean]> = [
    ['unpaid_installments', deductionLabels.unpaid_installments, Number(settlement.unpaid_installments || 0), Number(settlement.unpaid_installments || 0) > 0],
    ['closing_fee', deductionLabels.closing_fee, Number(settlement.closing_fee || 0), Number(settlement.closing_fee || 0) > 0],
    ['disclosure_fee', deductionLabels.disclosure_fee, Number(settlement.disclosure_fee || 0), Number(settlement.disclosure_fee || 0) > 0],
    ['society_fee', deductionLabels.society_fee, Number(settlement.society_fee || 0), Number(settlement.society_fee || 0) > 0],
    ['early_settlement_fee', deductionLabels.early_settlement_fee, Number(settlement.early_settlement_fee || 0), Number(settlement.early_settlement_fee || 0) > 0],
  ];

  return directMap
    .map(([key, label, amount, selected]) => ({ key, label, amount, selected }))
    .filter((entry) => entry.amount > 0);
};

export const normalizeSettlementReport = (settlement: SettlementInput) => {
  const deductions = getDeductionEntries(settlement);
  const totalDeductions = Number(
    settlement.total_selected_deductions ??
    settlement.deductions?.total ??
    deductions.reduce((sum, entry) => sum + Number(entry.amount || 0), 0) ??
    0
  );
  const totalInflow = Number(settlement.total_inflow || 0);
  const netAmount = Number(
    settlement.net_settlement_amount ??
    settlement.net_transfer_amount ??
    Math.max(0, totalInflow - totalDeductions)
  );

  return {
    memberName: settlement.member_name || settlement.memberName || 'Member',
    societyId: settlement.society_id || settlement.societyId || 'N/A',
    settlementDate: settlement.settlement_date || settlement.generated_at || new Date().toLocaleDateString('en-GB'),
    contributionTotal: Number(settlement.contribution_total || 0),
    earnedDividends: Number(settlement.earned_dividends || 0),
    fixedDepositsTotal: Number(settlement.fixed_deposits_total_maturity || 0),
    totalInflow,
    deductions,
    totalDeductions,
    netAmount,
  };
};

export const buildSettlementReportHtml = (settlement: SettlementInput) => {
  const report = normalizeSettlementReport(settlement);
  const deductionRows = report.deductions.length > 0
    ? report.deductions.map((entry) => `
      <tr>
        <td>${entry.label}</td>
        <td class="amount">${formatAmount(entry.amount)}</td>
      </tr>`).join('')
    : `
      <tr>
        <td colspan="2" class="muted">No deductions selected</td>
      </tr>`;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Settlement Report - ${report.memberName}</title>
    <style>
      :root {
        --bg: #f8fafc;
        --ink: #0f172a;
        --muted: #64748b;
        --line: #dbe4ef;
        --green: #059669;
        --green-soft: #ecfdf5;
        --red: #b91c1c;
        --red-soft: #fef2f2;
        --blue: #1d4ed8;
        --blue-soft: #eff6ff;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans', 'Helvetica Neue', Arial, sans-serif; }
      body { padding: 20px; }
      .page { max-width: 900px; margin: 0 auto; background: white; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08); }
      .header { padding: 28px 32px; background: linear-gradient(135deg, #f8fafc, #ecfeff); border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .header h1 { margin: 0; font-size: 30px; line-height: 1.1; letter-spacing: -0.02em; }
      .header p { margin: 8px 0 0; color: var(--muted); font-size: 14px; }
      .status { display: inline-block; padding: 10px 16px; border-radius: 999px; background: var(--green-soft); color: var(--green); font-weight: 700; font-size: 13px; white-space: nowrap; }
      .content { padding: 28px 32px 32px; }
      .info { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; padding: 18px; border: 1px solid var(--line); border-radius: 14px; background: #f8fafc; margin-bottom: 18px; }
      .label { color: var(--muted); font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 8px; }
      .value { font-size: 20px; font-weight: 800; }
      .mono { font-family: 'Segoe UI', 'Noto Sans', 'Courier New', monospace; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 18px 0; }
      .card { border: 1px solid var(--line); border-radius: 14px; padding: 18px; }
      .card h3 { margin: 0 0 8px; font-size: 13px; letter-spacing: .02em; text-transform: uppercase; }
      .card .amount { font-size: 26px; font-weight: 900; }
      .contrib { background: #f0fdf4; border-color: #a7f3d0; }
      .dividend { background: #eff6ff; border-color: #bfdbfe; }
      .total { background: #faf5ff; border-color: #e9d5ff; }
      .section { margin-top: 20px; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
      .section-header { padding: 14px 18px; background: var(--red-soft); color: var(--red); font-size: 16px; font-weight: 800; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 14px 18px; border-bottom: 1px solid var(--line); }
      tr:last-child td { border-bottom: none; }
      .amount { text-align: right; font-weight: 800; }
      .deduction-row td { color: #991b1b; }
      .summary { margin-top: 20px; border-radius: 16px; padding: 22px; border: 2px solid #34d399; background: linear-gradient(135deg, #ecfdf5, #d1fae5); }
      .summary .title { color: var(--green); font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 10px; }
      .summary .amount { font-size: 42px; font-weight: 900; color: #064e3b; }
      .footer { padding: 18px 32px 26px; color: var(--muted); font-size: 12px; border-top: 1px solid var(--line); text-align: center; }
      .muted { color: var(--muted); text-align: center; }
      @media print {
        @page { size: A4; margin: 10mm; }
        body { padding: 0; background: white; }
        .page { box-shadow: none; border: none; border-radius: 0; }
        .header { background: white; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="header">
        <div>
          <h1>Settlement Report</h1>
          <p>Cooperative Society member settlement summary</p>
        </div>
        <div class="status">Prepared on ${report.settlementDate}</div>
      </header>

      <div class="content">
        <div class="info">
          <div>
            <div class="label">Member Information</div>
            <div class="value">${report.memberName}</div>
          </div>
          <div>
            <div class="label">Society ID</div>
            <div class="value mono">${report.societyId}</div>
          </div>
        </div>

        <section class="grid" aria-label="Settlement summary">
          <article class="card contrib">
            <h3>Contributions</h3>
            <div class="amount mono">${formatAmount(report.contributionTotal)}</div>
          </article>
          <article class="card dividend">
            <h3>Dividends</h3>
            <div class="amount mono">${formatAmount(report.earnedDividends)}</div>
          </article>
          <article class="card total">
            <h3>Total Inflow</h3>
            <div class="amount mono">${formatAmount(report.totalInflow)}</div>
          </article>
        </section>

        <section class="section">
          <div class="section-header">Deductions</div>
          <table>
            <tbody>
              ${deductionRows}
              <tr>
                <td><strong>Total Deductions</strong></td>
                <td class="amount mono"><strong>${formatAmount(report.totalDeductions)}</strong></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="summary">
          <div class="title">Net Transfer Amount</div>
          <div class="amount mono">${formatAmount(report.netAmount)}</div>
          <div style="margin-top:8px; color:#065f46; font-size:13px;">This is the final payable amount after deductions.</div>
        </section>

        <p style="margin:18px 4px 0; padding:14px 16px; border:1px dashed var(--line); border-radius:12px; color:var(--muted); font-size:13px; line-height:1.6; text-align:center; background:#fafafa;">
          This is sytem auto generated report. please communicate with swapnodinga admin, if you have anything mismatch
        </p>
      </div>

      <footer class="footer">
        <div>This is an official settlement report for ${report.memberName}.</div>
        <div>Generated on ${new Date().toLocaleString('en-GB')}</div>
      </footer>
    </main>
  </body>
</html>`;
};