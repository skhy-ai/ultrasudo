import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../../components/shared/AppShell/AppShell';
import { useAppAgent } from '../../../hooks/useAppAgent';
import useLocalStore from '../../../hooks/useLocalStore';
import {
  INITIAL_CASH_FLOW_WEEKS,
  INITIAL_INVOICES,
  INITIAL_BREAKEVEN_CONFIG,
  INITIAL_EOQ_CONFIG,
  compute13WeekCashFlow,
  computeDsoMetrics,
  computeBreakeven,
  computeEoqMetrics
} from '../../../data/businessOpsData';
import './BusinessOpsHub.css';

export default function BusinessOpsHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'cashflow';

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  // State with local persistence
  const [cashFlowWeeks, setCashFlowWeeks] = useLocalStore('bops_cashflow_weeks', INITIAL_CASH_FLOW_WEEKS);
  const [startingCash, setStartingCash] = useLocalStore('bops_starting_cash', 85000);
  const [minCashBuffer, setMinCashBuffer] = useLocalStore('bops_min_cash_buffer', 25000);

  const [invoices, setInvoices] = useLocalStore('bops_invoices', INITIAL_INVOICES);
  const [annualSales, setAnnualSales] = useLocalStore('bops_annual_credit_sales', 420000);

  const [breakevenConfig, setBreakevenConfig] = useLocalStore('bops_breakeven_config', INITIAL_BREAKEVEN_CONFIG);
  const [eoqConfig, setEoqConfig] = useLocalStore('bops_eoq_config', INITIAL_EOQ_CONFIG);

  // Computations
  const computedWeeks = useMemo(() => {
    return compute13WeekCashFlow(startingCash, minCashBuffer, cashFlowWeeks);
  }, [startingCash, minCashBuffer, cashFlowWeeks]);

  const minEndingCash = useMemo(() => {
    return Math.min(...computedWeeks.map(w => w.endingCash));
  }, [computedWeeks]);

  const minWeekObj = useMemo(() => {
    return computedWeeks.find(w => w.endingCash === minEndingCash) || computedWeeks[0];
  }, [computedWeeks, minEndingCash]);

  const dsoMetrics = useMemo(() => {
    return computeDsoMetrics(invoices, annualSales);
  }, [invoices, annualSales]);

  const breakevenMetrics = useMemo(() => {
    return computeBreakeven(breakevenConfig);
  }, [breakevenConfig]);

  const eoqMetrics = useMemo(() => {
    return computeEoqMetrics(eoqConfig);
  }, [eoqConfig]);

  // AI Copilot Integration
  useAppAgent({
    appId: 'business-ops-hub',
    appName: 'Business Operations & Cash Flow Hub',
    getContext: () => ({
      activeTab,
      startingCash,
      minProjectedCash: minEndingCash,
      minCashWeek: minWeekObj.label,
      totalOverdueAr: dsoMetrics.overdueAr,
      dsoDays: dsoMetrics.dsoDays,
      breakevenUnits: breakevenMetrics.breakevenUnits,
      currentMonthlyProfit: breakevenMetrics.currentProfit,
      eoqOptimalBatch: eoqMetrics.eoqUnits,
      landedUnitCost: eoqMetrics.totalLandedCost
    }),
    suggestedPrompts: [
      'What week is our cash runway tightest?',
      'Draft a polite invoice reminder for Apex Retail (62 days overdue)',
      'How does a 10% tariff increase affect our landed cost?',
      'Calculate unit breakeven if fixed costs rise by $5,000'
    ],
    actions: [
      {
        name: 'add_cashflow_entry',
        description: 'Update expected AR inflow or AP outflow for a specific week',
        parameters: {
          weekNumber: { type: 'number', description: 'Week number 1 to 13' },
          arInflow: { type: 'number', description: 'Expected client collections' },
          apOutflow: { type: 'number', description: 'Expected vendor payments' },
          note: { type: 'string', description: 'Reason or milestone description' }
        },
        handler: ({ weekNumber, arInflow, apOutflow, note = '' }) => {
          const wNum = Number(weekNumber);
          if (wNum < 1 || wNum > 13) throw new Error('Week number must be between 1 and 13');
          setCashFlowWeeks(prev => prev.map(w => {
            if (w.week === wNum) {
              return {
                ...w,
                arInflow: arInflow !== undefined ? Number(arInflow) : w.arInflow,
                apOutflow: apOutflow !== undefined ? Number(apOutflow) : w.apOutflow,
                notes: note || w.notes
              };
            }
            return w;
          }));
          return { success: true, updatedWeek: wNum };
        }
      },
      {
        name: 'calculate_eoq',
        description: 'Calculate and update Economic Order Quantity parameters',
        parameters: {
          annualDemand: { type: 'number', description: 'Annual unit consumption' },
          orderCost: { type: 'number', description: 'Fixed cost to place an order' },
          holdingCost: { type: 'number', description: 'Annual carrying cost per unit' }
        },
        handler: ({ annualDemand, orderCost, holdingCost }) => {
          setEoqConfig(prev => ({
            ...prev,
            annualDemand: Number(annualDemand) || prev.annualDemand,
            orderCost: Number(orderCost) || prev.orderCost,
            holdingCostPerUnit: Number(holdingCost) || prev.holdingCostPerUnit
          }));
          return { success: true };
        }
      }
    ]
  });

  return (
    <AppShell title="Business Operations & Cash Flow Hub" icon="fas fa-briefcase">
      <div className="bops-hub-container">
        {/* Top KPI Metrics Bar */}
        <div className="bops-kpi-grid">
          <div className={`bops-kpi-card ${minEndingCash < minCashBuffer ? 'alert' : 'cash'}`}>
            <div className="kpi-icon-wrap"><i className="fas fa-money-bill-trend-up"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">13-Week Min Cash Point</span>
              <div className="kpi-val">${minEndingCash.toLocaleString()}</div>
              <span className="kpi-sub">Tightest runway in {minWeekObj.label}</span>
            </div>
          </div>

          <div className="bops-kpi-card ar">
            <div className="kpi-icon-wrap"><i className="fas fa-file-invoice-dollar"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">Overdue Invoices (DSO)</span>
              <div className="kpi-val">${dsoMetrics.overdueAr.toLocaleString()}</div>
              <span className="kpi-sub">{dsoMetrics.dsoDays} Days Sales Outstanding</span>
            </div>
          </div>

          <div className="bops-kpi-card margin">
            <div className="kpi-icon-wrap"><i className="fas fa-scale-balanced"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">Monthly Breakeven</span>
              <div className="kpi-val">{breakevenMetrics.breakevenUnits} <span className="kpi-unit">units</span></div>
              <span className="kpi-sub">${breakevenMetrics.breakevenRevenue.toLocaleString()} run-rate</span>
            </div>
          </div>

          <div className="bops-kpi-card eoq">
            <div className="kpi-icon-wrap"><i className="fas fa-boxes-stacked"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">Optimal EOQ Order</span>
              <div className="kpi-val">{eoqMetrics.eoqUnits} <span className="kpi-unit">units</span></div>
              <span className="kpi-sub">${eoqMetrics.totalLandedCost} landed cost/unit</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bops-tabs-header">
          <button
            className={`bops-tab-btn ${activeTab === 'cashflow' ? 'active' : ''}`}
            onClick={() => setTab('cashflow')}
          >
            <i className="fas fa-calendar-week"></i> 13-Week Cash Runway
          </button>
          <button
            className={`bops-tab-btn ${activeTab === 'invoicing' ? 'active' : ''}`}
            onClick={() => setTab('invoicing')}
          >
            <i className="fas fa-receipt"></i> Invoicing & DSO Aging
          </button>
          <button
            className={`bops-tab-btn ${activeTab === 'breakeven' ? 'active' : ''}`}
            onClick={() => setTab('breakeven')}
          >
            <i className="fas fa-chart-pie"></i> Pricing & Breakeven
          </button>
          <button
            className={`bops-tab-btn ${activeTab === 'eoq' ? 'active' : ''}`}
            onClick={() => setTab('eoq')}
          >
            <i className="fas fa-dolly"></i> EOQ & Landed Logistics
          </button>
        </div>

        {/* Tab 1: 13-Week Cash Flow */}
        {activeTab === 'cashflow' && (
          <div className="bops-tab-content">
            <div className="bops-section-header">
              <div>
                <h3>13-Week Direct Cash Flow Runway Forecaster</h3>
                <p>Direct weekly mapping of accounts receivable collections against payroll cycles and vendor payables.</p>
              </div>
              <div className="starting-cash-ctrl">
                <span>Opening Cash:</span>
                <input
                  type="number"
                  value={startingCash}
                  onChange={e => setStartingCash(Number(e.target.value) || 0)}
                  className="inline-cash-input"
                />
              </div>
            </div>

            <div className="bops-card table-card">
              <table className="bops-data-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Opening Cash</th>
                    <th>AR Inflows (+)</th>
                    <th>AP Vendors (-)</th>
                    <th>Payroll (-)</th>
                    <th>Net Weekly</th>
                    <th>Ending Balance</th>
                    <th>Status / Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {computedWeeks.map(w => (
                    <tr key={w.week} className={w.isAlert ? 'row-alert' : ''}>
                      <td><strong>{w.label}</strong></td>
                      <td>${w.startingCash.toLocaleString()}</td>
                      <td className="green-text">+${w.arInflow.toLocaleString()}</td>
                      <td className="red-text">-${w.apOutflow.toLocaleString()}</td>
                      <td>{w.payroll > 0 ? `-$${w.payroll.toLocaleString()}` : '—'}</td>
                      <td className={w.netCash >= 0 ? 'green-text' : 'red-text'}>
                        {w.netCash >= 0 ? `+$${w.netCash.toLocaleString()}` : `-$${Math.abs(w.netCash).toLocaleString()}`}
                      </td>
                      <td>
                        <strong className={w.endingCash < minCashBuffer ? 'alert-ending' : ''}>
                          ${w.endingCash.toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        {w.isAlert ? (
                          <span className="alert-pill"><i className="fas fa-triangle-exclamation"></i> Below Buffer</span>
                        ) : (
                          <span className="ok-pill"><i className="fas fa-circle-check"></i> Healthy</span>
                        )}
                        {w.notes && <span className="week-note">{w.notes}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Invoicing & DSO Aging */}
        {activeTab === 'invoicing' && (
          <div className="bops-tab-content">
            <div className="bops-section-header">
              <div>
                <h3>Smart Invoicing & Days Sales Outstanding (DSO)</h3>
                <p>Identify trapped working capital and prevent bad debt write-offs.</p>
              </div>
            </div>

            <div className="bops-two-col">
              <div className="bops-card table-card">
                <table className="bops-data-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Client Name</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Aging Bucket</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td><code>{inv.id}</code></td>
                        <td><strong>{inv.client}</strong></td>
                        <td>${inv.amount.toLocaleString()}</td>
                        <td>{inv.dueDate}</td>
                        <td>
                          <span className={`bucket-pill ${inv.status}`}>
                            {inv.bucket}
                          </span>
                        </td>
                        <td>
                          {inv.status === 'critical' && <span className="status-badge critical">Critical 90+</span>}
                          {inv.status === 'overdue' && <span className="status-badge overdue">Overdue</span>}
                          {inv.status === 'pending' && <span className="status-badge pending">Current</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bops-card stats-side-card">
                <h4><i className="fas fa-chart-simple"></i> Working Capital Summary</h4>
                <div className="summary-list">
                  <div className="summary-row">
                    <span>Total Outstanding AR:</span>
                    <strong>${dsoMetrics.totalAr.toLocaleString()}</strong>
                  </div>
                  <div className="summary-row overdue">
                    <span>Overdue Balance:</span>
                    <strong>${dsoMetrics.overdueAr.toLocaleString()}</strong>
                  </div>
                  <div className="summary-row highlight">
                    <span>Average DSO:</span>
                    <strong>{dsoMetrics.dsoDays} Days</strong>
                  </div>
                  <div className="summary-row">
                    <span>Industry Benchmark:</span>
                    <span>35 - 45 Days</span>
                  </div>
                </div>

                <div className="chaser-box">
                  <h5><i className="fas fa-wand-magic-sparkles"></i> AI Invoice Chaser</h5>
                  <p>Ask UltraSudo Copilot to draft a polite or firm payment reminder tailored to client aging history.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Breakeven & Margins */}
        {activeTab === 'breakeven' && (
          <div className="bops-tab-content">
            <div className="bops-section-header">
              <div>
                <h3>Unit Economics & Breakeven Analysis</h3>
                <p>Ensure product lines maintain healthy contribution margins to cover fixed operations.</p>
              </div>
            </div>

            <div className="bops-two-col">
              <div className="bops-card form-card">
                <h4>Cost & Price Drivers</h4>
                <div className="form-group">
                  <label>Monthly Fixed Overhead (Rent, Core Staff, SaaS)</label>
                  <input
                    type="number"
                    value={breakevenConfig.monthlyFixedCosts}
                    onChange={e => setBreakevenConfig({ ...breakevenConfig, monthlyFixedCosts: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Unit Selling Price (Revenue)</label>
                  <input
                    type="number"
                    value={breakevenConfig.unitSellingPrice}
                    onChange={e => setBreakevenConfig({ ...breakevenConfig, unitSellingPrice: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Unit Variable Cost (COGS, Materials, Delivery)</label>
                  <input
                    type="number"
                    value={breakevenConfig.unitVariableCost}
                    onChange={e => setBreakevenConfig({ ...breakevenConfig, unitVariableCost: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Target Monthly Net Profit ($)</label>
                  <input
                    type="number"
                    value={breakevenConfig.targetMonthlyProfit}
                    onChange={e => setBreakevenConfig({ ...breakevenConfig, targetMonthlyProfit: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="bops-card metrics-display-card">
                <h4>Computed Margin & Targets</h4>
                <div className="display-metric-box">
                  <span className="lbl">Unit Contribution Margin</span>
                  <div className="val">${breakevenMetrics.contributionMargin} ({breakevenMetrics.cmRatio}%)</div>
                </div>

                <div className="display-metric-box highlight">
                  <span className="lbl">Breakeven Volume (Zero Loss)</span>
                  <div className="val">{breakevenMetrics.breakevenUnits} Units</div>
                  <span className="sub">${breakevenMetrics.breakevenRevenue.toLocaleString()} monthly revenue</span>
                </div>

                <div className="display-metric-box profit">
                  <span className="lbl">Volume for Target ${breakevenConfig.targetMonthlyProfit.toLocaleString()} Profit</span>
                  <div className="val">{breakevenMetrics.targetUnits} Units / month</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: EOQ & Landed Logistics */}
        {activeTab === 'eoq' && (
          <div className="bops-tab-content">
            <div className="bops-section-header">
              <div>
                <h3>Economic Order Quantity (EOQ) & Landed Tariff Calculator</h3>
                <p>Balance ordering costs and inventory holding capital while determining true per-unit landed costs.</p>
              </div>
            </div>

            <div className="bops-two-col">
              <div className="bops-card form-card">
                <h4>Inventory & Logistics Inputs</h4>
                <div className="form-group">
                  <label>Annual Demand (Units/Year)</label>
                  <input
                    type="number"
                    value={eoqConfig.annualDemand}
                    onChange={e => setEoqConfig({ ...eoqConfig, annualDemand: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Order Placement Cost ($ per PO)</label>
                  <input
                    type="number"
                    value={eoqConfig.orderCost}
                    onChange={e => setEoqConfig({ ...eoqConfig, orderCost: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Holding Cost per Unit / Year ($)</label>
                  <input
                    type="number"
                    value={eoqConfig.holdingCostPerUnit}
                    onChange={e => setEoqConfig({ ...eoqConfig, holdingCostPerUnit: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Import Tariff Duty Rate (%)</label>
                  <input
                    type="number"
                    value={eoqConfig.tariffRatePct}
                    onChange={e => setEoqConfig({ ...eoqConfig, tariffRatePct: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="bops-card metrics-display-card">
                <h4>Optimal Reorder & Landed Cost</h4>
                <div className="display-metric-box">
                  <span className="lbl">Optimal Order Batch (Wilson EOQ)</span>
                  <div className="val">{eoqMetrics.eoqUnits} Units</div>
                  <span className="sub">{eoqMetrics.ordersPerYear} orders per year</span>
                </div>

                <div className="display-metric-box highlight">
                  <span className="lbl">Reorder Trigger Point</span>
                  <div className="val">{eoqMetrics.reorderPoint} Units in Stock</div>
                  <span className="sub">Includes {eoqMetrics.safetyStock} buffer safety stock</span>
                </div>

                <div className="display-metric-box landed">
                  <span className="lbl">Total Per-Unit Landed Cost</span>
                  <div className="val">${eoqMetrics.totalLandedCost}</div>
                  <span className="sub">Ex-works ($65) + Freight ($8.50) + Tariff (${eoqMetrics.tariffCost}) + Customs & Local</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
