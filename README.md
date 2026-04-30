# LegalChain Frontend

The Next.js frontend for the **LegalChain** platform — an AI-powered legal document generation and analysis tool. Connects to the LegalChain Backend (Node.js/Express on Render) to generate jurisdiction-aware contracts, run Legal Review, compare documents, and manage uploaded files.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · Supabase Auth · html2pdf.js  
**Deployed on:** Vercel (auto-deploy from `main`)

---

## 📁 Project Structure

```
LegalChainFrontend/
│
├── pages/                              # Next.js file-based routing
│   ├── _app.tsx                        # Global app wrapper (auth provider, global styles)
│   ├── index.tsx                       # Landing / home page
│   ├── login.tsx                       # Login page (Supabase auth)
│   ├── signup.tsx                      # Sign-up page
│   ├── forgot-password.tsx             # Password reset flow
│   ├── dashboard.tsx                   # Authenticated user dashboard
│   ├── contract-builder.tsx            # Contract generation page (ContractBuilder component)
│   ├── contract.tsx                    # Contract viewer / result page
│   ├── past-contracts.tsx              # History of generated contracts
│   ├── admin.tsx                       # Admin dashboard (AdminStats component)
│   │
│   ├── features/                       # Feature-specific pages
│   │   ├── nda.tsx                     # NDA-specific generation flow
│   │   ├── legal-review.tsx            # Legal Review upload + results
│   │   ├── comparison.tsx              # Document Comparison UI
│   │   ├── analysis.tsx                # Document analysis / summary
│   │   ├── summary.tsx                 # Document summarisation
│   │   ├── translation.tsx             # Document translation
│   │   ├── management.tsx              # Document management
│   │   └── feedback.tsx                # User feedback form
│   │
│   ├── dev/
│   │   └── review-demo.tsx             # Developer demo page for Legal Review
│   │
│   └── api/                            # Next.js API routes (proxy to backend)
│       ├── feedback.ts
│       ├── docs.ts                     # Document list
│       ├── docs/
│       │   ├── upload.ts               # Document upload proxy
│       │   └── delete/[id].ts          # Document delete proxy
│       └── ai/
│           ├── generateContract.ts     # Proxy → POST /api/ai/generateContract
│           ├── generateNDA.ts          # Proxy → POST /api/ai/generateNDA (legacy)
│           ├── legalReview.ts          # Proxy → legal review endpoint
│           ├── review.ts               # Proxy → review endpoint
│           ├── compareDocuments.ts     # Proxy → POST /api/ai/compareDocuments
│           ├── analyze.ts              # Proxy → POST /api/ai/analyze
│           ├── summarizeDocument.ts    # Proxy → summarise endpoint
│           └── translate.ts            # Proxy → POST /api/ai/translateDoc
│
├── components/                         # Reusable React components
│   ├── ContractBuilder.tsx             # Main contract generation form (type selector,
│   │                                   #   dynamic fields, clause editor, PDF/TXT export)
│   ├── ContractRenderer.tsx            # Renders generated contract HTML or plain text
│   ├── ReviewResults.tsx               # Displays Legal Review issue flags and signals
│   ├── AnalysisResult.tsx              # Displays document analysis output
│   ├── AdminStats.tsx                  # Admin usage statistics panel
│   ├── DocumentPreviewModal.tsx        # Modal for previewing uploaded documents
│   ├── DocumentUploader.tsx            # Drag-and-drop file upload widget
│   ├── DevDebugPanel.tsx               # Developer debug overlay (toggled in ContractBuilder)
│   ├── ErrorBoundary.tsx               # React error boundary wrapper
│   ├── ProtectedRoute.tsx              # Auth guard HOC
│   └── ui/                             # Primitive UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Footer.tsx
│       ├── HeroHeader.tsx
│       ├── JurisdictionSelector.tsx    # Jurisdiction dropdown (CA, NY, TX, + freeform)
│       ├── NavBar.tsx
│       ├── PracticeAreas.tsx
│       ├── SearchableSelect.tsx
│       ├── Spinner.tsx
│       └── Toc.tsx                     # Table of contents for long contract output
│
├── config/
│   ├── contractSchemas.ts              # Local field definitions per contract type
│   │                                   #   (loaded first; backend API used as fallback)
│   ├── contractTypes.ts                # Legacy contract type list (no longer consumed)
│   └── jurisdictionData.ts             # Jurisdiction label/value data for selector
│
├── lib/                                # Shared utilities and API clients
│   ├── contractApi.ts                  # api.generate(), api.getTypes(), api.getFields()
│   ├── apiClient.ts                    # Generic authenticated fetch wrapper
│   ├── api.ts                          # Additional API helpers
│   ├── supabaseClient.ts               # Supabase browser client initialisation
│   ├── generateContract.ts             # Contract generation helper (used by feature pages)
│   ├── displayText.ts                  # stripMarkdownArtifacts() and text utilities
│   └── devDebugStore.ts                # Zustand-style debug state store
│
├── styles/
│   └── globals.css                     # Global Tailwind CSS + custom base styles
│
├── types/
│   ├── supabase.ts                     # Generated Supabase DB type definitions
│   └── external-modules.d.ts           # Type declarations for untyped dependencies
│
├── src/
│   └── config/
│       └── contractSchemas.js          # CommonJS mirror of config/contractSchemas.ts
│                                       #   (consumed by ContractBuilder at runtime)
│
├── __tests__/                          # Jest + Testing Library test suite
│   ├── ContractRenderer.test.tsx
│   ├── ReviewResults.test.tsx
│   ├── apiClient.test.ts
│   └── contract.test.tsx
│
├── public/                             # Static assets served at /
│   ├── next.svg
│   ├── vercel.svg
│   ├── globe.svg
│   ├── file.svg
│   └── window.svg
│
├── docs/
│   └── backend-dev-debug-middleware.md
│
├── .env.local                          # Local environment variables (git-ignored)
├── .env.example                        # Environment variable template
├── .gitignore
├── contract-builder.html               # Static HTML prototype (reference only)
├── contract.html                       # Static HTML prototype (reference only)
├── eslint.config.mjs
├── jest.config.cjs
├── jest.setup.ts
├── next.config.ts                      # Next.js config (API rewrites, env exposure)
├── next-env.d.ts
├── postcss.config.mjs
├── tailwind.config.js
├── tsconfig.json
├── vercel.json                         # Vercel deployment config
└── package.json
```

