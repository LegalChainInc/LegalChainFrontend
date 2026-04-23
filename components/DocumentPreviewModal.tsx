import React from 'react';
import html2pdf from 'html2pdf.js';
import { stripMarkdownArtifacts } from '../lib/displayText';

type Props = {
  title?: string;
  textContent?: string;
  children?: React.ReactNode;
  onClose: () => void;
  contentDomId?: string;
};

export default function DocumentPreviewModal({
  title = 'Document Preview',
  textContent,
  children,
  onClose,
  contentDomId = 'doc-content',
}: Props) {
  const downloadPDF = () => {
    const el = document.getElementById(contentDomId);
    if (!el) {
      console.error('Element with ID not found:', contentDomId);
      alert('Error: Document element not found.');
      return;
    }

    const opt = {
      margin: 0.5,
      filename: 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {},
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf()
      .from(el)
      .set(opt)
      .save()
      .catch((error) => {
        console.error('Error downloading PDF:', error);
        alert('Error: Failed to download PDF.');
      });
  };

  const downloadTXT = () => {
    if (!textContent) {
      console.warn('No text content to download.');
      alert('Error: No text content available.');
      return;
    }

    try {
      const blob = new Blob([stripMarkdownArtifacts(textContent)], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'document.txt';
      a.click();
      URL.revokeObjectURL(a.href); // Clean up the URL object
    } catch (error) {
      console.error('Error downloading TXT:', error);
      alert('Error: Failed to download TXT.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* stop click-through */}
      <div
        className="bg-white max-w-3xl w-[92vw] rounded-lg shadow-xl p-6 relative text-black overflow-y-auto max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-600 hover:text-red-500 text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="text-xl font-bold mb-4">{title}</h2>

        <div id={contentDomId} className="whitespace-pre-wrap text-sm text-gray-800">
          {children ? children : stripMarkdownArtifacts(textContent || '')}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={downloadPDF}
            className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
          >
            Download PDF
          </button>
          {textContent && (
            <button
              onClick={downloadTXT}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Download TXT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
