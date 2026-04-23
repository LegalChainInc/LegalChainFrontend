// pages/features/comparison.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

// ── Types ─────────────────────────────────────────────────────────────────

type ChangeType = 'Added' | 'Removed' | 'Modified' | 'Relocated' | 'Unchanged';

interface DiffPair {
  change_type: ChangeType;
  word_delta: number;
  word_delta_display: string;
  location_change: string | null;
  blocks: any[] | null;
}

// Shape from structuralDiffService.diffAlignedClause()
interface ClauseDiff {
  against_b: DiffPair;
  against_c: DiffPair | null;
}

interface SemanticFlag {
  flag: string;
  reason: string;
}

interface ClauseText {
  clause_id: string;
  text: string;
  position?: number;
  hash?: string;
}

interface AlignedResult {
  clause_id: string;
  clauses: {
    baseline: ClauseText | null;
    compare_b: ClauseText | null;
    compare_c: ClauseText | null;
  };
  diff: ClauseDiff;
  flags: SemanticFlag[];
}

interface DocMeta {
  document_id: string;
  hash: string;
  metadata: Record<string, any>;
  clause_count: number;
}

interface ComparisonResponse {
  disclaimer: string;
  comparison_version: string;
  baseline: DocMeta;
  comparisons: Array<{ key: string } & DocMeta>;
  aligned_clause_rows: number;
  results: AlignedResult[];
  comparison_output_hash: string;
}

// ── Styling maps ──────────────────────────────────────────────────────────

const CHANGE_BORDER: Record<ChangeType, string> = {
  Added:     'border-l-4 border-green-500 bg-green-50',
  Removed:   'border-l-4 border-red-500 bg-red-50',
  Modified:  'border-l-4 border-yellow-400 bg-yellow-50',
  Relocated: 'border-l-4 border-blue-400 bg-blue-50',
  Unchanged: 'border-l-4 border-gray-200 bg-white',
};

const CHANGE_BADGE: Record<ChangeType, string> = {
  Added:     'bg-green-100 text-green-800',
  Removed:   'bg-red-100 text-red-800',
  Modified:  'bg-yellow-100 text-yellow-800',
  Relocated: 'bg-blue-100 text-blue-800',
  Unchanged: 'bg-gray-100 text-gray-500',
};

// ── Auth (same pattern as legal-review.tsx) ───────────────────────────────

async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) return data.session.access_token;
  } catch (_) {}
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      const v = localStorage.getItem(k);
      if (!v) continue;
      if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(v)) return v;
      try {
        const o = JSON.parse(v);
        if (o?.access_token) return o.access_token;
        if (o?.token) return o.token;
        if (o?.currentSession?.access_token) return o.currentSession.access_token;
        if (o?.data?.session?.access_token) return o.data.session.access_token;
      } catch {}
    }
  }
  return null;
}

// ── FileInput ─────────────────────────────────────────────────────────────

function FileInput({
                     id, label, required, file, onChange, onRemove,
                   }: {
  id: string;
  label: string;
  required: boolean;
  file: File | null;
  onChange: (f: File | null) => void;
  onRemove?: () => void;
}) {
  return (
      <div>
        <label className="block font-medium mb-1" htmlFor={id}>
          {label}{' '}
          {required
              ? <span className="text-red-500">*</span>
              : <span className="text-gray-400 font-normal">(optional)</span>}
        </label>
        <input
            id={id}
            type="file"
            accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
            required={required}
            className="w-full border rounded p-2 text-sm"
        />
        {file && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">Selected: {file.name}</p>
              {onRemove && (
                  <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
              )}
            </div>
        )}
      </div>
  );
}

// ── ClauseTextBox ─────────────────────────────────────────────────────────

function ClauseTextBox({ label, clause }: { label: string; clause: ClauseText | null }) {
  return (
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
        <div className="bg-white border rounded p-2 text-sm text-gray-700 min-h-[60px] whitespace-pre-wrap leading-relaxed">
          {clause?.text ?? <span className="text-gray-400 italic">Not present</span>}
        </div>
      </div>
  );
}