---

## ✅ Features

- 🔐 **Authentication** — Supabase email/password auth with protected routes and session persistence
- 📝 **Contract Generation** — Dynamic form supporting all contract types; fields load from local schema (or fall back to backend API). Supported types:
  - NDA, Service Agreement, MSA, Employment, Sales, Lease, SAFE, Equity Agreement, IP Transfer, Standard, Partnership
- ⚖️ **Legal Review** — Upload a contract PDF/text; backend extracts clauses, matches signals, and returns deterministic issue flags with severity ratings
- 📊 **Document Comparison** — Upload two PDFs and get a structural and semantic diff with CourtListener citation enrichment
- 📋 **Document Analysis** — Heuristic summary, key clause extraction, and risk flag detection for uploaded documents
- 🌐 **Translation** — Document translation via configurable provider
- 📥 **PDF & TXT Export** — Download generated contracts as PDF (html2pdf.js) or plain text
- 📁 **Document Management** — Upload, list, preview, and delete documents stored in Supabase Storage
- 📜 **Past Contracts** — View previously generated contracts from the authenticated user's history
- 🛠 **Developer Tools** — Debug panel overlay in ContractBuilder; dev demo page for Legal Review (`/dev/review-demo`)

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/LegalChainInc/LegalChainFrontend.git
cd LegalChainFrontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.local.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon/public key
NEXT_PUBLIC_API_BASE_URL=          # Backend base URL
                                   #   Local dev:  http://localhost:3001
                                   #   Production: https://your-render-app.onrender.com
BACKEND_URL=                       # Server-side backend URL (used by Next.js API routes)
```

> **Important:** For local development `NEXT_PUBLIC_API_BASE_URL` must point to `http://localhost:3001` (the backend dev server port), **not** the production Render URL.

### 4. Start the Dev Server

```bash
npm run dev
```

The app runs at `http://localhost:3000`. The backend must be running separately on port 3001.

---

## 🧪 Testing

```bash
# Run the full Jest test suite
npm test

# Run a specific test file
npx jest __tests__/ContractRenderer.test.tsx
```

---

## 🌐 Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | `index.tsx` | Landing page |
| `/login` | `login.tsx` | Supabase email/password login |
| `/signup` | `signup.tsx` | New user registration |
| `/forgot-password` | `forgot-password.tsx` | Password reset flow |
| `/dashboard` | `dashboard.tsx` | Authenticated user home; links to all features |
| `/contract-builder` | `contract-builder.tsx` | Contract generation form (all contract types) |
| `/contract` | `contract.tsx` | Contract result viewer |
| `/past-contracts` | `past-contracts.tsx` | History of generated contracts |
| `/admin` | `admin.tsx` | Admin usage statistics (role-gated) |
| `/features/nda` | `features/nda.tsx` | NDA-specific generation flow |
| `/features/legal-review` | `features/legal-review.tsx` | Legal Review upload + issue results |
| `/features/comparison` | `features/comparison.tsx` | Document comparison (two-PDF upload) |
| `/features/analysis` | `features/analysis.tsx` | Document analysis and summary |
| `/features/summary` | `features/summary.tsx` | Document summarisation |
| `/features/translation` | `features/translation.tsx` | Document translation |
| `/features/management` | `features/management.tsx` | Document upload, list, delete |
| `/features/feedback` | `features/feedback.tsx` | User feedback submission |
| `/dev/review-demo` | `dev/review-demo.tsx` | Developer Legal Review demo (dev only) |

