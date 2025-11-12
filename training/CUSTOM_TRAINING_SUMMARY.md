# Bank Statement Analysis Agent - Custom Training Summary

**Agent Name**: GuideU
**Purpose**: AI-powered mortgage underwriting analyst specializing in bank statement income analysis
**Framework**: Agent Lightning with Automatic Prompt Optimization (APO)
**Model**: OpenAI gpt-4o-mini
**Date**: November 12, 2025

---

## 📋 Executive Summary

This document provides a comprehensive training specification for the Bank Statement Analysis Agent (GuideU). The agent is designed to extract, validate, categorize, and calculate qualifying income from personal and business bank statements according to mortgage industry standards. Training focuses on optimizing the system prompt to maximize accuracy, consistency, and compliance with underwriting requirements.

---

## 🎯 Training Objectives

### Primary Objectives
1. **Accurate Data Extraction**: Extract all transaction data from bank statement text with 95%+ accuracy
2. **Correct Income Classification**: Distinguish between qualifying and non-qualifying income with 90%+ accuracy
3. **Precise Calculations**: Calculate qualified income, averages, and aggregates with 98%+ accuracy
4. **Risk Identification**: Detect and flag all red flags and risk indicators with 85%+ recall
5. **Format Compliance**: Generate outputs that perfectly match the Excel template structure

### Secondary Objectives
1. **Consistency**: Produce consistent results across similar statements
2. **Completeness**: Fill all required fields without omissions
3. **Clarity**: Generate clear, understandable markdown summaries
4. **Edge Case Handling**: Properly handle unusual scenarios and missing data

---

## 📊 Excel Template Structure (Training Ground Truth)

The agent's output must align with the 5-sheet Excel template structure:

### Sheet 1: REVIEW SUMMARY (analysisSummary)
**Purpose**: High-level overview of the bank statement

**Fields to Extract**:
- `bankName`: Name of the financial institution
- `statementType`: Personal Checking, Business Checking, Savings, etc.
- `accountHolderName`: Name on the account
- `accountNumberLast4`: Last 4 digits of account number
- `totalDeposits`: Sum of all deposits (numeric)
- `totalWithdrawals`: Sum of all withdrawals (numeric)
- `cashFlow`: Net difference (deposits - withdrawals)
- `averageDeposits`: Mean deposit amount
- `incomeCategories`: Array of income types found (e.g., ["Direct Deposit", "Wire Transfer"])
- `nonIncomeCategories`: Array of non-income transaction types (e.g., ["Transfers", "Refunds"])

**Training Focus**:
- Accurate bank name identification (handle variations like "Chase", "JPMorgan Chase", "Chase Bank")
- Correct account type classification
- Precise numerical calculations with proper decimal handling
- Comprehensive categorization of transaction types

---

### Sheet 2: DEPOSIT - INCOME CALCULATION (qualifiedIncomeCalculation)
**Purpose**: Calculate monthly qualified income after removing transfers

**Structure**:
```json
{
  "monthlyBreakdown": [
    {
      "statementEndingDate": "MM/DD/YYYY",
      "statementDates": "MM/DD/YYYY - MM/DD/YYYY",
      "uploadedPdfFilename": "statement_jan_2024.pdf",
      "deposits": 10500.00,
      "lessTransfers": 500.00,
      "netDeposits": 10000.00
    }
  ],
  "totals": {
    "deposits": 10500.00,
    "lessTransfers": 500.00,
    "netDeposits": 10000.00
  },
  "monthlyAverageNetDeposits": 10000.00
}
```

**Training Focus**:
- Accurate date parsing and range identification
- Distinction between deposits and transfers
- Correct filename association
- Proper monthly aggregation
- Accurate average calculation across all months

**Critical Rules**:
- Transfers between own accounts = NON-QUALIFYING
- Employment deposits = QUALIFYING
- Business revenue deposits = QUALIFYING (with expense factor)
- Refunds/returns = NON-QUALIFYING

