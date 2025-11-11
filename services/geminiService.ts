import { SYSTEM_PROMPT } from '../constants';
import type { AnalysisResult } from '../types';
import type { PdfFileContent } from '../utils/pdfUtils';

export interface BorrowerInfo {
  clientName: string;
  businessName: string;
  businessType: string;
  numEmployees: string;
  businessDescription: string;
  ownershipPercentage: string;
}

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
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: fullPrompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", errorData);
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const result: AnalysisResult = await response.json();
    return result;
  } catch (error) {
    console.error("Error during API call:", error);
    if (error instanceof Error) {
      if (error.message.toLowerCase().includes('json')) {
        throw new Error("The AI returned an invalid analysis format. Please try again.");
      }
      throw new Error(error.message || "Failed to get a valid response from the AI analysis service. Please try again later.");
    }
    throw new Error("Failed to get a valid response from the AI analysis service. Please try again later.");
  }
}