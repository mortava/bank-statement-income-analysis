
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisResult } from './components/AnalysisResult';
import { Loader } from './components/Loader';
import { analyzeStatements, BorrowerInfo } from './services/geminiService';
import { extractTextFromPdfs, PdfFileContent } from './utils/pdfUtils';
import type { AnalysisResult as AnalysisResultType } from './types';
import { InfoIcon } from './components/icons/InfoIcon';

type Status = 'idle' | 'parsing' | 'analyzing' | 'success' | 'error';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultType | null>(null);
  
  // State for new form fields
  const [submittingEmail, setSubmittingEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownershipPercentage, setOwnershipPercentage] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [numEmployees, setNumEmployees] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');

  const handleFilesChange = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    // If all files are removed, reset the result view
    if (selectedFiles.length === 0) {
      setAnalysisResult(null);
      setStatus('idle');
      setError(null);
    }
  }, []);

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError("Please upload at least one bank statement PDF.");
      return;
    }
    if (!submittingEmail || !clientName || !businessName || !businessType) {
      setError("Please fill in all required fields: Submitting Parties Email, Client Name, Business Name, and Type of Business.");
      return;
    }
    
    setStatus('parsing');
    setError(null);
    setAnalysisResult(null);

    try {
      const pdfContents: PdfFileContent[] = await extractTextFromPdfs(files);

      setStatus('analyzing');

      const borrowerInfo: BorrowerInfo = { clientName, businessName, businessType, numEmployees, businessDescription, ownershipPercentage };
      const result = await analyzeStatements(pdfContents, borrowerInfo);
      setAnalysisResult(result);
      setStatus('success');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setError(`Analysis Failed: ${errorMessage}`);
      setStatus('error');
    }
  };
  
  const getStatusMessage = (): string => {
    switch (status) {
      case 'parsing':
        return 'Parsing PDF files...';
      case 'analyzing':
        return 'AI is analyzing documents. This may take a few moments...';
      default:
        return '';
    }
  };

  const isProcessing = status === 'parsing' || status === 'analyzing';
  const isFormIncomplete = !submittingEmail || !clientName || !businessName || !businessType;

  const radioClass = "appearance-none h-4 w-4 border-2 border-black rounded-full bg-white checked:bg-gradient-to-t from-black to-black bg-center bg-no-repeat checked:bg-[length:50%_50%] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500";

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <header className="bg-black text-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <span className="font-bold text-xl">Income Analysis Agent</span>
          <a href="#" target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
            Powered by TRACE AOS
          </a>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200">
          <div className="mb-8 p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold text-primary-900 mb-4">Borrower & Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Submitting parties email */}
              <div>
                <label htmlFor="submittingEmail" className="block text-sm font-medium text-gray-700">Submitting Parties Email <span className="text-red-500">*</span></label>
                <input type="email" id="submittingEmail" value={submittingEmail} onChange={(e) => setSubmittingEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" required />
              </div>
              {/* Client Name */}
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
                <input type="text" id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" required />
              </div>
              {/* Business Name */}
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">Business Name <span className="text-red-500">*</span></label>
                <input type="text" id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" required />
              </div>
               {/* Ownership % */}
              <div>
                <label htmlFor="ownershipPercentage" className="block text-sm font-medium text-gray-700">Ownership %</label>
                <input type="text" id="ownershipPercentage" value={ownershipPercentage} onChange={(e) => setOwnershipPercentage(e.target.value)} placeholder="e.g., 100" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
              {/* Type of Business */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Type of Business <span className="text-red-500">*</span></label>
                <div className="mt-2 flex items-center space-x-6">
                    <label className="flex items-center">
                        <input type="radio" name="businessType" value="Services" checked={businessType === 'Services'} onChange={(e) => setBusinessType(e.target.value)} className={radioClass} />
                        <span className="ml-2 text-sm text-gray-700">Services</span>
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="businessType" value="Sales of Goods" checked={businessType === 'Sales of Goods'} onChange={(e) => setBusinessType(e.target.value)} className={radioClass} />
                        <span className="ml-2 text-sm text-gray-700">Sales of Goods</span>
                    </label>
                </div>
              </div>
               {/* Number of Employees */}
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700">Number of Full Time Employees</label>
                 <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                     {['Myself', 'Me & 1 Other', '2-5', '>6'].map(option => (
                         <label key={option} className="flex items-center">
                             <input type="radio" name="numEmployees" value={option} checked={numEmployees === option} onChange={(e) => setNumEmployees(e.target.value)} className={radioClass} />
                             <span className="ml-2 text-sm text-gray-700">{option}</span>
                         </label>
                     ))}
                 </div>
              </div>
               {/* Business Description */}
              <div className="md:col-span-2">
                <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700">Short Business Description or Notes for the Review</label>
                <textarea id="businessDescription" value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"></textarea>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-xl font-semibold text-primary-900 mb-2">1. Upload Statements</h2>
              <p className="text-black mb-4 text-sm">Select One Merged PDF File or up to 12 Separated files. This Analysis is calibrated for a 12 Month review, Please make sure you have all 12 Months to Upload.</p>
              <FileUpload onFilesChange={handleFilesChange} disabled={isProcessing} />
            </div>

            <div className="flex flex-col items-center justify-center text-center mt-8 md:mt-0">
              {files.length > 0 && !isProcessing && (
                <>
                  <h2 className="text-xl font-semibold text-primary-900 mb-4">2. Start Analysis</h2>
                  <button
                    onClick={handleAnalyze}
                    disabled={isProcessing || isFormIncomplete}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    {isProcessing ? 'Analyzing...' : 'Submit for Review'}
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
          
          {(status === 'idle' && files.length === 0) && (
            <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg flex items-start space-x-3">
              <InfoIcon className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-primary-800">Overview</h3>
                <p className="text-sm text-black">
                  Our Human Trained and fine tuned - AI Agent will review the uploaded PDFs, classify the deposit according to our underwriting rules, perform calculations, and generates a comprehensive analysis report. Please download this report and include it as part of your submission package. Privacy Notice: The statements reviewed and form data will be data-shredded once you exit this Brower window and will not be able to be recovered.
                </p>
              </div>
            </div>
          )}
        </div>

        {isProcessing && <Loader message={getStatusMessage()} />}

        {status === 'success' && analysisResult && (
          <div className="mt-8 md:mt-12">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-primary-800 mb-6">Analysis Complete</h2>
            <AnalysisResult
              result={analysisResult}
              submittingEmail={submittingEmail}
              clientName={clientName}
              businessName={businessName}
              businessType={businessType}
              ownershipPercentage={ownershipPercentage}
            />
          </div>
        )}
      </main>
      <footer className="text-center py-4 text-sm text-black">
        <p>Powered by traceaos.com / For approved mortgage professional use only. All result will be checked by humans.</p>
      </footer>
    </div>
  );
};

export default App;
