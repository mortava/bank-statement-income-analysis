import OpenAI from "openai";
import { SYSTEM_PROMPT } from '../constants';
import type { AnalysisResult } from '../types';
import type { PdfFileContent } from '../utils/pdfUtils';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // Allow client-side usage
});

export interface BorrowerInfo {
  clientName: string;
  businessName: string;
  businessType: string;
  numEmployees: string;
  businessDescription: string;
  ownershipPercentage: string;
}

const responseSchema = {
    type: "object",
    properties: {
        analysisSummary: {
            type: "object",
            properties: {
                bankName: { type: "string" },
                statementType: { type: "string" },
                accountHolderName: { type: "string" },
                accountNumberLast4: { type: "string" },
                totalDeposits: { type: "number" },
                totalWithdrawals: { type: "number" },
                cashFlow: { type: "number" },
                averageDeposits: { type: "number" },
                incomeCategories: { type: "array", items: { type: "string" } },
                nonIncomeCategories: { type: "array", items: { type: "string" } },
            },
            required: ["bankName", "statementType", "accountHolderName", "accountNumberLast4", "totalDeposits", "totalWithdrawals", "cashFlow", "averageDeposits", "incomeCategories", "nonIncomeCategories"],
            additionalProperties: false
        },
        qualifiedIncomeCalculation: {
            type: "object",
            properties: {
                monthlyBreakdown: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            statementEndingDate: { type: "string" },
                            statementDates: { type: "string" },
                            uploadedPdfFilename: { type: "string" },
                            deposits: { type: "number" },
                            lessTransfers: { type: "number" },
                            netDeposits: { type: "number" },
                        },
                        required: ["statementEndingDate", "statementDates", "uploadedPdfFilename", "deposits", "lessTransfers", "netDeposits"],
                        additionalProperties: false
                    },
                },
                totals: {
                    type: "object",
                    properties: {
                        deposits: { type: "number" },
                        lessTransfers: { type: "number" },
                        netDeposits: { type: "number" },
                    },
                    required: ["deposits", "lessTransfers", "netDeposits"],
                    additionalProperties: false
                },
                monthlyAverageNetDeposits: { type: "number" },
            },
            required: ["monthlyBreakdown", "totals", "monthlyAverageNetDeposits"],
            additionalProperties: false
        },
        deposits: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    date: { type: "string" },
                    description: { type: "string" },
                    shortDescription: { type: "string" },
                    amount: { type: "number" },
                    day: { type: "string" },
                    month: { type: "string" },
                    accountNumberLast4: { type: "string" },
                    pdfFilename: { type: "string" },
                    largeDepositAmount: {
                        type: "number",
                        description: "If the deposit is over $25,000, this field should contain the deposit amount. Otherwise, it must be 0."
                    },
                },
                required: ["date", "description", "shortDescription", "amount", "day", "month", "accountNumberLast4", "pdfFilename", "largeDepositAmount"],
                additionalProperties: false
            },
        },
        timePeriodAggregates: {
            type: "object",
            properties: {
                totalDeposits: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                totalIncome: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                averageIncome: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                expenseFactorPercentage: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                calculatedExpense: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                incomeMinusExpense: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                ownershipFactorPercentage: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                qualifiedIncome: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                totalWithdrawals: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                nsfCount: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                odCount: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
                cashFlow: { type: "object", properties: { months1_6: { type: "number" }, months7_12: { type: "number" }, months12: { type: "number" } }, required: ["months1_6", "months7_12", "months12"], additionalProperties: false },
            },
            required: ["totalDeposits", "totalIncome", "averageIncome", "expenseFactorPercentage", "calculatedExpense", "incomeMinusExpense", "ownershipFactorPercentage", "qualifiedIncome", "totalWithdrawals", "nsfCount", "odCount", "cashFlow"],
            additionalProperties: false
        },
        risk: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    topic: { type: "string" },
                    result: {
                        type: "string",
                        description: "The result of the risk check. Must be exactly 'Yes' or 'No'."
                    },
                    notes: {
                        type: "string",
                        description: "Optional notes providing context for the risk. Can be an empty string."
                    },
                },
                required: ["topic", "result", "notes"],
                additionalProperties: false
            },
        },
        markdownSummary: { type: "string" },
    },
    required: ["analysisSummary", "qualifiedIncomeCalculation", "deposits", "timePeriodAggregates", "risk", "markdownSummary"],
    additionalProperties: false
};

export async function analyzeStatements(pdfContents: PdfFileContent[], borrowerInfo: BorrowerInfo): Promise<AnalysisResult> {
  const statementText = pdfContents.map(pdf => 
    `--- START OF FILE: ${pdf.filename} ---\n\n${pdf.content}\n\n--- END OF FILE: ${pdf.filename} ---`
  ).join('\n\n');

  const borrowerContext = `
--- BORROWER AND BUSINESS CONTEXT ---
Client Name: ${borrowerInfo.clientName}
Business Name: ${borrowerInfo.businessName}
Ownership %: ${borrowerInfo.ownershipPercentage || 'Not Provided'}
Type of Business: ${borrowerInfo.businessType}
Number of Full Time Employees: ${borrowerInfo.numEmployees || 'Not Provided'}
Business Description/Notes: ${borrowerInfo.businessDescription || 'Not Provided'}
--- END OF CONTEXT ---
`;

  const fullPrompt = `${borrowerContext}\n\n${SYSTEM_PROMPT}\n\nHere is the text extracted from the bank statements:\n\n${statementText}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: "system",
          content: "You are a financial analysis assistant specializing in bank statement analysis and income calculation for mortgage underwriting."
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bank_statement_analysis",
          strict: true,
          schema: responseSchema
        }
      },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const result: AnalysisResult = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Error during OpenAI API call or JSON parsing:", error);
    if (error instanceof Error && error.message.toLowerCase().includes('json')) {
         throw new Error("The AI returned an invalid analysis format. Please try again.");
    }
    throw new Error("Failed to get a valid response from the AI analysis service. Please try again later.");
  }
}