---

### Sheet 3: DEPOSIT LISTS (deposits)
**Purpose**: Itemized list of all deposit transactions

**Structure** (per deposit):
```json
{
  "date": "01/15/2024",
  "description": "Direct Deposit - ACME Corp",
  "shortDescription": "Employment Income",
  "amount": 5500.00,
  "day": "15",
  "month": "01",
  "accountNumberLast4": "1234",
  "pdfFilename": "statement_jan_2024.pdf",
  "largeDepositAmount": 0  // Amount if >$25k, else 0
}
```

**Training Focus**:
- Complete transaction extraction (no missed deposits)
- Accurate date parsing (handle various formats: "1/15/24", "01-15-2024", "Jan 15, 2024")
- Meaningful short descriptions for categorization
- Proper large deposit flagging (>$25,000)
- Correct source filename tracking

**Edge Cases to Handle**:
- Multiple deposits on same day
- Deposits with similar descriptions
- Deposits spanning month boundaries
- Deposits in foreign currency (convert to USD if needed)

---

### Sheet 4: OVERVIEW (timePeriodAggregates)
**Purpose**: Calculate income metrics across different time periods

**Time Periods**:
- `months1_6`: Most recent 6 months
- `months7_12`: Months 7-12 (second half of year)
- `months12`: Full 12-month total

**Metrics Per Period**:
```json
{
  "totalDeposits": {"months1_6": 66000, "months7_12": 64000, "months12": 130000},
  "totalIncome": {"months1_6": 64000, "months7_12": 62000, "months12": 126000},
  "averageIncome": {"months1_6": 10667, "months7_12": 10333, "months12": 10500},
  "expenseFactorPercentage": {"months1_6": 50, "months7_12": 50, "months12": 50},
  "calculatedExpense": {"months1_6": 32000, "months7_12": 31000, "months12": 63000},
  "incomeMinusExpense": {"months1_6": 32000, "months7_12": 31000, "months12": 63000},
  "ownershipFactorPercentage": {"months1_6": 75, "months7_12": 75, "months12": 75},
  "qualifiedIncome": {"months1_6": 24000, "months7_12": 23250, "months12": 47250},
  "totalWithdrawals": {"months1_6": 20000, "months7_12": 19000, "months12": 39000},
  "nsfCount": {"months1_6": 0, "months7_12": 0, "months12": 0},
  "odCount": {"months1_6": 1, "months7_12": 0, "months12": 1},
  "cashFlow": {"months1_6": 44000, "months7_12": 43000, "months12": 87000}
}
```

**Training Focus**:
- **Expense Factor Rules**:
  - Personal accounts: 0% expense factor
  - Business accounts: 50% expense factor (default)
  - Self-employed: May vary (25%-75%) based on business type

- **Ownership Factor Application** (CRITICAL):
  - MUST multiply incomeMinusExpense by ownership percentage
  - Example: $10,000 income × 75% ownership = $7,500 qualified income
  - Default to 100% if not provided

- **NSF/OD Detection**:
  - NSF = Non-Sufficient Funds
  - OD = Overdraft
  - Search for keywords: "NSF", "Insufficient", "Overdraft", "OD Fee"

**Calculation Formulas**:
```
totalIncome = totalDeposits - transfers
calculatedExpense = totalIncome × (expenseFactorPercentage / 100)
incomeMinusExpense = totalIncome - calculatedExpense
qualifiedIncome = incomeMinusExpense × (ownershipFactorPercentage / 100)
cashFlow = totalDeposits - totalWithdrawals
```

---

### Sheet 5: RISK RESULTS_UW NOTES (risk)
**Purpose**: Identify and document risk factors for underwriting review

**Structure** (per risk item):
```json
{
  "topic": "NSF or Overdraft Fees",
  "result": "Yes",  // Must be exactly "Yes" or "No"
  "notes": "3 NSF fees totaling $105 in statement period"
}
```

