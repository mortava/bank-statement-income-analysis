
// This assumes pdfjsLib is available globally from the CDN script in index.html
declare const pdfjsLib: any;

export interface PdfFileContent {
  filename: string;
  content: string;
}

export async function extractTextFromPdfs(files: File[]): Promise<PdfFileContent[]> {
  const allFilesContent: PdfFileContent[] = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    allFilesContent.push({ filename: file.name, content: fullText });
  }

  return allFilesContent;
}
