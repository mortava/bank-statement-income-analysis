
export interface AnalysisSummary {
  bankName: string;
  statementType: string;
  accountHolderName: string;
  accountNumberLast4: string;
  totalDeposits: number;
  totalWithdrawals: number;
  cashFlow: number;
  averageDeposits: number;
  incomeCategories: string[];
  nonIncomeCategories: string[];
}

export interface MonthlyBreakdown {
  statementEndingDate: string;
  statementDates: string;
  uploadedPdfFilename: string;
  deposits: number;
  lessTransfers: number;
  netDeposits: number;
}

export interface QualifiedIncomeCalculation {
  monthlyBreakdown: MonthlyBreakdown[];
  totals: {
    deposits: number;
    lessTransfers: number;
    netDeposits: number;
  };
  monthlyAverageNetDeposits: number;
}

export interface DepositTransaction {
  date: string;
  description: string;
  shortDescription: string;
  amount: number;
  day: string;
  month: string;
  accountNumberLast4: string;
  pdfFilename: string;
  largeDepositAmount: number;
}

export interface TimePeriodAggregateValues {
  months1_6: number;
  months7_12: number;
  months12: number;
}

export interface TimePeriodAggregates {
  totalDeposits: TimePeriodAggregateValues;
  totalIncome: TimePeriodAggregateValues;
  averageIncome: TimePeriodAggregateValues;
  expenseFactorPercentage: TimePeriodAggregateValues;
  calculatedExpense: TimePeriodAggregateValues;
  incomeMinusExpense: TimePeriodAggregateValues;
  ownershipFactorPercentage: TimePeriodAggregateValues;
  qualifiedIncome: TimePeriodAggregateValues;
  totalWithdrawals: TimePeriodAggregateValues;
  nsfCount: TimePeriodAggregateValues;
  odCount: TimePeriodAggregateValues;
  cashFlow: TimePeriodAggregateValues;
}

export interface RiskFactor {
  topic: string;
  result: 'Yes' | 'No';
  notes?: string;
}

export interface AnalysisResult {
  analysisSummary: AnalysisSummary;
  qualifiedIncomeCalculation: QualifiedIncomeCalculation;
  deposits: DepositTransaction[];
  timePeriodAggregates: TimePeriodAggregates;
  risk: RiskFactor[];
  markdownSummary: string;
}
