/**
 * UltraSudo — Legal, HR & Compliance Engines and Datasets
 * Models Contract Risk Redlining, Fully Burdened Labor Rates, HR Policy Templates, and GDPR/Cybersecurity Audit.
 */

// ── Sample Commercial Contract for Redlining ─────────────────────────────────
export const SAMPLE_CONTRACT_TEXT = `MASTER SERVICES AGREEMENT (MSA)

1. INDEMNIFICATION & LIABILITY
1.1 Provider shall unconditionally defend, indemnify, and hold harmless Client, its affiliates, directors, and agents against ANY AND ALL losses, claims, damages, liabilities, costs, and expenses (including unlimited attorney fees) arising directly or indirectly out of any act, omission, or performance of the Services.
1.2 Provider's aggregate liability under this Agreement shall be UNLIMITED, and in no event shall any limitation of liability apply to data incidents, intellectual property claims, or breach of confidentiality.

2. INTELLECTUAL PROPERTY ASSIGNMENT
2.1 Provider agrees that all work product, inventions, designs, know-how, and proprietary algorithms created during the term shall be deemed "work made for hire" and shall immediately become the exclusive property of Client, including any pre-existing background code or libraries utilized.

3. TERM & TERMINATION
3.1 Client may terminate this Agreement at any time for convenience without cause upon three (3) business days' written notice. Provider shall have no right of termination for convenience.

4. NON-COMPETITION & NON-SOLICITATION
4.1 For a period of twenty-four (24) months following termination, Provider and its personnel shall not directly or indirectly provide any services to any entity operating within the same industry sector as Client worldwide.`;

export const CONTRACT_RISK_ANALYSIS = [
  {
    id: 'risk-1',
    section: '1.1 & 1.2 Indemnification & Liability',
    severity: 'critical',
    title: 'Uncapped Liability & One-Sided Indemnity',
    explanation: 'Exposes your business to unlimited liability with no dollar ceiling or mutual indemnification protections.',
    standardCounterClause: 'Each party\'s total aggregate liability arising out of or related to this Agreement shall be capped at the total fees paid or payable by Client in the preceding twelve (12) months. Indemnification shall be mutual and limited to third-party claims arising from gross negligence or willful misconduct.'
  },
  {
    id: 'risk-2',
    section: '2.1 IP Assignment',
    severity: 'high',
    title: 'Loss of Pre-Existing Background IP',
    explanation: 'Clause transfers ownership of your pre-existing code, tools, and proprietary libraries to the client.',
    standardCounterClause: 'Provider retains all right, title, and interest in and to its pre-existing materials, background IP, and reusable tooling. Client is granted a non-exclusive, perpetual, worldwide license to use such background IP solely as integrated within the deliverables.'
  },
  {
    id: 'risk-3',
    section: '3.1 Termination for Convenience',
    severity: 'medium',
    title: 'Asymmetric 3-Day Termination Notice',
    explanation: 'Client can cancel with 3 days notice without paying for committed resources or ramp-up costs.',
    standardCounterClause: 'Either party may terminate for convenience upon thirty (30) days\' prior written notice. Upon termination, Client shall pay for all completed work and non-cancelable commitments incurred up to the effective termination date.'
  },
  {
    id: 'risk-4',
    section: '4.1 Non-Competition',
    severity: 'high',
    title: 'Overbroad 24-Month Global Non-Compete',
    explanation: 'Restricts your company from serving any client in the same industry for 2 years globally, which is legally dangerous and potentially unenforceable.',
    standardCounterClause: 'Clause should be replaced with a reasonable mutual non-solicitation of direct employees for a period of twelve (12) months, striking all general non-competition restrictions.'
  }
];

// ── Fully Burdened Labor Rate Model ──────────────────────────────────────────
export const INITIAL_LABOR_CONFIG = {
  roleTitle: 'Senior Software Engineer / Tech Lead',
  baseSalary: 115000,           // Annual base pay
  payrollTaxRatePct: 8.5,       // FICA, Medicare, SUTA/FUTA (~7.65% - 10%)
  healthDentalBenefitsAnnual: 9600, // Employer healthcare contribution
  retirementMatchPct: 4.0,      // 401(k) / Pension match
  annualBonusUsd: 8000,
  ptoDays: 20,                  // Vacation & sick leave
  paidHolidays: 10,             // National holidays
  billableHoursPerWeek: 32,     // 40 hrs total - 8 hrs internal/admin
  weeksPerYear: 52,
  seatOverheadAnnual: 12000,    // Laptop, SaaS licenses, office/desk space, insurance
  targetGrossMarginPct: 35.0    // Desired agency/consultancy gross margin
};

