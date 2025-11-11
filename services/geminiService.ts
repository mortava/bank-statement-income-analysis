import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import type { AnalysisResult } from '../types';
import type { PdfFileContent } from '../utils/pdfUtils';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface BorrowerInfo {
  clientName: string;
  businessName: string;
  businessType: string;
  numEmployees: string;
  businessDescription: string;
  ownershipPercentage: string;
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        analysisSummary: {
            type: Type.OBJECT,
            properties: {
                bankName: { type: Type.STRING },
                statementType: { type: Type.STRING },
                accountHolderName: { type: Type.STRING },
                accountNumberLast4: { type: Type.STRING },
                totalDeposits: { type: Type.NUMBER },
                totalWithdrawals: { type: Type.NUMBER },
                cashFlow: { type: Type.NUMBER },
                averageDeposits: { type: Type.NUMBER },
                incomeCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
                nonIncomeCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        qualifiedIncomeCalculation: {
            type: Type.OBJECT,
            properties: {
                monthlyBreakdown: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            statementEndingDate: { type: Type.STRING },
                            statementDates: { type: Type.STRING },
                            uploadedPdfFilename: { type: Type.STRING },
                            deposits: { type: Type.NUMBER },
                            lessTransfers: { type: Type.NUMBER },
                            netDeposits: { type: Type.NUMBER },
                        },
                    },
                },
                totals: {
                    type: Type.OBJECT,
                    properties: {
                        deposits: { type: Type.NUMBER },
                        lessTransfers: { type: Type.NUMBER },
                        netDeposits: { type: Type.NUMBER },
                    },
                },
                monthlyAverageNetDeposits: { type: Type.NUMBER },
            },
        },
        deposits: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING },
                    description: { type: Type.STRING },
                    shortDescription: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    day: { type: Type.STRING },
                    month: { type: Type.STRING },
                    accountNumberLast4: { type: Type.STRING },
                    pdfFilename: { type: Type.STRING },
                    largeDepositAmount: { 
                        type: Type.NUMBER,
                        description: "If the deposit is over $25,000, this field should contain the deposit amount. Otherwise, it must be 0."
                    },
                },
            },
        },
        timePeriodAggregates: {
            type: Type.OBJECT,
            properties: {
                totalDeposits: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                totalIncome: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                averageIncome: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                expenseFactorPercentage: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                calculatedExpense: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                incomeMinusExpense: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                ownershipFactorPercentage: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                qualifiedIncome: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                totalWithdrawals: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                nsfCount: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                odCount: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
                cashFlow: { type: Type.OBJECT, properties: { months1_6: { type: Type.NUMBER }, months7_12: { type: Type.NUMBER }, months12: { type: Type.NUMBER } } },
            },
        },
        risk: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING },
                    result: { 
                        type: Type.STRING,
                        description: "The result of the risk check. Must be exactly 'Yes' or 'No'."
                    },
                    notes: { 
                        type: Type.STRING,
                        description: "Optional notes providing context for the risk. Can be an empty string."
                    },
                },
            },
        },
        markdownSummary: { type: Type.STRING },
    },
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: fullPrompt,
      config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
      }
    });

    const jsonString = response.text.trim();
    const result: AnalysisResult = JSON.parse(jsonString);
    return result;
  } catch (error) {
    console.error("Error during Gemini API call or JSON parsing:", error);
    if (error instanceof Error && error.message.toLowerCase().includes('json')) {
         throw new Error("The AI returned an invalid analysis format. Please try again.");
    }
    throw new Error("Failed to get a valid response from the AI analysis service. Please try again later.");
  }
}