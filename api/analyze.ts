import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY
});

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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: "system",
          content: "You are a financial analysis assistant specializing in bank statement analysis and income calculation for mortgage underwriting."
        },
        {
          role: "user",
          content: prompt
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

    const result = JSON.parse(content);
    return res.status(200).json(result);

  } catch (error: any) {
    console.error("Error during OpenAI API call:", error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze statements',
      details: error.response?.data || error.toString()
    });
  }
}
