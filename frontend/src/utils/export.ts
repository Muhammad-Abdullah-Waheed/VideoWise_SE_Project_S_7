import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export interface ExportData {
  title: string;
  summary: string;
  transcript?: string;
  metadata?: {
    videoUrl?: string;
    duration?: string;
    createdAt?: string;
    style?: string;
  };
}

// Export as PDF
export const exportToPDF = async (data: ExportData) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text(data.title, 20, 20);
  
  // Metadata
  if (data.metadata) {
    doc.setFontSize(10);
    let yPos = 30;
    if (data.metadata.createdAt) {
      doc.text(`Created: ${data.metadata.createdAt}`, 20, yPos);
      yPos += 5;
    }
    if (data.metadata.style) {
      doc.text(`Style: ${data.metadata.style}`, 20, yPos);
      yPos += 5;
    }
    if (data.metadata.duration) {
      doc.text(`Duration: ${data.metadata.duration}`, 20, yPos);
      yPos += 5;
    }
    yPos += 5;
  }
  
  // Summary
  doc.setFontSize(12);
  const summaryLines = doc.splitTextToSize(data.summary, 170);
  doc.text(summaryLines, 20, data.metadata ? 50 : 30);
  
  // Transcript (if available)
  if (data.transcript) {
    let yPos = doc.internal.pageSize.getHeight() - 20;
    if (yPos < 100) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.text('Transcript', 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    const transcriptLines = doc.splitTextToSize(data.transcript, 170);
    doc.text(transcriptLines, 20, yPos);
  }
  
  doc.save(`${data.title.replace(/[^a-z0-9]/gi, '_')}_summary.pdf`);
};

// Export as Word Document
export const exportToWord = async (data: ExportData) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: data.title,
          heading: HeadingLevel.HEADING_1,
        }),
        ...(data.metadata ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `Created: ${data.metadata.createdAt || 'N/A'}`,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Style: ${data.metadata.style || 'N/A'}`,
                size: 20,
              }),
            ],
          }),
        ] : []),
        new Paragraph({
          text: 'Summary',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: data.summary,
        }),
        ...(data.transcript ? [
          new Paragraph({
            text: 'Transcript',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: data.transcript,
          }),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.title.replace(/[^a-z0-9]/gi, '_')}_summary.docx`;
  link.click();
  URL.revokeObjectURL(url);
};

// Export as Markdown
export const exportToMarkdown = (data: ExportData) => {
  let markdown = `# ${data.title}\n\n`;
  
  if (data.metadata) {
    markdown += `**Created:** ${data.metadata.createdAt || 'N/A'}\n`;
    markdown += `**Style:** ${data.metadata.style || 'N/A'}\n`;
    if (data.metadata.duration) {
      markdown += `**Duration:** ${data.metadata.duration}\n`;
    }
    markdown += '\n';
  }
  
  markdown += `## Summary\n\n${data.summary}\n\n`;
  
  if (data.transcript) {
    markdown += `## Transcript\n\n${data.transcript}\n\n`;
  }
  
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.title.replace(/[^a-z0-9]/gi, '_')}_summary.md`;
  link.click();
  URL.revokeObjectURL(url);
};

// Copy to Clipboard
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Print-friendly view
export const printSummary = (data: ExportData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #0d9488; }
          h2 { color: #14b8a6; margin-top: 30px; }
          .metadata { color: #666; font-size: 14px; margin-bottom: 20px; }
          .summary { line-height: 1.6; margin: 20px 0; }
          .transcript { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        ${data.metadata ? `
          <div class="metadata">
            <p><strong>Created:</strong> ${data.metadata.createdAt || 'N/A'}</p>
            <p><strong>Style:</strong> ${data.metadata.style || 'N/A'}</p>
            ${data.metadata.duration ? `<p><strong>Duration:</strong> ${data.metadata.duration}</p>` : ''}
          </div>
        ` : ''}
        <h2>Summary</h2>
        <div class="summary">${data.summary.replace(/\n/g, '<br>')}</div>
        ${data.transcript ? `
          <h2>Transcript</h2>
          <div class="transcript">${data.transcript.replace(/\n/g, '<br>')}</div>
        ` : ''}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
