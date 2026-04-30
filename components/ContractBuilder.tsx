import React, { useEffect, useState } from 'react';
import { api } from '../lib/contractApi';
import contractSchemas from '../src/config/contractSchemas';
import JurisdictionSelector from './ui/JurisdictionSelector';
import { stripMarkdownArtifacts } from '../lib/displayText';

// Note: DOMPurify requires a window to initialize with JSDOM in SSR-free codepath.
// We'll require it at runtime on the client only.
let createDOMPurify: any = null;
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const DOMPurifyRaw = require('dompurify');
  createDOMPurify = DOMPurifyRaw.default || DOMPurifyRaw;
}

type FieldMeta = {
  key: string;
  label?: string;
  itemType?: string;
  options?: string[];
};

export default function ContractBuilder() {
  const [types, setTypes] = useState<Array<{ key: string; displayName: string }>>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [fieldsMeta, setFieldsMeta] = useState<FieldMeta[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [parties, setParties] = useState<string[]>(['', '']);
  const [clauses, setClauses] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  // Flag state (exposed for downstream components if needed later)
  const [usedFallback, setUsedFallback] = useState<boolean>(false);
  const [openAIUsed, setOpenAIUsed] = useState<boolean>(false);
  const [isHtml, setIsHtml] = useState<boolean>(false);
  const [hallucinationWarning, setHallucinationWarning] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    // Prefer local schemas shipped in src/config/contractSchemas.js (from product sheet).
    try {
  // Include canonical contract types: STANDARD, SERVICE, NDA, EMPLOYMENT, SALES, LEASE, MSA,
  // and additional investment/IP types: SAFE, EQUITY, IP_LICENSE
  const allowed = ['STANDARD', 'SERVICE', 'NDA', 'EMPLOYMENT', 'SALES', 'LEASE', 'MSA', 'SAFE', 'EQUITY', 'IP_LICENSE', 'PARTNERSHIP'];
      const local = Object.values(contractSchemas || {})
        .map((s: any) => ({ key: s.key, displayName: s.label || s.key }))
        .filter((t: any) => allowed.includes(String(t.key).toUpperCase()));
      setTypes(local);
      if (local.length > 0) setSelectedType(local[0].key);
      return;
    } catch (err) {
      // fallback to backend endpoint if local schema parsing fails
    }

    let mounted = true;
    api.getTypes().then((res) => {
      if (!mounted) return;
      const tlist = (res?.types || []).map((t: any) => ({ key: t.key, displayName: t.displayName || t.key }));
      setTypes(tlist);
      if (tlist.length > 0) setSelectedType(tlist[0].key);
    }).catch((e) => setError(String(e?.message || e)));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedType) return;
    setFieldsMeta([]);
    setFormValues({});
    setError(null);

    // Load from local contractSchemas first
    const key = String(selectedType || '').toUpperCase();
    const localSchema = (contractSchemas as any)[key];
    if (localSchema && Array.isArray(localSchema.fields)) {
      const fields = localSchema.fields.map((f: any) => ({
        key: f.key,
        label: f.label || f.key,
        itemType: f.type === 'repeatable' ? (f.itemType || 'textarea') : (f.itemType || undefined),
        options: f.options || undefined,
      } as FieldMeta));

      setFieldsMeta(fields);
      const seed: Record<string, any> = {};
      fields.forEach((f: any) => {
        seed[f.key] = f.itemType === 'repeatable' ? [''] : '';
      });
      setFormValues(seed);
      setParties(['', '']);
      setClauses(['']);
      return;
    }

    // fallback: fetch from backend
    let mounted = true;
    api.getFields(selectedType).then((res) => {
      if (!mounted) return;
      const fields = res?.fields || [];
      setFieldsMeta(fields);
      const seed: Record<string, any> = {};
      fields.forEach((f: any) => {
        seed[f.key] = f.itemType === 'repeatable' || f.type === 'repeatable' ? [''] : '';
      });
      setFormValues(seed);
      setParties(['', '']);
      setClauses(['']);
    }).catch((e) => setError(String(e?.message || e)));
    return () => { mounted = false; };
  }, [selectedType]);

  const updateField = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const addParty = () => setParties(prev => [...prev, '']);
  const removeParty = (idx: number) => setParties(prev => prev.filter((_, i) => i !== idx));
  const updateParty = (idx: number, val: string) => setParties(prev => { const next = [...prev]; next[idx] = val; return next; });

  const addClause = () => setClauses(prev => [...prev, '']);
  const removeClause = (idx: number) => setClauses(prev => prev.filter((_, i) => i !== idx));
  const updateClause = (idx: number, val: string) => setClauses(prev => { const next = [...prev]; next[idx] = val; return next; });

  const normalizeResponse = (resp: any) => {
    // Normalize backend shape to a unified object
    if (!resp) return null;
    const html = resp.html || (resp.isHtml ? resp.contractText || resp.contract : null) || null;
    const text = resp.text || (!resp.isHtml ? resp.contractText || resp.contract : null) || null;
    const warnings = Array.isArray(resp.warnings) ? resp.warnings : [];
    const hallucination = !!resp.hallucinationWarning;
    const references = resp.references || resp.authority_and_references || [];
    return {
      html,
      text,
      warnings,
      hallucinationWarning: hallucination,
      references,
      isHtml: !!resp.isHtml || !!html,
      usedFallback: !!resp.usedFallback,
      openAIUsed: resp.openAIUsed !== undefined ? !!resp.openAIUsed : !resp.usedFallback,
      raw: resp,
    };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    // Party alias normalization (single party allowed; backend will insert placeholder for missing side)
    const partyAAliases = ['partyA','investor','licensor','assignor','issuer','company','employer','buyer','landlord'];
    const partyBAliases = ['partyB','company','licensee','assignee','holder','employee','seller','tenant'];
    const isEmployment = String(selectedType || '').toUpperCase() === 'EMPLOYMENT';
    const isPartnership = String(selectedType || '').toUpperCase() === 'PARTNERSHIP';
    const explicitParties = parties.map(p => (p || '').trim()).filter(Boolean);
    const isIpLicense = String(selectedType || '').toUpperCase() === 'IP_LICENSE';

    const aliasValue = (aliases: string[]): string | undefined => {
      for (const a of aliases) {
        const v = (formValues as any)[a];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return undefined;
    };

    let partyA = aliasValue(partyAAliases);
    let partyB = aliasValue(partyBAliases);

    // Map generic Parties input into canonical slots if aliases missing
    if (explicitParties.length > 0) {
      if (!partyA) partyA = explicitParties[0];
      if (explicitParties.length > 1 && !partyB) partyB = explicitParties[1];
    }

    // Require at least one party alias/entry unless IP License (zero allowed)
    const isSafe = String(selectedType || '').toUpperCase() === 'SAFE';
    if (!isIpLicense && !isEmployment && !isSafe && !isPartnership && !partyA && !partyB) {
      setError('Please provide at least one party (e.g., Licensor, Licensee, Company, Investor).');
      return;
    }

    const dedupParties = Array.from(new Set([partyA, partyB].filter(Boolean))) as string[];
    if (isEmployment && (!partyA || !partyB)) {
      setError('Please provide Employer (Party A) and Employee (Party B).');
      return;
    }
    if (isSafe && (!partyA || !partyB)) {
      setError('Please provide Investor (Party A) and Company (Party B).');
      return;
    }
    if (isPartnership) {
      // Derive from partners list if not set
      const partnersArr = Array.isArray(formValues.partners) ? formValues.partners.filter((p: any) => p && String(p).trim()) : [];
      if (!partyA && partnersArr[0]) partyA = partnersArr[0].trim();
      if (!partyB && partnersArr[1]) partyB = partnersArr[1].trim();
      if (!partyA || !partyB) {
        setError('Please provide at least two partners (Party A and Party B).');
        return;
      }
    }

    const goodClauses = clauses.map(c => (c || '').trim()).filter(Boolean);
    if (goodClauses.length === 0) {
      setError('Please add at least one clause.');
      return;
    }

    const payload: Record<string, any> = {
      type: selectedType,
      parties: dedupParties,
      partyA: partyA,
      partyB: partyB,
      clauses: goodClauses.map((c: string) => ({ id: null, text: c })),
      jurisdiction: formValues.jurisdiction || formValues.governingLaw || '',
      effectiveDate: formValues.effectiveDate || undefined,
    };

    if (debugMode) payload.debugFields = true;

    // attach per-type fields
    for (const f of fieldsMeta) {
      const k = f.key;
      if (k in formValues) payload[k] = formValues[k];
    }

    setLoading(true);
    try {
      const resp = await api.generate(payload);
      const normalized = normalizeResponse(resp);
      setResult(normalized);
      // Update flag state for badges / downstream usage
      setUsedFallback(!!normalized?.usedFallback);
      setOpenAIUsed(!!normalized?.openAIUsed);
      setIsHtml(!!normalized?.isHtml);
      setHallucinationWarning(!!normalized?.hallucinationWarning);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const renderField = (f: FieldMeta) => {
    const key = f.key;
    const label = f.label || key;
    const value = formValues[key];

    // heuristics
    const lower = label.toLowerCase();
  if (f.options && Array.isArray(f.options)) {
      return (
        <div key={key} className="mb-4">
          <label className="block font-medium mb-1">{label}</label>
          <select className="w-full border px-3 py-2 rounded" value={value || ''} onChange={(e) => updateField(key, e.target.value)}>
            <option value="">--</option>
            {f.options!.map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    if (lower.includes('date') || lower.includes('start') || lower.includes('end')) {
      return (
        <div key={key} className="mb-4">
          <label className="block font-medium mb-1">{label}</label>
          <input type="date" className="w-full border px-3 py-2 rounded" value={value || ''} onChange={(e) => updateField(key, e.target.value)} />
        </div>
      );
    }

    if (lower.includes('price') || lower.includes('fee') || lower.includes('rent') || lower.includes('amount')) {
      return (
        <div key={key} className="mb-4">
          <label className="block font-medium mb-1">{label}</label>
          <input type="number" step="0.01" className="w-full border px-3 py-2 rounded" value={value || ''} onChange={(e) => updateField(key, e.target.value)} />
        </div>
      );
    }

    if (f.itemType === 'textarea' || lower.includes('scope') || lower.includes('description') || lower.includes('clause') || lower.includes('deliverable') || lower.includes('fees')) {
      if (Array.isArray(value)) {
        // repeatable
        return (
          <div key={key} className="mb-4">
            <label className="block font-medium mb-1">{label}</label>
            {value.map((it: string, idx: number) => (
              <div key={idx} className="mb-2">
                <textarea className="w-full border px-3 py-2 rounded" value={it} onChange={(e) => {
                  const next = [...value]; next[idx] = e.target.value; updateField(key, next);
                }} />
                <div className="flex gap-2 mt-1">
                  <button type="button" className="text-sm text-red-600" onClick={() => { const next = value.filter((_: any, i: number) => i !== idx); updateField(key, next); }}>Remove</button>
                </div>
              </div>
            ))}
            <button type="button" className="text-sm text-blue-600" onClick={() => updateField(key, [...(value || []), ''])}>+ Add</button>
          </div>
        );
      }

      return (
        <div key={key} className="mb-4">
          <label className="block font-medium mb-1">{label}</label>
          <textarea className="w-full border px-3 py-2 rounded" value={value || ''} onChange={(e) => updateField(key, e.target.value)} />
        </div>
      );
    }

    // repeatable field type
    if (f.itemType === 'text' || f.itemType === 'repeatable') {
      const items = Array.isArray(value) ? value : [''];
      return (
        <div key={key} className="mb-4">
          <label className="block font-medium mb-1">{label}</label>
          {items.map((it: string, idx: number) => (
            <div key={idx} className="mb-2">
              <input className="w-full border px-3 py-2 rounded" value={it} onChange={(e) => { const next = [...items]; next[idx] = e.target.value; updateField(key, next); }} />
            </div>
          ))}
          <button type="button" className="text-sm text-blue-600" onClick={() => updateField(key, [...items, ''])}>+ Add</button>
        </div>
      );
    }

    


    // fallback
    return (
      <div key={key} className="mb-4">
        <label className="block font-medium mb-1">{label}</label>
        <input className="w-full border px-3 py-2 rounded" value={value || ''} onChange={(e) => updateField(key, e.target.value)} />
      </div>
    );
  };

  const downloadAsPDF = async () => {
    const element = document.getElementById('contract-preview');
    if (!element) return;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .from(element)
        .set({
          margin: 0.5,
          filename: `${String(selectedType || 'contract').replace(/\s+/g, '_')}_Contract.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {},
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        })
        .save();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download PDF.');
    }
  };

  const downloadAsTXT = () => {
    const previewText = document.getElementById('contract-preview')?.innerText;
    const text = stripMarkdownArtifacts(result?.text || previewText || result?.html || '');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${String(selectedType || 'contract').replace(/\s+/g, '_')}_Contract.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const displayResultText = result?.text ? stripMarkdownArtifacts(result.text) : '';

  return (
    <div className="bg-white shadow rounded p-6 w-full max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">Contract Builder</h2>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} aria-live="polite">
        <div className="mb-4">
          <label className="block font-medium mb-1">Contract Type</label>
          <select className="w-full border px-3 py-2 rounded" value={selectedType || ''} onChange={(e) => setSelectedType(e.target.value)}>
            {types.map(t => <option key={t.key} value={t.key}>{t.displayName}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <JurisdictionSelector
            value={formValues.jurisdiction || ''}
            onChange={(val) => updateField('jurisdiction', val)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Effective Date</label>
          <input type="date" className="w-full border px-3 py-2 rounded" value={formValues.effectiveDate || ''} onChange={(e) => updateField('effectiveDate', e.target.value)} />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Parties</label>
          {parties.map((p, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input className="flex-1 border px-3 py-2 rounded" value={p} onChange={(e) => updateParty(i, e.target.value)} placeholder={i === 0 ? 'Party A' : `Party ${i + 1}`} />
              {parties.length > 2 && <button type="button" className="text-red-600" onClick={() => removeParty(i)}>Remove</button>}
            </div>
          ))}
          <button type="button" className="text-sm text-blue-600" onClick={addParty}>+ Add Party</button>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Clauses</label>
          {clauses.map((c, idx) => (
            <div key={idx} className="mb-2">
              <textarea className="w-full border px-3 py-2 rounded" value={c} onChange={(e) => updateClause(idx, e.target.value)} />
              <div className="flex gap-2 mt-1">
                {clauses.length > 1 && <button type="button" className="text-red-600" onClick={() => removeClause(idx)}>Remove</button>}
              </div>
            </div>
          ))}
          <button type="button" className="text-sm text-blue-600" onClick={addClause}>+ Add Clause</button>
        </div>

        {/* dynamic fields */}
        {fieldsMeta.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Additional Fields for {selectedType}</h3>
            {fieldsMeta.map((f) => renderField(f))}
          </div>
        )}

        <div className="flex gap-3 items-center">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Generating...' : 'Generate Contract'}</button>
          <button type="button" onClick={() => { setFormValues({}); setParties(['', '']); setClauses(['']); setResult(null); setError(null); }} className="px-3 py-2 border rounded">Reset</button>
          <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={showAdvanced} onChange={() => setShowAdvanced(v => !v)} /> Show advanced fields</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={debugMode} onChange={() => setDebugMode(v => !v)} /> Debug</label>
        </div>
      </form>

      {/* results */}
      <div className="mt-6">
        {/* Badge row */}
        {(usedFallback || openAIUsed || hallucinationWarning) && (
          <div className="flex flex-wrap gap-2 mb-3" aria-label="generation-flags">
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
        {result?.hallucinationWarning && <div className="p-3 bg-yellow-100 text-yellow-800 rounded mb-3">Warning: The generated contract may contain hallucinated references or content. Review carefully.</div>}
        {Array.isArray(result?.warnings) && result.warnings.length > 0 && (
          <div className="mb-3">
            <strong>Warnings:</strong>
            <ul className="list-disc ml-5">
              {result.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {result?.html && isHtml ? (
          <div id="contract-preview" className="prose max-w-none">
            {/* sanitize */}
            {typeof window !== 'undefined' && createDOMPurify ? (
              <div dangerouslySetInnerHTML={{ __html: createDOMPurify(window).sanitize(stripMarkdownArtifacts(result.html)) }} />
            ) : (
              <div>{result.html}</div>
            )}
          </div>
        ) : result?.text ? (
          <pre id="contract-preview" className="whitespace-pre-wrap bg-gray-50 p-4 rounded">{displayResultText}</pre>
        ) : null}

        {(result?.html || result?.text) && (
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={downloadAsPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={downloadAsTXT}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
            >
              Download TXT
            </button>
          </div>
        )}

        {result?.references && result.references.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium">References</h4>
            <ul className="list-disc ml-5">
              {result.references.map((r: any, i: number) => <li key={i}>{typeof r === 'string' ? r : JSON.stringify(r)}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