**Standard Risk Topics to Check**:

1. **NSF or Overdraft Fees**
   - Result: "Yes" if any NSF/OD fees found
   - Notes: Count and total amount

2. **Large Deposits Over $25,000**
   - Result: "Yes" if any single deposit > $25,000
   - Notes: List dates and amounts

3. **Irregular Deposit Patterns**
   - Result: "Yes" if deposits vary >30% month-to-month
   - Notes: Describe the pattern

4. **Negative Ending Balance**
   - Result: "Yes" if statement ends with negative balance
   - Notes: Amount and duration

5. **Frequent Transfers Between Accounts**
   - Result: "Yes" if >10 transfers per month
   - Notes: Number of transfers

6. **Recent Account Opening**
   - Result: "Yes" if account <12 months old
   - Notes: Account age

7. **Declining Income Trend**
   - Result: "Yes" if income decreased >20% over 6 months
   - Notes: Percentage decline

8. **Business Account Used for Personal Expenses**
   - Result: "Yes" if personal expenses in business account
   - Notes: Examples found

9. **Cash Deposits**
   - Result: "Yes" if cash deposits >20% of total
   - Notes: Amount and percentage

10. **Unidentifiable Deposits**
    - Result: "Yes" if deposit descriptions unclear
    - Notes: Number of unclear deposits

