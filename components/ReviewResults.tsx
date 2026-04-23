import React, { useRef } from 'react';
import { cleanDisplayValue, reviewResultsToText, stripMarkdownArtifacts } from '../lib/displayText';

type Authority = {
  caseName?: string;
  citation?: string;
  court?: string;
  date?: string;
  url?: string;
};

type ReviewResultsProps = {
  results: any; // string or structured object { issues, suggestions, authorities }
  className?: string;
};

export default function ReviewResults({ results, className = '' }: ReviewResultsProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  if (results == null) return null;

  if (typeof results === 'string' && results.trim().length === 0) {
    return (
      <div className={`mt-6 border-t pt-4 ${className}`}>
        <h4 className="font-semibold mb-2">Analysis Result</h4>
        <div className="text-sm text-gray-600">No results</div>
      </div>
    );
  }

  const displayResults = cleanDisplayValue(results);

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(displayResults, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'review-results.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadTXT = () => {
    const blob = new Blob([reviewResultsToText(results)], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'review-results.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .from(contentRef.current)
        .set({
          margin: 0.5,
          filename: 'review-results.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {},
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        })
        .save();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error: Failed to download PDF.');
    }
  };

  if (typeof results === 'string') {
    return (
      <div className={`mt-6 border-t pt-4 ${className}`}>
        <div ref={contentRef}>
          <h4 className="font-semibold mb-2">Analysis Result</h4>
          <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
            {stripMarkdownArtifacts(results)}
          </pre>
        </div>
        <div className="mt-3 flex gap-2 justify-end">
          <button onClick={downloadPDF} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Download PDF</button>
          <button onClick={downloadTXT} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Download TXT</button>
          <button onClick={downloadJSON} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Download JSON</button>
        </div>
      </div>
    );
  }

  const { issues, suggestions, authorities } = displayResults || {};

  return (
    <div className={`mt-4 p-4 border rounded bg-gray-50 ${className}`}>
      <div className="flex justify-between items-start gap-3">
        <h4 className="font-semibold">Review Results</h4>
        <div className="flex gap-2">
          <button onClick={downloadPDF} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Download PDF</button>
          <button onClick={downloadTXT} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Download TXT</button>
          <button onClick={downloadJSON} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Download JSON</button>
        </div>
      </div>

      <div ref={contentRef}>
        {issues && issues.length > 0 && (
          <div className="mt-2">
            <span className="font-medium">Issues:</span>
            <ul className="list-disc list-inside ml-4 mt-1">
              {issues.map((issue: any, idx: number) => (
                <li key={idx} className="text-red-600">
                  {typeof issue === 'string' ? issue : `${issue.section ? issue.section + ': ' : ''}${issue.finding || ''}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="mt-2">
            <span className="font-medium">Suggestions:</span>
            <ul className="list-disc list-inside ml-4 mt-1">
              {suggestions.map((s: string, idx: number) => (
                <li key={idx} className="text-green-600">{s}</li>
              ))}
            </ul>
          </div>
        )}

        {authorities && authorities.length > 0 && (
          <div className="mt-2">
            <span className="font-medium">Authorities:</span>
            <ul className="list-disc list-inside ml-4 mt-1">
              {authorities.map((a: Authority, idx: number) => (
                <li key={idx} className="text-blue-600">
                  {a.caseName ? `${a.caseName} (${a.citation})` : a.citation}
                  {a.court ? ` - ${a.court}` : ''}
                  {a.date ? ` (${a.date})` : ''}
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noreferrer" className="ml-2 text-blue-700 underline">link</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
