import React, { useRef } from 'react';
import { stripMarkdownArtifacts } from '../lib/displayText';

type Reference = { citation?: string; caseName?: string; court?: string; date?: string; url?: string };
type Section = { heading: string; id: string };

function sanitizeHtml(input: string) {
  if (!input) return '';
  // Use DOMPurify for robust sanitization; allow target attribute for links
  try {
    if (typeof window !== 'undefined') {
      // Load DOMPurify on the client only to avoid SSR errors
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const DOMPurifyRaw = require('dompurify');
      const createDOMPurify = DOMPurifyRaw.default || DOMPurifyRaw;
      const dp = createDOMPurify(window as any);
      return dp.sanitize(input, { ADD_ATTR: ['target'] });
    }
    // If no window (SSR), fall through to naive sanitizer below
  } catch (e) {
    // Fallback to naive sanitizer if DOMPurify fails
    let out = input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    out = out.replace(/ on[a-zA-Z]+=\"[\s\S]*?\"/gi, '');
    out = out.replace(/ on[a-zA-Z]+=\'[\s\S]*?\'/gi, '');
    out = out.replace(/href=\"javascript:[^\"]*\"/gi, '');
    out = out.replace(/src=\"javascript:[^\"]*\"/gi, '');
    return out;
  }
}

export default function ContractRenderer({
  contract,
  structure = [],
  references = [],
  usedFallback = false,
  openAIUsed = false,
  hallucinationWarning = false,
  isHtml,
  warnings = [],
}: {
  contract: string;
  structure?: Section[];
  references?: Reference[];
  usedFallback?: boolean;
  openAIUsed?: boolean;
  hallucinationWarning?: boolean;
  isHtml?: boolean;
  warnings?: string[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const displayContract = stripMarkdownArtifacts(contract);

  const scrollToSection = (id?: string, heading?: string) => {
    // Try by id first
    if (id) {
      const elById = document.getElementById(id);
      if (elById) return elById.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Fallback: search for heading text inside the rendered container
    if (heading && containerRef.current) {
      const children = Array.from(containerRef.current.querySelectorAll('*')) as HTMLElement[];
      for (const el of children) {
        if (el.innerText && el.innerText.trim().toLowerCase().includes(heading.trim().toLowerCase())) {
          return el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const looksLikeHtml = (s: string) => /<[^>]+>/.test(s || '');

  return (
    <div className="text-black">
      {/* Flag badges */}
      {(usedFallback || openAIUsed || hallucinationWarning) && (
        <div className="flex flex-wrap gap-2 mb-4" aria-label="generation-flags">
          {openAIUsed && !usedFallback && (
            <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white" title="Draft generated via AI model">AI Draft</span>
          )}
          {usedFallback && (
            <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-amber-500 text-white" title="Fallback deterministic formatter used">Fallback Draft</span>
          )}
          {hallucinationWarning && (
            <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-yellow-600 text-white" title="Some provided clause snippets not found verbatim">Hallucination Risk</span>
          )}
        </div>
      )}

      {structure.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Table of Contents</h3>
          <ul className="list-disc list-inside space-y-1">
            {structure.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => scrollToSection(s.id, s.heading)}
                  className="text-blue-600 hover:underline text-left"
                >
                  {stripMarkdownArtifacts(s.heading)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hallucinationWarning && (
        <div className="p-3 bg-yellow-100 text-yellow-800 rounded mb-4 text-sm" role="alert">
          Warning: Generated content may contain hallucinated references. Review carefully.
        </div>
      )}
      {Array.isArray(warnings) && warnings.length > 0 && (
        <div className="mb-4 text-sm" aria-label="warnings-list">
          <strong>Warnings:</strong>
          <ul className="list-disc ml-5">
            {warnings.map((w, i) => <li key={i}>{stripMarkdownArtifacts(w)}</li>)}
          </ul>
        </div>
      )}

      <div ref={containerRef} className="prose max-w-none">
        {(isHtml || looksLikeHtml(contract)) ? (
          // Minimal sanitization; backend should provide safe HTML when possible
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayContract) }} />
        ) : (
          <pre className="whitespace-pre-wrap">{displayContract}</pre>
        )}
      </div>

      {references.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h3 className="font-bold text-lg mb-2">References</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            {references.map((r, idx) => (
              <li key={idx}>
                {stripMarkdownArtifacts(r.citation || r.caseName || '')}
                {r.court ? ` - ${stripMarkdownArtifacts(r.court)}` : ''}{r.date ? ` (${stripMarkdownArtifacts(r.date)})` : ''}{' '}
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    link
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