**Training Focus**:
- Comprehensive risk scanning (don't miss any)
- Accurate Yes/No determination
- Clear, concise notes with specific details
- Prioritize critical risks (NSF, large deposits, irregular patterns)

---

## 🎓 Training Methodology

### Phase 1: Basic Pattern Recognition (10-20 examples)
**Goal**: Learn to extract basic information accurately

**Training Examples Should Include**:
- Various bank formats (Chase, Bank of America, Wells Fargo, Credit Unions)
- Different account types (Personal Checking, Business Checking, Savings)
- Simple deposit patterns (regular employment income)
- Clean statements (no complications)

**Reward Criteria**:
- +1.0 for all required fields present
- +1.0 for correct numerical calculations (±$1 tolerance)
- +1.0 for proper date parsing
- +0.5 for correct bank name extraction
- +0.5 for valid JSON structure

**Total Possible**: 4.0 points

---

### Phase 2: Income Classification (20-30 examples)
**Goal**: Accurately distinguish qualifying vs non-qualifying income

**Training Examples Should Include**:
- Direct deposits (employment)
- ACH transfers (qualifying and non-qualifying)
- Wire transfers (business revenue)
- Internal transfers (non-qualifying)
- Refunds and returns (non-qualifying)
- Business-to-business payments
- Self-employment income

**Reward Criteria**:
- +2.0 for correct income vs non-income classification
- +1.0 for proper lessTransfers calculation
- +1.0 for accurate monthlyAverageNetDeposits
- +0.5 for comprehensive incomeCategories array
- +0.5 for comprehensive nonIncomeCategories array

**Total Possible**: 5.0 points

**Penalty**:
- -1.0 for each miscategorized transfer counted as income
- -0.5 for each missed income source

---

### Phase 3: Complex Calculations (30-50 examples)
**Goal**: Master expense factors, ownership factors, and time period aggregates

**Training Examples Should Include**:
- Business accounts with 50% expense factor
- Self-employed with various ownership percentages (25%, 50%, 75%, 100%)
- Multiple month periods (6-month, 12-month)
- Statements with NSF/OD fees
- Large deposits requiring special handling

**Reward Criteria**:
- +3.0 for correct timePeriodAggregates (all fields within 1% tolerance)
- +2.0 for proper expense factor application
- +2.0 for correct ownership factor application (CRITICAL)
- +1.0 for accurate NSF/OD counts
- +1.0 for correct cashFlow calculations

**Total Possible**: 9.0 points

**Penalty**:
- -2.0 for incorrect ownership factor application (major error)
- -1.0 for expense factor errors
- -0.5 for NSF/OD detection misses

---

### Phase 4: Risk Assessment (40-60 examples)
**Goal**: Comprehensive risk identification and documentation

**Training Examples Should Include**:
- Statements with NSF fees
- Large deposits ($25k+)
- Irregular income patterns
- Declining income trends
- Mixed personal/business usage
- Recent account openings
- High cash deposit percentages

**Reward Criteria**:
- +2.0 for complete risk array (all topics checked)
- +1.5 for accurate Yes/No determinations
- +1.0 for clear, specific notes
- +0.5 for proper prioritization (critical risks first)

**Total Possible**: 5.0 points

**Penalty**:
- -1.0 for each missed critical risk (NSF, large deposits)
- -0.5 for each missed minor risk
- -0.5 for vague or unclear notes

---

### Phase 5: Edge Cases & Real-World Complexity (50+ examples)
**Goal**: Handle unusual scenarios and maintain accuracy

**Training Examples Should Include**:
- Statements with missing data
- Multi-currency deposits
- Statements spanning multiple PDFs
- Inconsistent date formats
- Unusual transaction descriptions
- Merged business/personal accounts
- Seasonal income variations

**Reward Criteria**:
- +3.0 for graceful handling of missing data
- +2.0 for correct assumptions when data unclear
- +2.0 for proper PDF filename tracking
- +1.0 for consistent formatting despite input variations

**Total Possible**: 8.0 points

**Penalty**:
- -2.0 for crashes or errors on edge cases
- -1.0 for incorrect default assumptions
- -0.5 for incomplete data when available

---

## 📏 Overall Reward Function

### Composite Score Calculation
```python
def calculate_training_reward(result, expected):
    reward = 0.0
    max_reward = 31.0  # Sum of all phase max rewards

    # Structure validation (4 points)
    if "analysisSummary" in result: reward += 1.0
    if "qualifiedIncomeCalculation" in result: reward += 1.0
    if "deposits" in result and len(result["deposits"]) > 0: reward += 1.0
    if "timePeriodAggregates" in result: reward += 0.5
    if "risk" in result: reward += 0.5

    # Calculation accuracy (10 points)
    if check_calculations_accurate(result, expected, tolerance=0.01):
        reward += 5.0
    if check_ownership_factor_correct(result, expected):
        reward += 3.0
    if check_expense_factor_correct(result, expected):
        reward += 2.0

    # Classification accuracy (8 points)
    if check_income_classification(result, expected):
        reward += 4.0
    if check_transfer_detection(result, expected):
        reward += 2.0
    if check_category_arrays(result, expected):
        reward += 2.0

    # Risk identification (5 points)
    risk_score = evaluate_risk_detection(result, expected)
    reward += risk_score  # 0-5 based on comprehensiveness

    # Completeness (4 points)
    if all_required_fields_present(result):
        reward += 2.0
    if no_null_values_in_required_fields(result):
        reward += 1.0
    if proper_filename_tracking(result, expected):
        reward += 1.0

    # Normalize to 0-1 range
    return min(reward / max_reward, 1.0)
```

---

## 🎯 Training Success Criteria

### Minimum Acceptable Performance (MVP)
- **Overall Reward Score**: ≥ 0.70 (70%)
- **Calculation Accuracy**: ≥ 95% (within 1% tolerance)
- **Classification Accuracy**: ≥ 85%
- **Risk Detection Recall**: ≥ 75%
- **Format Compliance**: 100% (all required fields)

### Production-Ready Performance
- **Overall Reward Score**: ≥ 0.85 (85%)
- **Calculation Accuracy**: ≥ 98%
- **Classification Accuracy**: ≥ 90%
- **Risk Detection Recall**: ≥ 85%
- **Format Compliance**: 100%
- **Consistency**: <5% variance on similar statements

### Excellent Performance (Target)
- **Overall Reward Score**: ≥ 0.92 (92%)
- **Calculation Accuracy**: ≥ 99%
- **Classification Accuracy**: ≥ 95%
- **Risk Detection Recall**: ≥ 90%
- **Format Compliance**: 100%
- **Consistency**: <2% variance on similar statements

---

## 📝 Critical Training Rules (Must Follow)

### Rule 1: Ownership Percentage (HIGH PRIORITY)
```
IF ownership_percentage PROVIDED:
  ownershipFactorPercentage = ownership_percentage
  qualifiedIncome = incomeMinusExpense × (ownership_percentage / 100)
ELSE:
  ownershipFactorPercentage = 100
  qualifiedIncome = incomeMinusExpense
```

**Training Examples**:
- 75% ownership: $10,000 income → $7,500 qualified income
- 50% ownership: $8,000 income → $4,000 qualified income
- 100% ownership (default): $12,000 income → $12,000 qualified income

**Penalty for Errors**: -3.0 points (critical error)

---

### Rule 2: Expense Factor (BUSINESS ACCOUNTS ONLY)
```
IF account_type = "Business":
  expense_factor = 50  # Default for business
ELSE:
  expense_factor = 0   # Personal accounts have no expense factor
END IF

calculated_expense = total_income × (expense_factor / 100)
income_minus_expense = total_income - calculated_expense
```

**Training Examples**:
- Business account: $10,000 income → $5,000 expense → $5,000 net
- Personal account: $10,000 income → $0 expense → $10,000 net

**Penalty for Errors**: -2.0 points

---

### Rule 3: Transfer Detection (CRITICAL)
**QUALIFYING Income**:
- Direct deposits from employers
- ACH credits from clients/customers
- Wire transfers for business services
- Government benefits (Social Security, VA, etc.)
- Interest earned

**NON-QUALIFYING (Transfers)**:
- Internal transfers between own accounts
- Person-to-person transfers (Zelle, Venmo, etc.)
- Savings transfers
- Credit card payments
- Loan disbursements

**Detection Keywords**:
- Transfers: "TRANSFER", "XFER", "TO SAV", "FROM CHK"
- Income: "DEPOSIT", "PAYROLL", "DIRECT DEP", "ACH CREDIT"

**Penalty for Errors**: -1.0 per miscategorization

---

### Rule 4: Empty Arrays (NOT NULL)
```
// CORRECT
"incomeCategories": []
"deposits": []

// INCORRECT
"incomeCategories": null
"deposits": null
```

**Penalty for Errors**: -0.5 per null array

---

### Rule 5: Large Deposit Flagging
```
IF deposit_amount > 25000:
  largeDepositAmount = deposit_amount
ELSE:
  largeDepositAmount = 0
END IF
```

**Training Note**: This is for underwriting review, not to exclude from income

---

## 🔍 Training Data Requirements

### Minimum Dataset Size
- **Phase 1**: 10 examples
- **Phase 2**: 20 examples (30 cumulative)
- **Phase 3**: 20 examples (50 cumulative)
- **Phase 4**: 20 examples (70 cumulative)
- **Phase 5**: 30 examples (100 cumulative)

**Recommended**: 100-200 examples for production-grade training

### Data Diversity Requirements
- **Banks**: At least 5 different banks
- **Account Types**: Personal (50%), Business (30%), Self-Employed (20%)
- **Statement Periods**: Single month (60%), Multi-month (40%)
- **Income Types**: Employment (40%), Business (30%), Mixed (20%), Other (10%)
- **Complexity Levels**: Simple (30%), Moderate (40%), Complex (20%), Edge Cases (10%)

---

## 📊 Training Evaluation Metrics

### Per-Example Metrics
1. **Structural Score**: All required fields present (0-1)
2. **Calculation Score**: Numerical accuracy (0-1)
3. **Classification Score**: Income categorization accuracy (0-1)
4. **Risk Score**: Risk detection completeness (0-1)
5. **Overall Score**: Weighted average

### Aggregate Metrics
1. **Mean Reward**: Average across all examples
2. **Min Reward**: Worst-case performance
3. **Consistency**: Standard deviation of rewards
4. **Improvement Rate**: Reward increase per training round

### Validation Metrics
1. **Held-Out Performance**: Score on unseen examples
2. **Cross-Bank Consistency**: Performance variance by bank
3. **Edge Case Handling**: Performance on difficult examples
4. **Production Alignment**: Match rate with human underwriters

---

## 🚀 Deployment Checklist

Before deploying optimized prompts:

- [ ] Overall reward ≥ 0.85 on validation set
- [ ] Tested on all 5 major bank formats
- [ ] Edge case performance ≥ 0.75
- [ ] Human underwriter review passed
- [ ] No critical errors in last 50 examples
- [ ] Ownership factor 100% accurate
- [ ] Expense factor 100% accurate
- [ ] Risk detection recall ≥ 85%
- [ ] JSON schema compliance 100%
- [ ] Production API integration tested

---

## 📚 Reference Documents

1. **Excel Template**: `results-tempalte-bank-statement-analysis-worksheet.xlsx`
2. **System Prompt**: `constants.ts` (SYSTEM_PROMPT)
3. **Full System Prompt**: `bank-statement-agent-lightning-training-system-prompt.txt`
4. **Training Code**: `training/bank_statement_agent.py`
5. **Training Script**: `training/train_bank_statement_agent.py`
6. **Training Guide**: `AGENT_LIGHTNING_TRAINING_GUIDE.md`

---

## 💡 Training Tips & Best Practices

### For Data Preparation
1. **Use Real Data**: Training on synthetic data leads to poor real-world performance
2. **Include Edge Cases**: 10-20% of training data should be challenging scenarios
3. **Verify Expected Outputs**: Double-check all expected_output values for accuracy
4. **Diverse Formats**: Include various bank statement formats and layouts

### For Reward Function Tuning
1. **Weight Critical Features**: Ownership and expense factors should have high penalties
2. **Punish Major Errors**: Missing income or wrong calculations should be heavily penalized
3. **Reward Completeness**: Prefer complete but slightly inaccurate over incomplete
4. **Balance Precision vs Recall**: In underwriting, false negatives (missed risks) are worse than false positives

### For APO Training
1. **Start Simple**: Begin with beam_width=2, beam_rounds=2 for testing
2. **Increase Gradually**: Scale up to beam_width=5, beam_rounds=5 for production
3. **Monitor Validation**: Watch for overfitting (train score >> validation score)
4. **Save Checkpoints**: Save prompts after each round for comparison

### For Production Deployment
1. **A/B Test**: Compare new prompt with current prompt on held-out data
2. **Shadow Mode**: Run both prompts and compare results before full rollout
3. **Monitor Metrics**: Track error rates, calculation accuracy, and user feedback
4. **Iterate Continuously**: Collect production data for retraining

---

## 🎓 Training Success Story Example

### Before Training
- Reward Score: 0.62
- Ownership factor errors: 40%
- Risk detection recall: 65%
- Inconsistent categorization

### After 3 Rounds of APO Training
- Reward Score: 0.89
- Ownership factor errors: 0%
- Risk detection recall: 92%
- Highly consistent across banks

### Key Improvements
1. Learned to always apply ownership percentage
2. Improved transfer vs income distinction
3. Better risk scanning coverage
4. More consistent formatting

---

## 📞 Support & Questions

For training assistance:
- Review `training/README.md` for detailed instructions
- Check `AGENT_LIGHTNING_TRAINING_GUIDE.md` for comprehensive guide
- Refer to Agent Lightning docs: https://microsoft.github.io/agent-lightning/

---

**Last Updated**: November 12, 2025
**Version**: 1.0
**Status**: Ready for Training