// ── ClauseRow ─────────────────────────────────────────────────────────────

function ClauseRow({ result, hasThirdDoc }: { result: AlignedResult; hasThirdDoc: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { clause_id, clauses, diff, flags } = result;

  // Primary diff is always against_b
  const primaryDiff  = diff?.against_b;
  const secondaryDiff = diff?.against_c;
  const changeType: ChangeType = primaryDiff?.change_type ?? 'Unchanged';

  // If 3-doc and B is unchanged but C differs, surface C's change type
  const effectiveChangeType: ChangeType =
      hasThirdDoc && changeType === 'Unchanged' && secondaryDiff?.change_type !== 'Unchanged'
          ? (secondaryDiff?.change_type ?? 'Unchanged')
          : changeType;

  return (
      <div className={`rounded mb-3 overflow-hidden ${CHANGE_BORDER[effectiveChangeType]}`}>
        {/* Header */}
        <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/5 transition-colors"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-gray-800">{clause_id}</span>

            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CHANGE_BADGE[effectiveChangeType]}`}>
            {effectiveChangeType}
          </span>

            {primaryDiff?.word_delta_display && primaryDiff.word_delta_display !== '0' && (
                <span className="text-xs text-gray-500">vs B: {primaryDiff.word_delta_display} words</span>
            )}

            {hasThirdDoc && secondaryDiff?.word_delta_display && secondaryDiff.word_delta_display !== '0' && (
                <span className="text-xs text-gray-500">vs C: {secondaryDiff.word_delta_display} words</span>
            )}

            {flags?.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {flags.length} flag{flags.length > 1 ? 's' : ''}
            </span>
            )}
          </div>
          <span className="text-gray-400 text-sm ml-2">{expanded ? '▲' : '▼'}</span>
        </button>

        {/* Expanded body */}
        {expanded && (
            <div className="px-4 pb-4 space-y-4">
              {/* Side-by-side clause text */}
              <div className={`grid gap-3 ${hasThirdDoc ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <ClauseTextBox label="Baseline"   clause={clauses.baseline} />
                <ClauseTextBox label="Document B" clause={clauses.compare_b} />
                {hasThirdDoc && <ClauseTextBox label="Document C" clause={clauses.compare_c} />}
              </div>

              {/* Location shifts */}
              {(primaryDiff?.location_change || secondaryDiff?.location_change) && (
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {primaryDiff?.location_change  && <p>Location shift (vs B): {primaryDiff.location_change}</p>}
                    {secondaryDiff?.location_change && <p>Location shift (vs C): {secondaryDiff.location_change}</p>}
                  </div>
              )}

              {/* Semantic flags */}
              {flags?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-orange-600 uppercase mb-1">Flags</p>
                    <ul className="space-y-1">
                      {flags.map((f, i) => (
                          <li key={i} className="text-sm bg-orange-50 border border-orange-200 rounded px-3 py-1.5">
                            <span className="font-medium text-orange-800">{f.flag}:</span>{' '}
                            <span className="text-orange-700">{f.reason}</span>
                          </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-400 mt-1 italic">
                      These flags highlight changes commonly associated with legal impact and do not constitute legal advice.
                    </p>
                  </div>
              )}
            </div>
        )}
      </div>
  );
}

// ── Summary stats ─────────────────────────────────────────────────────────

function SummaryStats({ results }: { results: AlignedResult[] }) {
  const counts = results.reduce<Record<string, number>>((acc, r) => {
    const t = r.diff?.against_b?.change_type ?? 'Unchanged';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const order: ChangeType[] = ['Modified', 'Added', 'Removed', 'Relocated', 'Unchanged'];

  return (
      <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-5">
        {order.map((type) => (
            <div key={type} className={`rounded p-3 text-center ${CHANGE_BADGE[type]}`}>
              <p className="text-2xl font-bold">{counts[type] ?? 0}</p>
              <p className="text-xs font-medium">{type}</p>
            </div>
        ))}
      </div>
  );
}

// ── ComparisonResults ─────────────────────────────────────────────────────

function ComparisonResults({ data }: { data: ComparisonResponse }) {
  const hasThirdDoc = data.comparisons.length >= 2;

  return (
      <div className="mt-6 border-t pt-4">
        {/* Disclaimer */}
        <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          {data.disclaimer}
        </div>

        {/* Summary counts */}
        <SummaryStats results={data.results} />

        {/* Audit metadata */}
        <div className="mb-4 p-3 bg-gray-50 rounded text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600">Document Hashes (audit trail)</p>
          <p>Baseline: {data.baseline.clause_count} clauses · {data.baseline.hash.slice(0, 16)}…</p>
          {data.comparisons.map((c, i) => (
              <p key={i}>
                Document {String.fromCharCode(66 + i)}: {c.clause_count} clauses · {c.hash.slice(0, 16)}…
              </p>
          ))}
          <p>Output hash: {data.comparison_output_hash.slice(0, 16)}…</p>
          <p>Version: {data.comparison_version}</p>
        </div>

        {/* Clause rows */}
        <h2 className="font-semibold text-gray-800 mb-3">
          Clause Comparison ({data.aligned_clause_rows} clauses)
        </h2>
        {data.results.map((result) => (
            <ClauseRow key={result.clause_id} result={result} hasThirdDoc={hasThirdDoc} />
        ))}
      </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function DocumentComparisonPage() {
  const router = useRouter();
  const [baselineFile, setBaselineFile] = useState<File | null>(null);
  const [compareFileB, setCompareFileB] = useState<File | null>(null);
  const [compareFileC, setCompareFileC] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult]   = useState<ComparisonResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResult(null);

    if (!baselineFile || !compareFileB) {
      setError('Please upload at least a baseline document and one comparison document.');
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('You are not logged in. Please log in to continue.');

      const fd = new FormData();
      fd.append('baselineFile', baselineFile);
      fd.append('compareFiles', compareFileB);
      if (compareFileC) fd.append('compareFiles', compareFileC);

      const res = await fetch(`${API_BASE}/api/ai/compareDocuments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Comparison failed (${res.status})`);

      setResult(json as ComparisonResponse);
      setMessage('Comparison complete!');
    } catch (err: any) {
      console.error('[FE] compareDocuments error:', err?.message || err);
      setError(err?.message || 'Failed to compare documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-start justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl">

          <div className="mb-4">
            <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              ← Back to Home
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-2 text-center">Document Comparison</h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            Upload 2–3 documents to compare. Supported: .docx, .pdf, .txt
          </p>

          {message && (
              <div className="mb-4 p-3 rounded bg-green-100 text-green-800 border border-green-300">{message}</div>
          )}
          {error && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-800 border border-red-300">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FileInput
                id="baseline"
                label="Baseline Document"
                required
                file={baselineFile}
                onChange={setBaselineFile}
            />
            <FileInput
                id="compare-b"
                label="Compare Document B"
                required
                file={compareFileB}
                onChange={setCompareFileB}
            />
            <FileInput
                id="compare-c"
                label="Compare Document C"
                required={false}
                file={compareFileC}
                onChange={setCompareFileC}
                onRemove={() => setCompareFileC(null)}
            />

            <button
                type="submit"
                disabled={loading || !baselineFile || !compareFileB}
                className={`w-full py-3 bg-blue-600 text-white font-semibold rounded transition-colors ${
                    loading || !baselineFile || !compareFileB
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-blue-700'
                }`}
            >
              {loading ? (
                  <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Comparing…
              </span>
              ) : 'Compare Documents'}
            </button>
          </form>

          {result && <ComparisonResults data={result} />}
        </div>
      </div>
  );
}