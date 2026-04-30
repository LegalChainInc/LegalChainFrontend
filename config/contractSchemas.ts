export const contractSchemas: Record<string, any> = {
  STANDARD: {
    key: 'STANDARD',
    label: 'Standard Contract',
    fields: [
      { key: 'parties', label: 'Parties', type: 'parties', min: 2 },
      { key: 'effectiveDate', label: 'Effective Date', type: 'date' },
      { key: 'jurisdiction', label: 'Governing Law / Jurisdiction', type: 'text', placeholder: 'State, Country' },
      { key: 'clauses', label: 'Clauses', type: 'repeatable', itemType: 'textarea', placeholder: 'Confidentiality' },
      { key: 'term', label: 'Term / Duration', type: 'text', optional: true }
    ]
  },

  NDA: {
    key: 'NDA',
    label: 'NDA',
    fields: [
      { key: 'parties', label: 'Parties', type: 'parties', min: 2 },
      { key: 'effectiveDate', label: 'Effective Date', type: 'date' },
      { key: 'jurisdiction', label: 'Governing Law', type: 'text' },
      { key: 'confidentialDefinition', label: 'Definition of Confidential Information', type: 'textarea' },
      { key: 'duration', label: 'Duration', type: 'text', placeholder: '2 years' }
    ]
  },

  SERVICE: { key: 'SERVICE', label: 'Service Agreement', fields: [{ key:'parties', label:'Parties', type:'parties', min:2 }, { key:'scope', label:'Scope of Services', type:'textarea' }] },
  EMPLOYMENT: { key:'EMPLOYMENT', label:'Employment Agreement', fields: [{ key:'employer', label:'Employer', type:'text' }, { key:'employee', label:'Employee', type:'text' }] },
  // Extended Employment schema (mirrors src/config version) including Effective Date for consistency
  // Note: Retain original minimal version above if referenced elsewhere; consumers should prefer extended schema.
  EMPLOYMENT_EXTENDED: { key:'EMPLOYMENT', label:'Employment Agreement', fields: [
    { key:'employer', label:'Employer (Company)', type:'text' },
    { key:'employee', label:'Employee', type:'text' },
    { key:'effectiveDate', label:'Effective Date', type:'date' },
    { key:'jobTitle', label:'Job Title', type:'text' },
    { key:'duties', label:'Duties & Responsibilities', type:'textarea' },
    { key:'reportingLine', label:'Reporting Line', type:'text', optional:true },
    { key:'compensationDetails', label:'Compensation Details', type:'textarea' },
    { key:'employmentTerm', label:'Employment Term', type:'text' },
    { key:'renewalOptions', label:'Renewal Options', type:'text', optional:true },
    { key:'terminationGrounds', label:'Termination Grounds', type:'textarea' },
    { key:'noticePeriod', label:'Notice Period', type:'text' },
    { key:'severance', label:'Severance', type:'textarea', optional:true },
    { key:'confidentiality', label:'Confidentiality', type:'textarea' },
    { key:'ipAssignment', label:'IP Assignment', type:'checkbox', optional:true },
    { key:'nonCompete', label:'Non-Competition Clause / Restrictions', type:'textarea', optional:true },
    { key:'nonSolicitation', label:'Non-Solicitation Clause / Restrictions', type:'textarea', optional:true }
  ] },
  LEASE: { key:'LEASE', label:'Lease Agreement', fields:[
    {key:'landlord',label:'Landlord',type:'text'},
    {key:'tenant',label:'Tenant',type:'text'},
    {key:'effectiveDate',label:'Effective Date',type:'date'}
  ] }
  , SAFE: { key:'SAFE', label:'SAFE Agreement', fields:[
    { key:'investor', label:'Investor', type:'text' },
    { key:'company', label:'Company', type:'text' },
    { key:'effectiveDate', label:'Effective Date', type:'date' },
    { key:'investmentAmount', label:'Investment Amount', type:'text' }
  ] }
  , EQUITY: { key:'EQUITY', label:'Equity Agreement', fields:[
    { key:'effectiveDate', label:'Effective Date', type:'date' },
    { key:'buyer', label:'Buyer', type:'text' },
    { key:'seller', label:'Seller', type:'text' },
    { key:'numberOfShares', label:'Number of Shares', type:'text' },
    { key:'purchasePrice', label:'Purchase Price', type:'text' },
    { key:'closingDate', label:'Closing Date', type:'date', optional:true }
  ] }
  , MSA: {
    key: 'MSA',
    label: 'Master Service Agreement (MSA)',
    fields: [
      // ── Core service scope ──────────────────────────────────────────────
      { key: 'serviceDescription',       label: 'Service Description',                       type: 'textarea',  placeholder: 'High-level description of services to be provided' },
      { key: 'statementOfWorkRef',       label: 'Statement of Work Reference',               type: 'text',      placeholder: 'e.g. SOW-001 or "per executed SOW"' },
      { key: 'deliverables',             label: 'Deliverables',                              type: 'repeatable', itemType: 'textarea', placeholder: 'Add each deliverable separately' },
      // ── Payment ─────────────────────────────────────────────────────────
      { key: 'paymentStructure',         label: 'Payment Structure',                         type: 'select',    options: ['Hourly', 'Fixed', 'Milestone'] },
      { key: 'paymentTerms',             label: 'Payment Terms',                             type: 'textarea',  placeholder: 'e.g. Net 30; invoices due within 30 days; 1.5% monthly late fee' },
      // ── Liability & indemnification ──────────────────────────────────────
      { key: 'liabilityCap',             label: 'Liability Cap',                             type: 'select',    options: ['Total fees paid', '2x fees paid', 'Specific amount', 'Uncapped'] },
      { key: 'indemnificationScope',     label: 'Indemnification Scope',                     type: 'textarea',  placeholder: 'e.g. Each party indemnifies for breach, gross negligence, wilful misconduct' },
      // ── Confidentiality & IP ─────────────────────────────────────────────
      { key: 'confidentialityTerm',      label: 'Confidentiality Term (post-termination)',   type: 'text',      placeholder: 'e.g. 3 years; indefinite for trade secrets' },
      { key: 'ipOwnership',              label: 'IP Ownership',                              type: 'select',    options: ['Client-owns', 'Provider-owns', 'Joint'] },
      // ── Contractor status ────────────────────────────────────────────────
      { key: 'independentContractorStatus', label: 'Independent Contractor Status',         type: 'select',    options: ['Yes', 'No'] },
      // ── Non-solicitation ─────────────────────────────────────────────────
      { key: 'nonSolicitation',          label: 'Non-Solicitation Clause',                  type: 'textarea',  placeholder: 'e.g. 12-month post-termination; employees with direct material contact' },
      // ── Termination ──────────────────────────────────────────────────────
      { key: 'terminationNotice',        label: 'Termination Notice Period',                type: 'select',    options: ['15 days', '30 days', '60 days', '90 days'] },
      { key: 'terminationFees',          label: 'Termination Fees / Wind-down Costs',       type: 'textarea',  placeholder: 'e.g. payment for work performed and non-cancellable commitments' },
      // ── Dispute resolution & governing law ────────────────────────────────
      { key: 'disputeResolutionMethod',  label: 'Dispute Resolution Method',                type: 'select',    options: ['Arbitration', 'Mediation', 'Litigation'] },
      { key: 'governingLaw',             label: 'Governing Law / Jurisdiction',              type: 'text',      placeholder: 'e.g. California, New York, Texas' },
      // ── Renewal & extras ─────────────────────────────────────────────────
      { key: 'renewalTerms',             label: 'Renewal Terms',                            type: 'select',    options: ['Auto-renew', 'Notice required', 'None'] },
      { key: 'additionalNotes',          label: 'Additional Notes / Special Terms',         type: 'textarea',  optional: true }
    ]
  }

  , PARTNERSHIP: { key:'PARTNERSHIP', label:'Partnership Agreement', fields:[
    { key:'effectiveDate', label:'Effective Date', type:'date' },
    { key:'partners', label:'Partners', type:'repeatable', itemType:'text' },
    { key:'capitalContributions', label:'Capital Contributions', type:'textarea' },
    { key:'profitSharing', label:'Profit / Loss Sharing', type:'text' },
    { key:'management', label:'Governance / Management', type:'textarea' },
    { key:'dissolution', label:'Withdrawal / Dissolution', type:'textarea', optional:true }
  ] }
};

export default contractSchemas;
