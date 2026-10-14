/**
 * UltraSudo — Agentic Code Developer Presets and Engine Data
 * Supports 5-stage verification: Plan -> Architect -> Project Structure -> Sequence Diagram -> Verification -> Code Generation
 */

export const CODE_PRESETS = [
  {
    id: 'sme-invoicing-app',
    name: 'SME Micro-Invoicing & AR Tracker',
    category: 'FinTech / SaaS',
    icon: 'fas fa-file-invoice-dollar',
    prompt: 'Build a responsive React micro-invoicing application for SMEs with DSO aging buckets, client balances, payment status toggles, and local-first persistence.',
    plan: {
      overview: 'A high-performance local-first SME micro-invoicing application to track client receivables, calculate Days Sales Outstanding (DSO), and issue reminder notices.',
      functionalRequirements: [
        'Client and invoice CRUD management with unique invoice numbers and payment due dates.',
        'Automatic categorization into aging buckets: Current, 30-60 Days, 60-90 Days, 90+ Days Critical.',
        'Real-time total AR, overdue balance, and average DSO calculation.',
        'One-click client payment reminder generator.',
        'Export to JSON and CSV for spreadsheet reconciliation.'
      ],
      nonFunctionalRequirements: [
        'Sub-100ms UI response time using local-first storage.',
        '100% offline functionality without requiring an active server.',
        'Dark/Light glassmorphism theme compliance.'
      ],
      milestones: [
        { phase: 'Phase 1', task: 'Domain models & mathematical DSO helper engine' },
        { phase: 'Phase 2', task: 'Invoicing data table & aging status badges' },
        { phase: 'Phase 3', task: 'Summary metrics cards & payment reminder chaser modal' }
      ]
    },
    architect: {
      pattern: 'Modular Component Architecture with Local-First Reactive Store',
      frontend: 'React 19 + Tailwind/Vanilla CSS Variables + FontAwesome 6',
      stateManagement: 'Custom React Hook with localStorage persistence (`useLocalStore`)',
      dataFlow: 'Uni-directional state flow: User Action -> Hook Reducer -> Persistent Storage -> Reactive UI Re-render',
      security: 'Zero external network transmission of customer billing data. Client-side sanitization on all inputs.'
    },
    structure: [
      { path: 'src/index.jsx', type: 'file', desc: 'Application entry point and DOM mounting' },
      { path: 'src/App.jsx', type: 'file', desc: 'Main container orchestrating KPI metrics and invoice list' },
      { path: 'src/components/KpiSummary.jsx', type: 'file', desc: 'Top cards displaying Total AR, Overdue, and DSO metrics' },
      { path: 'src/components/InvoiceTable.jsx', type: 'file', desc: 'Interactive table with aging buckets and payment status toggle' },
      { path: 'src/components/ChaserModal.jsx', type: 'file', desc: 'Modal for generating personalized overdue payment reminder notices' },
      { path: 'src/utils/dsoEngine.js', type: 'file', desc: 'Calculates aging bucket days, overdue totals, and DSO metrics' },
      { path: 'src/styles/app.css', type: 'file', desc: 'Responsive glassmorphic dark/light styling variables' }
    ],
    sequence: {
      title: 'Invoice Payment & Aging Reconciliation Flow',
      participants: ['User', 'InvoiceTable', 'DsoEngine', 'LocalStorage'],
      steps: [
        { from: 'User', to: 'InvoiceTable', action: 'Clicks "Mark Paid" on overdue invoice #INV-104' },
        { from: 'InvoiceTable', to: 'LocalStorage', action: 'Dispatches update to invoice list in persistent storage' },
        { from: 'LocalStorage', to: 'DsoEngine', action: 'Transfers revised outstanding receivables array' },
        { from: 'DsoEngine', to: 'InvoiceTable', action: 'Recomputes DSO and shifts aging bucket totals' },
        { from: 'InvoiceTable', to: 'User', action: 'Animates row highlight and reflects updated cash runway KPI' }
      ],
      mermaid: `sequenceDiagram
    autonumber
    actor User as SME Owner
    participant UI as InvoiceTable
    participant Engine as DsoEngine
    participant Store as LocalStorage
    User->>UI: Toggle Invoice #INV-104 Status (Paid)
    UI->>Store: Persist updated invoices
    Store-->>Engine: Recalculate working capital
    Engine-->>UI: New DSO: 38 Days (Down from 44)
    UI-->>User: Visual success & KPI update`
    },
    codeFiles: [
      {
        filename: 'src/utils/dsoEngine.js',
        language: 'javascript',
        code: `// DSO & Aging Bucket Engine
export function calculateDSO(invoices, annualSales) {
  const now = new Date();
  let totalAR = 0;
  let overdueAR = 0;

  const processed = invoices.map(inv => {
    const due = new Date(inv.dueDate);
    const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    
    let bucket = 'Current';
    let status = 'pending';

    if (inv.paid) {
      status = 'paid';
      bucket = 'Settled';
    } else {
      totalAR += inv.amount;
      if (diffDays > 0) {
        overdueAR += inv.amount;
        if (diffDays <= 30) bucket = '1-30 Days';
        else if (diffDays <= 60) bucket = '31-60 Days';
        else if (diffDays <= 90) bucket = '61-90 Days';
        else bucket = '90+ Days Critical';
        status = diffDays > 60 ? 'critical' : 'overdue';
      }
    }

    return { ...inv, diffDays, bucket, status };
  });

  const dsoDays = annualSales > 0 ? Math.round((totalAR / annualSales) * 365) : 0;

  return { processed, totalAR, overdueAR, dsoDays };
}`
      },
      {
        filename: 'src/components/KpiSummary.jsx',
        language: 'jsx',
        code: `import React from 'react';

export default function KpiSummary({ totalAR, overdueAR, dsoDays }) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card total">
        <span className="kpi-label">Total Outstanding AR</span>
        <div className="kpi-val">\${totalAR.toLocaleString()}</div>
        <span className="kpi-sub">Active uncollected balance</span>
      </div>
      <div className="kpi-card overdue">
        <span className="kpi-label">Overdue Balance</span>
        <div className="kpi-val">\${overdueAR.toLocaleString()}</div>
        <span className="kpi-sub">Past contractual terms</span>
      </div>
      <div className="kpi-card dso">
        <span className="kpi-label">Days Sales Outstanding (DSO)</span>
        <div className="kpi-val">{dsoDays} <span className="kpi-unit">Days</span></div>
        <span className="kpi-sub">Target benchmark: &lt;45 days</span>
      </div>
    </div>
  );
}`
      },
      {
        filename: 'src/App.jsx',
        language: 'jsx',
        code: `import React, { useState } from 'react';
import KpiSummary from './components/KpiSummary';
import { calculateDSO } from './utils/dsoEngine';

const INITIAL_INVOICES = [
  { id: 'INV-101', client: 'Acme Corp', amount: 8500, dueDate: '2026-10-01', paid: false },
  { id: 'INV-102', client: 'OmniGlobal', amount: 14200, dueDate: '2026-09-15', paid: false },
  { id: 'INV-103', client: 'Starlight Tech', amount: 5600, dueDate: '2026-10-25', paid: false },
  { id: 'INV-104', client: 'Nexus Retail', amount: 9800, dueDate: '2026-08-10', paid: false }
];

export default function App() {
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [annualSales] = useState(380000);

  const { processed, totalAR, overdueAR, dsoDays } = calculateDSO(invoices, annualSales);

  const togglePaid = (id) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, paid: !inv.paid } : inv));
  };

  return (
    <div className="invoicing-app">
      <h2>SME Invoicing & AR Runway Dashboard</h2>
      <KpiSummary totalAR={totalAR} overdueAR={overdueAR} dsoDays={dsoDays} />
      
      <table className="invoices-table">
        <thead>
          <tr>
            <th>Invoice ID</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Aging Bucket</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {processed.map(inv => (
            <tr key={inv.id} className={inv.paid ? 'row-paid' : ''}>
              <td><code>{inv.id}</code></td>
              <td><strong>{inv.client}</strong></td>
              <td>\${inv.amount.toLocaleString()}</td>
              <td>{inv.dueDate}</td>
              <td><span className={'badge ' + inv.status}>{inv.bucket}</span></td>
              <td>
                <button onClick={() => togglePaid(inv.id)}>
                  {inv.paid ? 'Mark Unpaid' : 'Mark Paid'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`
      }
    ]
  },
  {
    id: 'pqc-vault-agent',
    name: 'Post-Quantum Vault & Key Rotator',
    category: 'Security / Zero-Trust',
    icon: 'fas fa-shield-halved',
    prompt: 'Build a Post-Quantum Cryptographic key rotator that plans, architects, generates ML-KEM / Kyber wrappers, and verifies secret encryption flows.',
    plan: {
      overview: 'Zero-trust secret management interface featuring ML-KEM (Kyber-768) encapsulation, AES-GCM-256 payload encryption, and automated key rotation intervals.',
      functionalRequirements: [
        'Key pair generation using simulated post-quantum lattice-based KEM algorithm.',
        'Encapsulation and decapsulation verification of symmetric session keys.',
        'Automated 30-day credential rotation health check.',
        'Zero plain-text logging in browser console or local storage.'
      ],
      nonFunctionalRequirements: [
        'Pure web-crypto API compliance with zero third-party telemetry.',
        'Sub-50ms encryption latency for client-side credentials.'
      ],
      milestones: [
        { phase: 'Stage 1', task: 'Kyber encapsulation interface' },
        { phase: 'Stage 2', task: 'Local secret cipher storage' }
      ]
    },
    architect: {
      pattern: 'Defense-in-Depth Layered Cryptographic Wrapper',
      frontend: 'React 19 + Web Cryptography API',
      stateManagement: 'In-Memory Secure Buffer with Ephemeral Sessions',
      dataFlow: 'Plaintext -> Kyber KEM Ephemeral Key -> AES-GCM-256 -> Armored Ciphertext',
      security: 'Constant-time verification comparisons to resist timing side-channel attacks.'
    },
    structure: [
      { path: 'src/pqc/kemEngine.js', type: 'file', desc: 'Lattice-based KEM key generation and encapsulation' },
      { path: 'src/pqc/vaultStorage.js', type: 'file', desc: 'Secure localStorage envelope with PBKDF2 salt' },
      { path: 'src/components/VaultDashboard.jsx', type: 'file', desc: 'Key lifecycle management and active credentials table' }
    ],
    sequence: {
      title: 'Kyber KEM Secret Encryption Sequence',
      participants: ['ClientApp', 'KyberKEM', 'AesEngine', 'VaultStore'],
      steps: [
        { from: 'ClientApp', to: 'KyberKEM', action: 'Request key encapsulation for peer recipient' },
        { from: 'KyberKEM', to: 'AesEngine', action: 'Derive 256-bit shared symmetric cipher key' },
        { from: 'AesEngine', to: 'VaultStore', action: 'Encrypt sensitive credentials with fresh IV' },
        { from: 'VaultStore', to: 'ClientApp', action: 'Return armored ciphertext envelope' }
      ],
      mermaid: `sequenceDiagram
    autonumber
    ClientApp->>KyberKEM: Request KEM encapsulation
    KyberKEM->>AesEngine: Generate shared secret
    AesEngine->>VaultStore: Store AES-256-GCM encrypted payload
    VaultStore-->>ClientApp: Ciphertext verified & saved`
    },
    codeFiles: [
      {
        filename: 'src/pqc/kemEngine.js',
        language: 'javascript',
        code: `// Post-Quantum ML-KEM Simulator Engine
export async function generatePqcKeyPair() {
  const rawEntropy = crypto.getRandomValues(new Uint8Array(32));
  const publicKeyHex = Array.from(rawEntropy).map(b => b.toString(16).padStart(2, '0')).join('');
  return {
    algorithm: 'ML-KEM-768',
    publicKey: 'pk_' + publicKeyHex.slice(0, 32),
    created: new Date().toISOString()
  };
}`
      }
    ]
  }
];
