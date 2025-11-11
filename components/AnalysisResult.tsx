import React, { useState } from 'react';
import type { AnalysisResult as AnalysisResultType } from '../types';
import { createExcelWorkbook } from '../services/excelService';
import { ExcelIcon } from './icons/ExcelIcon';
import { ShareIcon } from './icons/ShareIcon';

interface AnalysisResultProps {
  result: AnalysisResultType;
  submittingEmail: string;
  clientName: string;
  businessName: string;
  businessType: string;
  ownershipPercentage: string;
}

const parseInlineMarkdown = (text: string): React.ReactNode => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = text.split(boldRegex);

    return parts.map((part, index) => {
        if (index % 2 === 1) { 
            return <strong key={index}>{part}</strong>;
        }
        return part;
    });
};

const MarkdownRenderer: React.FC<{ content: string | null | undefined }> = ({ content }) => {
    if (!content) {
        return null;
    }
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (line.startsWith('---')) {
            elements.push(<hr key={i} className="my-4" />);
            continue;
        }
        if (line.startsWith('- ')) {
            elements.push(<li key={i} className="ml-5 list-disc">{parseInlineMarkdown(line.substring(2))}</li>);
            continue;
        }

        if (line.trim().startsWith('|') && lines[i+1]?.trim().match(/^\|[-|: ]+\|$/)) {
            const tableRows: string[][] = [];
            const headerCells = line.split('|').slice(1, -1).map(c => c.trim());
            
            let j = i + 2; 
            while(j < lines.length && lines[j].trim().startsWith('|')) {
                tableRows.push(lines[j].split('|').slice(1, -1).map(c => c.trim()));
                j++;
            }

            elements.push(
                <div key={`table-${i}`} className="overflow-x-auto my-4">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr className="border-b">
                                {headerCells.map((cell, k) => <th key={k} className="p-2 font-semibold text-left">{parseInlineMarkdown(cell)}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row, k) => (
                                <tr key={k} className="border-b hover:bg-gray-50">
                                    {row.map((cell, l) => <td key={l} className="p-2">{parseInlineMarkdown(cell)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            i = j - 1; 
            continue;
        }

        if (line.trim() !== '') {
            elements.push(<p key={i} className="my-1">{parseInlineMarkdown(line)}</p>);
        }
    }

    return <div className="prose max-w-none text-black">{elements}</div>;
};


export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, submittingEmail, clientName, businessName, businessType, ownershipPercentage }) => {
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = () => {
    setDownloadError(null); // Clear previous errors.
    try {
      createExcelWorkbook(result);
    } catch (err) {
      console.error("Failed to create Excel workbook:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setDownloadError(`Failed to download Excel report: ${errorMessage}`);
    }
  };

  const handleShare = () => {
    const subject = `IAA Report for: ${clientName} - ${businessName}`;

    // Helper to format numbers as currency
    const formatCurrency = (num: number = 0): string => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

    const { analysisSummary, timePeriodAggregates, risk, qualifiedIncomeCalculation } = result;
    const numMonths = qualifiedIncomeCalculation?.monthlyBreakdown?.length || 0;

    // Get specific risk factors
    const findRisk = (topic: string) => (risk || []).find(r => r.topic.toLowerCase().includes(topic.toLowerCase()));
    const nsfRisk = findRisk('nsf') || { result: 'No', notes: 'No NSF or overdraft fees were identified.' };
    const comminglingRisk = findRisk('commingling') || { result: 'No', notes: 'No significant commingling of funds was detected.' };
    const consistentDepositsRisk = findRisk('consistent deposits') || { result: 'Yes', notes: 'Deposits appear consistent.' };
    const negativeBalancesRisk = findRisk('negative ending balances') || { result: 'No', notes: 'The account maintained a positive daily balance.' };

    const emailBody = `Analysis Summary

This report details the ${numMonths}-month bank statement analysis for ${businessName}, a ${businessType} business with ${ownershipPercentage || '100'}% ownership by the borrower, ${clientName}. The primary source of income is from ${(analysisSummary?.incomeCategories || []).join(', ')}. The account maintained positive daily balances throughout the period with ${nsfRisk.result.toLowerCase() === 'no' ? 'no' : ''} overdrafts or NSF occurrences. A notable risk factor is the commingling of funds: ${comminglingRisk.result}.

Income Analysis

Total Deposits (${numMonths} Months): ${formatCurrency(timePeriodAggregates?.totalDeposits?.months12)}
Less Non-Qualifying Deposits: ${formatCurrency((timePeriodAggregates?.totalDeposits?.months12 || 0) - (timePeriodAggregates?.totalIncome?.months12 || 0))}
Total Qualifying Deposits: ${formatCurrency(timePeriodAggregates?.totalIncome?.months12)}
Monthly Average Qualifying Deposits: ${formatCurrency(timePeriodAggregates?.averageIncome?.months12)}

Risk Analysis

NSF / Overdrafts: ${nsfRisk.result}. ${nsfRisk.notes || ''}
Commingling of Funds: ${comminglingRisk.result}. ${comminglingRisk.notes || ''}
Consistent Deposits: ${consistentDepositsRisk.result}. ${consistentDepositsRisk.notes || ''}
Negative Ending Balances: ${negativeBalancesRisk.result}. ${negativeBalancesRisk.notes || ''}

Final Qualified Income Calculation

Total Qualifying Income (${numMonths} Months): ${formatCurrency(timePeriodAggregates?.totalIncome?.months12)}
Expense Factor (${businessType} @ ${timePeriodAggregates?.expenseFactorPercentage?.months12}%): ${formatCurrency(timePeriodAggregates?.calculatedExpense?.months12)}
Net Income (Pre-Ownership): ${formatCurrency(timePeriodAggregates?.incomeMinusExpense?.months12)}
Ownership Percentage: ${timePeriodAggregates?.ownershipFactorPercentage?.months12}%
Final Monthly Qualified Income: ${formatCurrency(timePeriodAggregates?.qualifiedIncome?.months12)}

Risk Assessment Details
${(risk || []).map(r => `Topic: ${r.topic}\nResult: ${r.result}\nNotes: ${r.notes || 'N/A'}`).join('\n\n')}
`;

    const mailtoLink = `mailto:${submittingEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
  };


  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="p-6 md:p-8 border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-xl font-bold text-primary-900">Analysis Report</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <ShareIcon className="w-5 h-5" />
              Share via Email
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              <ExcelIcon className="w-5 h-5" />
              Download Excel Report
            </button>
          </div>
        </div>
        {downloadError && (
            <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
              <p className="font-bold">Download Error</p>
              <p>{downloadError}</p>
            </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        <MarkdownRenderer content={result.markdownSummary} />

        {result.risk && result.risk.length > 0 && (
          <>
            <h2 className="text-xl font-bold mt-8 mb-4 text-primary-900">Risk Assessment Details</h2>
            <div className="overflow-x-auto my-4 border rounded-lg">
                <table className="w-full text-sm text-left text-gray-800">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-3 font-semibold">Topic</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Result</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.risk.map((item, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{item.topic}</td>
                                <td className={`px-6 py-4 font-semibold ${item.result === 'Yes' ? 'text-red-600' : 'text-green-600'}`}>
                                    {item.result}
                                </td>
                                <td className="px-6 py-4">{item.notes || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};