import React, { useState } from 'react';
import { Download, FileText, File, Copy, Printer, ChevronDown } from 'lucide-react';
import { exportToPDF, exportToWord, exportToMarkdown, copyToClipboard, printSummary, ExportData } from '@/utils/export';
import toast from 'react-hot-toast';

interface ExportMenuProps {
  data: ExportData;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (type: 'pdf' | 'word' | 'markdown' | 'copy' | 'print') => {
    try {
      switch (type) {
        case 'pdf':
          await exportToPDF(data);
          toast.success('Summary exported as PDF');
          break;
        case 'word':
          await exportToWord(data);
          toast.success('Summary exported as Word document');
          break;
        case 'markdown':
          exportToMarkdown(data);
          toast.success('Summary exported as Markdown');
          break;
        case 'copy':
          const success = await copyToClipboard(data.summary);
          if (success) {
            toast.success('Summary copied to clipboard');
          } else {
            toast.error('Failed to copy to clipboard');
          }
          break;
        case 'print':
          printSummary(data);
          break;
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(`Failed to export: ${error}`);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>Export</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Export as PDF</span>
              </button>
              <button
                onClick={() => handleExport('word')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <File className="h-4 w-4" />
                <span>Export as Word</span>
              </button>
              <button
                onClick={() => handleExport('markdown')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Export as Markdown</span>
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={() => handleExport('copy')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy to Clipboard</span>
              </button>
              <button
                onClick={() => handleExport('print')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportMenu;



