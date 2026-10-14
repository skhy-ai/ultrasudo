import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../../components/shared/AppShell/AppShell';
import { useAppAgent } from '../../../hooks/useAppAgent';
import useLocalStore from '../../../hooks/useLocalStore';
import {
  SAMPLE_CONTRACT_TEXT,
  CONTRACT_RISK_ANALYSIS,
  INITIAL_LABOR_CONFIG,
  INITIAL_HR_POLICIES,
  INITIAL_PRIVACY_AUDIT,
  computeLaborBurden
} from '../../../data/legalComplianceData';
import './LegalComplianceHub.css';

export default function LegalComplianceHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'redliner';

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  // State with local persistence
  const [contractText, setContractText] = useLocalStore('legal_contract_text', SAMPLE_CONTRACT_TEXT);
  const [risks, setRisks] = useLocalStore('legal_risks', CONTRACT_RISK_ANALYSIS);
  const [laborConfig, setLaborConfig] = useLocalStore('legal_labor_config', INITIAL_LABOR_CONFIG);
  const [hrPolicies, setHrPolicies] = useLocalStore('legal_hr_policies', INITIAL_HR_POLICIES);
  const [auditItems, setAuditItems] = useLocalStore('legal_audit_items', INITIAL_PRIVACY_AUDIT);

  // New policy modal / input state
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [newPolicyTitle, setNewPolicyTitle] = useState('');
  const [newPolicyCategory, setNewPolicyCategory] = useState('Operations');
  const [newPolicySummary, setNewPolicySummary] = useState('');

  // Computations
  const laborMetrics = useMemo(() => {
    return computeLaborBurden(laborConfig);
  }, [laborConfig]);

  const auditScore = useMemo(() => {
    const totalPossible = auditItems.length * 10;
    const currentTotal = auditItems.reduce((acc, item) => acc + (item.score || 0), 0);
    return Math.round((currentTotal / (totalPossible || 1)) * 100);
  }, [auditItems]);

  const criticalRisksCount = useMemo(() => {
    return risks.filter(r => r.severity === 'critical' || r.severity === 'high').length;
  }, [risks]);

  // AI Copilot Integration
  useAppAgent({
    appId: 'legal-compliance-hub',
    appName: 'Legal, HR & Compliance Hub',
    getContext: () => ({
      activeTab,
      criticalRisksCount,
      contractLengthWords: contractText.split(/\s+/).length,
      currentBurdenMultiplier: laborMetrics.burdenMultiplier,
      recommendedBillingRate: laborMetrics.recommendedBillingRate,
      privacyAuditScore: auditScore,
      totalHrPolicies: hrPolicies.length
    }),
    suggestedPrompts: [
      'Redline the indemnification clause in my contract',
      'What should our hourly billing rate be for a $140k engineer at 40% margin?',
      'Draft a Remote Work Policy tailored to distributed teams',
      'What steps do we need to raise our GDPR privacy audit to 100%?'
    ],
    actions: [
      {
        name: 'redline_contract_clause',
        description: 'Analyze and provide a battle-tested counter-clause for a contract risk',
        parameters: {
          clauseTopic: { type: 'string', description: 'e.g. Indemnification, Non-compete, IP Assignment' },
          clientDemand: { type: 'string', description: 'The aggressive client language' }
        },
        handler: ({ clauseTopic, clientDemand }) => {
          return {
            success: true,
            topic: clauseTopic,
            recommendedStance: 'Mutual capped liability at 12 months fees, carve-out for pre-existing IP.',
            negotiationTip: 'State that uninsurable uncapped liabilities violate corporate risk underwriting policy.'
          };
        }
      },
      {
        name: 'calculate_burdened_rate',
        description: 'Update labor model parameters to calculate true cost and billable rate',
        parameters: {
          baseSalary: { type: 'number', description: 'Annual base pay' },
          targetMarginPct: { type: 'number', description: 'Target gross margin percentage' }
        },
        handler: ({ baseSalary, targetMarginPct }) => {
          setLaborConfig(prev => ({
            ...prev,
            baseSalary: Number(baseSalary) || prev.baseSalary,
            targetGrossMarginPct: Number(targetMarginPct) || prev.targetGrossMarginPct
          }));
          return { success: true };
        }
      },
      {
        name: 'generate_hr_policy',
        description: 'Create and add a new HR Policy to the employee handbook',
        parameters: {
          title: { type: 'string', description: 'Policy title' },
          category: { type: 'string', description: 'Category (Operations, IT & Security, Compliance)' },
          summary: { type: 'string', description: 'Summary SOP text' }
        },
        handler: ({ title, category = 'Operations', summary = '' }) => {
          const newPol = {
            id: `pol-${Date.now()}`,
            title,
            category,
            status: 'Active',
            summary
          };
          setHrPolicies(prev => [newPol, ...prev]);
          return { success: true, createdPolicy: title };
        }
      }
    ]
  });

  const handleApplyCounterClause = (risk) => {
    setContractText(prev => `${prev}\n\n/* REVISED COUNTER-CLAUSE FOR ${risk.section.toUpperCase()}: */\n${risk.standardCounterClause}\n`);
    alert(`Applied standard protective counter-clause for ${risk.section} to contract text!`);
  };

  const handleToggleAuditStatus = (id) => {
    setAuditItems(prev => prev.map(item => {
      if (item.id === id) {
        if (item.status === 'compliant') return { ...item, status: 'partial', score: 5 };
        if (item.status === 'partial') return { ...item, status: 'non-compliant', score: 0 };
        return { ...item, status: 'compliant', score: 10 };
      }
      return item;
    }));
  };

  const handleAddPolicy = (e) => {
    e.preventDefault();
    if (!newPolicyTitle.trim()) return;
    const newPol = {
      id: `pol-${Date.now()}`,
      title: newPolicyTitle,
      category: newPolicyCategory,
      status: 'Active',
      summary: newPolicySummary || 'Standard operating procedure.'
    };
    setHrPolicies([newPol, ...hrPolicies]);
    setNewPolicyTitle('');
    setNewPolicySummary('');
    setShowAddPolicy(false);
  };

  return (
    <AppShell title="Legal, HR & Compliance Hub" icon="fas fa-scale-balanced">
      <div className="legal-hub-container">
        {/* Top KPI Metrics Bar */}
        <div className="legal-kpi-grid">
          <div className="legal-kpi-card redlines">
            <div className="kpi-icon-wrap"><i className="fas fa-file-shield"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">Contract Exposure</span>
              <div className="kpi-val">{criticalRisksCount} <span className="kpi-unit">High Risks</span></div>
              <span className="kpi-sub">Uncapped liability & IP transfer detected</span>
            </div>
          </div>

          <div className="legal-kpi-card rate">
            <div className="kpi-icon-wrap"><i className="fas fa-calculator"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">Burdened Labor Rate</span>
              <div className="kpi-val">${laborMetrics.recommendedBillingRate} <span className="kpi-unit">/ hr</span></div>
              <span className="kpi-sub">{laborMetrics.burdenMultiplier}x multiplier (${laborMetrics.trueCostPerHour}/hr cost)</span>
            </div>
          </div>

          <div className="legal-kpi-card hr">
            <div className="kpi-icon-wrap"><i className="fas fa-user-group"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">HR Handbook</span>
              <div className="kpi-val">{hrPolicies.length} <span className="kpi-unit">Active SOPs</span></div>
              <span className="kpi-sub">Remote work, BYOD, GenAI policies active</span>
            </div>
          </div>

          <div className="legal-kpi-card audit">
            <div className="kpi-icon-wrap"><i className="fas fa-shield-halved"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">Cyber & GDPR Score</span>
              <div className="kpi-val">{auditScore}%</div>
              <span className="kpi-sub">{auditScore >= 80 ? 'Audit Ready (SOC2/GDPR)' : 'Action Items Pending'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="legal-tabs-header">
          <button
            className={`legal-tab-btn ${activeTab === 'redliner' ? 'active' : ''}`}
            onClick={() => setTab('redliner')}
          >
            <i className="fas fa-pen-fancy"></i> Contract & NDA Redliner
          </button>
          <button
            className={`legal-tab-btn ${activeTab === 'labor' ? 'active' : ''}`}
            onClick={() => setTab('labor')}
          >
            <i className="fas fa-user-clock"></i> Fully Burdened Labor Rate
          </button>
          <button
            className={`legal-tab-btn ${activeTab === 'handbook' ? 'active' : ''}`}
            onClick={() => setTab('handbook')}
          >
            <i className="fas fa-book"></i> HR Policy Handbook
          </button>
          <button
            className={`legal-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setTab('privacy')}
          >
            <i className="fas fa-lock"></i> Cybersecurity & GDPR Audit
          </button>
        </div>

        {/* Tab 1: Contract & NDA Redliner */}
        {activeTab === 'redliner' && (
          <div className="legal-tab-content">
            <div className="legal-section-header">
              <div>
                <h3>Commercial Contract & Risk Redlining Engine</h3>
                <p>Detect hazardous indemnity traps, pre-existing IP assignments, and overbroad non-competes before signing.</p>
              </div>
              <button
                className="action-btn secondary"
                onClick={() => setContractText(SAMPLE_CONTRACT_TEXT)}
              >
                <i className="fas fa-rotate-left"></i> Reset Sample Contract
              </button>
            </div>

            <div className="legal-two-col">
              <div className="legal-card contract-editor-card">
                <div className="card-top-bar">
                  <h4><i className="fas fa-file-contract"></i> Agreement Text</h4>
                  <span className="badge-pill">Editable Draft</span>
                </div>
                <textarea
                  className="contract-textarea"
                  value={contractText}
                  onChange={e => setContractText(e.target.value)}
                  rows={20}
                />
              </div>

              <div className="legal-card risks-list-card">
                <div className="card-top-bar">
                  <h4><i className="fas fa-triangle-exclamation"></i> Identified Risk Exposures ({risks.length})</h4>
                  <span className="badge-pill alert">{criticalRisksCount} Urgent</span>
                </div>

                <div className="risks-scroll-area">
                  {risks.map(risk => (
                    <div key={risk.id} className={`risk-item-box ${risk.severity}`}>
                      <div className="risk-item-header">
                        <span className={`severity-tag ${risk.severity}`}>{risk.severity.toUpperCase()}</span>
                        <strong>{risk.title}</strong>
                      </div>
                      <span className="risk-section-ref">{risk.section}</span>
                      <p className="risk-expl">{risk.explanation}</p>
                      
                      <div className="counter-clause-box">
                        <div className="counter-head">
                          <span><i className="fas fa-shield"></i> Protective Counter-Clause:</span>
                        </div>
                        <p className="counter-text">{risk.standardCounterClause}</p>
                        <button
                          className="apply-counter-btn"
                          onClick={() => handleApplyCounterClause(risk)}
                        >
                          <i className="fas fa-plus"></i> Append Counter-Clause to Draft
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Fully Burdened Labor Rate */}
        {activeTab === 'labor' && (
          <div className="legal-tab-content">
            <div className="legal-section-header">
              <div>
                <h3>Fully Burdened Labor Rate & Pricing Calculator</h3>
                <p>True cost accounting: factor in payroll taxes, healthcare, 401(k), paid time off, and overhead to set profitable billing rates.</p>
              </div>
            </div>

            <div className="legal-two-col">
              <div className="legal-card form-card">
                <h4>Cost & Compensation Factors</h4>
                
                <div className="form-group">
                  <label>Role / Job Title</label>
                  <input
                    type="text"
                    value={laborConfig.roleTitle}
                    onChange={e => setLaborConfig({ ...laborConfig, roleTitle: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Base Annual Salary ($)</label>
                    <input
                      type="number"
                      value={laborConfig.baseSalary}
                      onChange={e => setLaborConfig({ ...laborConfig, baseSalary: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Annual Bonus / Commission ($)</label>
                    <input
                      type="number"
                      value={laborConfig.annualBonusUsd}
                      onChange={e => setLaborConfig({ ...laborConfig, annualBonusUsd: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Employer Payroll Tax (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={laborConfig.payrollTaxRatePct}
                      onChange={e => setLaborConfig({ ...laborConfig, payrollTaxRatePct: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Healthcare & Benefits ($/yr)</label>
                    <input
                      type="number"
                      value={laborConfig.healthDentalBenefitsAnnual}
                      onChange={e => setLaborConfig({ ...laborConfig, healthDentalBenefitsAnnual: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>PTO Days / Year</label>
                    <input
                      type="number"
                      value={laborConfig.ptoDays}
                      onChange={e => setLaborConfig({ ...laborConfig, ptoDays: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Billable Hours / Week</label>
                    <input
                      type="number"
                      value={laborConfig.billableHoursPerWeek}
                      onChange={e => setLaborConfig({ ...laborConfig, billableHoursPerWeek: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Seat Overhead (SaaS, Desk, Ins.) ($)</label>
                    <input
                      type="number"
                      value={laborConfig.seatOverheadAnnual}
                      onChange={e => setLaborConfig({ ...laborConfig, seatOverheadAnnual: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Target Gross Margin (%)</label>
                    <input
                      type="number"
                      value={laborConfig.targetGrossMarginPct}
                      onChange={e => setLaborConfig({ ...laborConfig, targetGrossMarginPct: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="legal-card metrics-display-card">
                <h4>True Burden & Recommended Pricing</h4>

                <div className="display-metric-box highlight">
                  <span className="lbl">Recommended Client Billable Rate</span>
                  <div className="val">${laborMetrics.recommendedBillingRate} / hr</div>
                  <span className="sub">Maintains {laborConfig.targetGrossMarginPct}% gross profit margin</span>
                </div>

                <div className="display-metric-box">
                  <span className="lbl">Internal True Cost Per Productive Hour</span>
                  <div className="val">${laborMetrics.trueCostPerHour} / hr</div>
                  <span className="sub">Based on {laborMetrics.annualBillableHours} net productive annual hours</span>
                </div>

                <div className="breakdown-list">
                  <div className="breakdown-row">
                    <span>Base Cash Pay:</span>
                    <strong>${laborConfig.baseSalary.toLocaleString()}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>Taxes & Benefits:</span>
                    <strong>+${laborMetrics.totalBenefits.toLocaleString()}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>Tech & Seat Overhead:</span>
                    <strong>+${laborConfig.seatOverheadAnnual.toLocaleString()}</strong>
                  </div>
                  <div className="breakdown-row total">
                    <span>Total Loaded Annual Cost:</span>
                    <strong>${laborMetrics.totalBurdenedCost.toLocaleString()}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>Burden Multiplier:</span>
                    <strong className="multiplier-badge">{laborMetrics.burdenMultiplier}x of Base Pay</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: HR Policy Handbook */}
        {activeTab === 'handbook' && (
          <div className="legal-tab-content">
            <div className="legal-section-header">
              <div>
                <h3>Standard Operating HR Policies & Employee Handbook</h3>
                <p>Equip your SME with clear, compliant policies covering remote work, GenAI IP safeguards, and security rules.</p>
              </div>
              <button
                className="action-btn primary"
                onClick={() => setShowAddPolicy(true)}
              >
                <i className="fas fa-plus"></i> New Policy SOP
              </button>
            </div>

            {showAddPolicy && (
              <form className="add-policy-banner" onSubmit={handleAddPolicy}>
                <h4>Create New Policy Document</h4>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Policy Title (e.g. Social Media & Public Communications SOP)"
                    value={newPolicyTitle}
                    onChange={e => setNewPolicyTitle(e.target.value)}
                    required
                  />
                  <select
                    value={newPolicyCategory}
                    onChange={e => setNewPolicyCategory(e.target.value)}
                  >
                    <option value="Operations">Operations</option>
                    <option value="IT & Security">IT & Security</option>
                    <option value="Technology">Technology</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Benefits">Benefits</option>
                  </select>
                </div>
                <textarea
                  placeholder="Key guidelines, core hours, expectations and enforcement rules..."
                  value={newPolicySummary}
                  onChange={e => setNewPolicySummary(e.target.value)}
                  rows={3}
                />
                <div className="banner-actions">
                  <button type="submit" className="action-btn primary">Save to Handbook</button>
                  <button type="button" className="action-btn secondary" onClick={() => setShowAddPolicy(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="policies-grid">
              {hrPolicies.map(pol => (
                <div key={pol.id} className="policy-card">
                  <div className="policy-card-header">
                    <span className="policy-cat-pill">{pol.category}</span>
                    <span className={`policy-status ${pol.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {pol.status}
                    </span>
                  </div>
                  <h4 className="policy-title">{pol.title}</h4>
                  <p className="policy-summary">{pol.summary}</p>
                  <div className="policy-footer">
                    <button
                      className="pol-btn"
                      onClick={() => alert(`Copied "${pol.title}" policy text to clipboard.`)}
                    >
                      <i className="fas fa-copy"></i> Copy SOP
                    </button>
                    <button
                      className="pol-btn"
                      onClick={() => alert(`UltraSudo Copilot can regenerate or localize ${pol.title} for your state/country.`)}
                    >
                      <i className="fas fa-wand-magic-sparkles"></i> AI Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Cybersecurity & GDPR Audit */}
        {activeTab === 'privacy' && (
          <div className="legal-tab-content">
            <div className="legal-section-header">
              <div>
                <h3>Cybersecurity Baseline & Data Privacy (GDPR/CCPA) Audit</h3>
                <p>Verify essential technical and organizational controls to protect customer data and satisfy enterprise vendor due diligence.</p>
              </div>
              <div className="score-summary-badge">
                <span>Readiness Score:</span>
                <strong>{auditScore}%</strong>
              </div>
            </div>

            <div className="legal-card table-card">
              <table className="legal-data-table">
                <thead>
                  <tr>
                    <th>Security / Privacy Control</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Implementation Evidence & Notes</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {auditItems.map(item => (
                    <tr key={item.id} className={`status-row-${item.status}`}>
                      <td>
                        <strong>{item.control}</strong>
                      </td>
                      <td>
                        <span className="cat-pill">{item.category}</span>
                      </td>
                      <td>
                        <span className={`status-pill ${item.status}`}>
                          {item.status === 'compliant' && <i className="fas fa-check-circle"></i>}
                          {item.status === 'partial' && <i className="fas fa-clock"></i>}
                          {item.status === 'non-compliant' && <i className="fas fa-circle-xmark"></i>}
                          {' '}{item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="note-col">{item.note}</td>
                      <td>
                        <button
                          className="cycle-status-btn"
                          onClick={() => handleToggleAuditStatus(item.id)}
                          title="Click to toggle status (Compliant -> Partial -> Non-Compliant)"
                        >
                          <i className="fas fa-arrows-rotate"></i> Change Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