export function computeLaborBurden(cfg = INITIAL_LABOR_CONFIG) {
  const payrollTax = cfg.baseSalary * (cfg.payrollTaxRatePct / 100);
  const retirementMatch = cfg.baseSalary * (cfg.retirementMatchPct / 100);
  const totalDirectCash = cfg.baseSalary + cfg.annualBonusUsd;
  const totalBenefits = cfg.healthDentalBenefitsAnnual + retirementMatch + payrollTax;
  const totalBurdenedCost = totalDirectCash + totalBenefits + cfg.seatOverheadAnnual;
  const burdenMultiplier = Number((totalBurdenedCost / (cfg.baseSalary || 1)).toFixed(2));

  // Productive / Billable Hours Calculation
  const totalWorkingDays = (cfg.weeksPerYear * 5) - cfg.ptoDays - cfg.paidHolidays;
  const productiveWeeks = totalWorkingDays / 5;
  const annualBillableHours = Math.round(productiveWeeks * cfg.billableHoursPerWeek);

  const trueCostPerHour = annualBillableHours > 0 ? Number((totalBurdenedCost / annualBillableHours).toFixed(2)) : 0;
  // Recommended billing rate to achieve target gross margin: cost / (1 - margin)
  const marginFraction = (cfg.targetGrossMarginPct || 30) / 100;
  const recommendedBillingRate = marginFraction < 1 ? Number((trueCostPerHour / (1 - marginFraction)).toFixed(2)) : trueCostPerHour * 1.5;

  return {
    totalDirectCash,
    totalBenefits: Math.round(totalBenefits),
    totalBurdenedCost: Math.round(totalBurdenedCost),
    burdenMultiplier,
    annualBillableHours,
    trueCostPerHour,
    recommendedBillingRate
  };
}

// ── HR Policy Checklist & Templates ──────────────────────────────────────────
export const INITIAL_HR_POLICIES = [
  { id: 'pol-1', title: 'Remote & Hybrid Work Policy', category: 'Operations', status: 'Active', summary: 'Core hours (10am-3pm), home office stipend guidelines, asynchronous Slack/email expectations.' },
  { id: 'pol-2', title: 'Bring Your Own Device (BYOD) & Security', category: 'IT & Security', status: 'Active', summary: 'Mandatory screen lock (5 min), disk encryption (FileVault/BitLocker), запрет (prohibition) of company data storage on personal thumb drives.' },
  { id: 'pol-3', title: 'Generative AI & Intellectual Property Policy', category: 'Technology', status: 'Needs Review', summary: 'Zero upload of client NDA data or proprietary source code into public LLM training datasets.' },
  { id: 'pol-4', title: 'Paid Time Off (PTO) & Parental Leave SOP', category: 'Benefits', status: 'Active', summary: 'Accrual rates, rollover limits (max 5 days), request lead time (2 weeks for >3 days off).' },
  { id: 'pol-5', title: 'Anti-Harassment & Whistleblower Protocol', category: 'Compliance', status: 'Active', summary: 'Zero-tolerance policy, anonymous reporting channel, non-retaliation guarantee.' }
];

// ── Cybersecurity & Data Privacy Audit Matrix ────────────────────────────────
export const INITIAL_PRIVACY_AUDIT = [
  { id: 'audit-1', control: 'Multi-Factor Authentication (MFA)', category: 'Access Control', status: 'compliant', score: 10, note: 'Enforced on GSuite/Microsoft 365, AWS, and GitHub.' },
  { id: 'audit-2', control: 'Data Inventory & PII Mapping', category: 'GDPR / CCPA', status: 'partial', score: 6, note: 'Customer emails mapped in CRM, but payment export archives need cleanup.' },
  { id: 'audit-3', control: 'Data Processing Agreements (DPAs)', category: 'Legal', status: 'compliant', score: 10, note: 'Standard DPAs executed with all cloud SaaS vendors.' },
  { id: 'audit-4', control: 'Device Disk Encryption at Rest', category: 'Hardware', status: 'compliant', score: 10, note: '100% of staff laptops encrypted via BitLocker / FileVault.' },
  { id: 'audit-5', control: '72-Hour Data Breach Incident Plan', category: 'Governance', status: 'partial', score: 5, note: 'Draft procedure exists; annual simulation drill pending.' },
  { id: 'audit-6', control: 'Right to Be Forgotten / Erasure Protocol', category: 'GDPR / CCPA', status: 'compliant', score: 10, note: 'Automated script purges user records across databases upon verified request.' },
  { id: 'audit-7', control: 'Immutable Offsite Cloud Backups', category: 'Disaster Recovery', status: 'compliant', score: 10, note: 'Daily automated snapshots stored in air-gapped S3 bucket with versioning.' }
];
