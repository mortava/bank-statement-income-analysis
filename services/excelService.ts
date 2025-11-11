import type { AnalysisResult } from '../types';

// This assumes XLSX is available globally from the CDN script in index.html
declare const XLSX: any;

export function createExcelWorkbook(result: AnalysisResult): void {
  const wb = XLSX.utils.book_new();
  const header = [["TRACE AOS RESULTS (BETA - RESULTS) traceaos.com"]];
  const blankRow = [[]];

  // Sheet 1 (New): FINDINGS REPORT
  // This sheet contains the markdown summary from the webpage.
  const reportContent = result.markdownSummary || 'Summary not available.';
  const reportLines = reportContent.split('\n').map(line => [line]);
  const reportData = [...header, ...blankRow, ...reportLines];
  const ws0 = XLSX.utils.aoa_to_sheet(reportData);
  ws0['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]; // Merge header across 6 columns for visual space
  ws0['!cols'] = [{ wch: 120 }]; // Set a wide column for the report content
  XLSX.utils.book_append_sheet(wb, ws0, "FINDINGS REPORT");

  // Sheet 2: ANALYSIS SUMMARY
  const summaryData = [
    ["Bank Statement Analysis Summary"],
    ["Bank Name", result.analysisSummary?.bankName],
    ["Bank Statement Type", result.analysisSummary?.statementType],
    ["Name on Bank Statements", result.analysisSummary?.accountHolderName],
    ["Account Number", `****${result.analysisSummary?.accountNumberLast4}`],
    ["Total Deposits", result.analysisSummary?.totalDeposits],
    ["Total Withdrawals", result.analysisSummary?.totalWithdrawals],
    ["Cash Flow", result.analysisSummary?.cashFlow],
    ["Average Deposits", result.analysisSummary?.averageDeposits],
    ["Income Categories", (result.analysisSummary?.incomeCategories || []).join(', ')],
    ["Non-Income Categories", (result.analysisSummary?.nonIncomeCategories || []).join(', ')],
  ];
  const ws1Data = [...header, ...blankRow, ...summaryData];
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
  ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]; // Merge header across 2 columns
  ws1['!cols'] = [{ wch: 30 }, { wch: 50 }]; // Set column widths
  XLSX.utils.book_append_sheet(wb, ws1, "ANALYSIS SUMMARY");

  // Sheet 3: 1. QUALIFIED INCOME CALCULATION
  const incomeCalcHeader = ["Statement Ending Date", "Statement Dates (from - to)", "UPLOADED PDF FILENAME", "DEPOSITS", "LESS TRANSFERS", "NET DEPOSITS"];
  const incomeCalcData = (result.qualifiedIncomeCalculation?.monthlyBreakdown || []).map(row => [
    row.statementEndingDate,
    row.statementDates,
    row.uploadedPdfFilename,
    row.deposits,
    row.lessTransfers,
    row.netDeposits,
  ]);
  const totals = result.qualifiedIncomeCalculation?.totals;
  const incomeCalcFooter = [
    [],
    ["TOTALS", "", "", totals?.deposits, totals?.lessTransfers, totals?.netDeposits],
    ["MONTHLY NET DEPOSITS", "", "", "", "", result.qualifiedIncomeCalculation?.monthlyAverageNetDeposits]
  ];
  const ws2Data = [...header, ...blankRow, [incomeCalcHeader], ...incomeCalcData, ...incomeCalcFooter];
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]; // Merge header across 6 columns
  ws2['!cols'] = [{wch: 20}, {wch: 25}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 15}];
  XLSX.utils.book_append_sheet(wb, ws2, "1. QUALIFIED INCOME CALCULATION");
  
  // Sheet 4: 2. DEPOSITS
  const depositsHeader = ["DATE", "DESCRIPTION", "SHORT DESCRIPTION", "AMOUNT", "DAY", "MONTH", "ACCOUNT_NUMBER", "PDF FILENAME", "LARGE DEPOSIT >$25,000"];
  const depositsData = (result.deposits || []).map(row => [
    row.date,
    row.description,
    row.shortDescription,
    row.amount,
    row.day,
    row.month,
    `****${row.accountNumberLast4}`,
    row.pdfFilename,
    row.largeDepositAmount
  ]);
  const ws3Data = [...header, ...blankRow, [depositsHeader], ...depositsData];
  const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
  ws3['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }]; // Merge header across 9 columns
  ws3['!cols'] = [{wch: 12}, {wch: 40}, {wch: 25}, {wch: 15}, {wch: 8}, {wch: 8}, {wch: 20}, {wch: 30}, {wch: 25}];
  XLSX.utils.book_append_sheet(wb, ws3, "2. DEPOSITS");

  // Sheet 5: 3. TIME PERIOD AGGREGATES
  const agg = result.timePeriodAggregates;
  const aggregatesData = [
      ["DESCRIPTION", "MONTHS 1-6 DEPOSIT TOTALS", "MONTHS 7-12 DEPOSIT TOTALS", "12 MONTH DEPOSIT TOTALS"],
      ["Total Deposits", agg?.totalDeposits.months1_6, agg?.totalDeposits.months7_12, agg?.totalDeposits.months12],
      ["Total Income", agg?.totalIncome.months1_6, agg?.totalIncome.months7_12, agg?.totalIncome.months12],
      ["A- Average Income", agg?.averageIncome.months1_6, agg?.averageIncome.months7_12, agg?.averageIncome.months12],
      ["B- Expense Factor %", agg?.expenseFactorPercentage.months1_6, agg?.expenseFactorPercentage.months7_12, agg?.expenseFactorPercentage.months12],
      ["C- Calculated Expense (A*B)", agg?.calculatedExpense.months1_6, agg?.calculatedExpense.months7_12, agg?.calculatedExpense.months12],
      ["D- Income minus Expense (A-C)", agg?.incomeMinusExpense.months1_6, agg?.incomeMinusExpense.months7_12, agg?.incomeMinusExpense.months12],
      ["E- Ownership Factor Default=100%", agg?.ownershipFactorPercentage.months1_6, agg?.ownershipFactorPercentage.months7_12, agg?.ownershipFactorPercentage.months12],
      ["F- Qualified Income (D*E)", agg?.qualifiedIncome.months1_6, agg?.qualifiedIncome.months7_12, agg?.qualifiedIncome.months12],
      ["Total Withdrawals", agg?.totalWithdrawals.months1_6, agg?.totalWithdrawals.months7_12, agg?.totalWithdrawals.months12],
      ["NSF Count", agg?.nsfCount.months1_6, agg?.nsfCount.months7_12, agg?.nsfCount.months12],
      ["OD Count", agg?.odCount.months1_6, agg?.odCount.months7_12, agg?.odCount.months12],
      ["Cash Flow = (Deposits - Withdrawals)", agg?.cashFlow.months1_6, agg?.cashFlow.months7_12, agg?.cashFlow.months12]
  ];
  const ws4Data = [...header, ...blankRow, ...aggregatesData];
  const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
  ws4['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]; // Merge header across 4 columns
  ws4['!cols'] = [{wch: 35}, {wch: 25}, {wch: 25}, {wch: 25}];
  XLSX.utils.book_append_sheet(wb, ws4, "3. TIME PERIOD AGGREGATES");

  // Sheet 6: 4. RISK
  const riskHeader = ["Topic", "Result = Yes or No", "Notes"];
  const riskData = (result.risk || []).map(row => [
    row.topic,
    row.result,
    row.notes || ""
  ]);
  const ws5Data = [...header, ...blankRow, [riskHeader], ...riskData];
  const ws5 = XLSX.utils.aoa_to_sheet(ws5Data);
  ws5['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]; // Merge header across 3 columns
  ws5['!cols'] = [{wch: 35}, {wch: 20}, {wch: 50}];
  XLSX.utils.book_append_sheet(wb, ws5, "4. RISK");

  XLSX.writeFile(wb, "Bank_Statement_Analysis_GuideU.xlsx");
}