---

## 🧩 Key Components

### `ContractBuilder.tsx`
The primary contract generation interface. Loads contract type options from `config/contractSchemas.ts` (filtered by a local `allowed` list), then dynamically renders the appropriate fields for the selected type. On submission, builds a typed payload and calls `POST /api/ai/generateContract` via `lib/contractApi.ts`. Supports PDF and TXT export of the result. Includes a debug mode that logs the full payload before submission.

### `ReviewResults.tsx`
Renders the output of the Legal Review pipeline — a list of flagged clauses with `issueCode`, severity badge (high / medium / low), and issue description text. Maps directly to the `rules` array from the backend's `issueCatalog.js`.

### `ContractRenderer.tsx`
Handles safe rendering of both HTML and plain-text contract output. Uses DOMPurify to sanitize any HTML returned by the LLM formatter before injecting it into the DOM.

### `DocumentUploader.tsx`
Drag-and-drop file upload widget backed by Supabase Storage. Used across the Legal Review, Comparison, and Document Management pages.

### `JurisdictionSelector.tsx` (`ui/`)
Dropdown with the three primary supported jurisdictions (California, New York, Texas) plus a freeform text fallback. Used by ContractBuilder and Legal Review to scope clause assembly and issue flagging.

---

## 🤝 Backend Integration

This frontend connects to the **LegalChain Backend** (`LegalChainInc/LegalChainBackend`).

All API calls from Next.js page components go through the Next.js API route layer (`pages/api/`), which proxies requests to the backend using `BACKEND_URL`. Client-side calls use `NEXT_PUBLIC_API_BASE_URL`.

### Key endpoints consumed

| Method | Endpoint | Used by |
|---|---|---|
| GET | `/api/ai/contractTypes` | ContractBuilder — type selector fallback |
| GET | `/api/ai/contractFields?type=MSA` | ContractBuilder — field list fallback |
| POST | `/api/ai/generateContract` | ContractBuilder — contract generation |
| POST | `/api/ai/generateNDA` | `features/nda.tsx` (legacy route) |
| POST | `/api/ai/compareDocuments` | `features/comparison.tsx` |
| POST | `/api/ai/analyze` | `features/analysis.tsx` |
| POST | `/api/ai/translateDoc` | `features/translation.tsx` |
| POST | `/api/docs/upload` | DocumentUploader |
| GET | `/api/docs` | `features/management.tsx` |
| DELETE | `/api/docs/:id` | `features/management.tsx` |

---

## 🚀 Deployment

- Hosted on **Vercel** — auto-deploys from the `main` branch
- `vercel.json` configures build settings and environment variable exposure
- Set all `NEXT_PUBLIC_*` and `BACKEND_URL` variables in the Vercel dashboard under **Settings → Environment Variables**
- The `NEXT_PUBLIC_API_BASE_URL` must point to the production Render backend URL in the Vercel environment

---

## 👥 Team

| Member | Role |
|---|---|
| Miheer | Product, Sprint Lead, Architecture Review |
| Hammad | Backend Lead — all implementation |
| Giriraj | File Upload, Storage APIs |
| Sweta | AI Integration & Summary |
| Shuhan | DB Schema & Admin Dashboard |

---

## 🛠 Tools & Technologies

- **Framework:** Next.js 16 (App Router disabled — uses `pages/` routing)
- **Language:** TypeScript 5
- **UI:** React 19, Tailwind CSS 4, react-icons
- **Auth:** Supabase (`@supabase/auth-helpers-nextjs`)
- **HTTP:** Axios, native `fetch`
- **PDF Export:** html2pdf.js, jsPDF
- **Text Diff:** diff (npm)
- **NLP:** compromise (clause tokenisation)
- **Sanitisation:** DOMPurify (XSS protection on LLM HTML output)
- **Testing:** Jest 29, Testing Library (React + DOM + user-event)
- **Linting:** ESLint 9 (`eslint-config-next`)
- **Deployment:** Vercel
