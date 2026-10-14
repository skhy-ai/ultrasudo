import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../../components/shared/AppShell/AppShell';
import { useAppAgent } from '../../../hooks/useAppAgent';
import useLocalStore from '../../../hooks/useLocalStore';
import {
  EMISSION_FACTORS,
  INITIAL_SCOPE1_ENTRIES,
  INITIAL_SCOPE2_ENTRIES,
  INITIAL_SCOPE3_ITEMS,
  GREEN_CAPEX_PROJECTS,
  calculateScope1Entry,
  calculateScope2Entry,
  calculateScope3Entry
} from '../../../data/esgData';
import './EsgHub.css';

export default function EsgHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'scope1';

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  // Local-First State with persistence
  const [scope1List, setScope1List] = useLocalStore('esg_scope1_entries', INITIAL_SCOPE1_ENTRIES);
  const [scope2List, setScope2List] = useLocalStore('esg_scope2_entries', INITIAL_SCOPE2_ENTRIES);
  const [scope3List, setScope3List] = useLocalStore('esg_scope3_entries', INITIAL_SCOPE3_ITEMS);
  const [capexList, setCapexList] = useLocalStore('esg_capex_projects', GREEN_CAPEX_PROJECTS);

  // New Scope 1 modal/form state
  const [newS1Facility, setNewS1Facility] = useState('');
  const [newS1Fuel, setNewS1Fuel] = useState('diesel_liters');
  const [newS1Qty, setNewS1Qty] = useState('');

  // New Scope 2 form state
  const [newS2Facility, setNewS2Facility] = useState('');
  const [newS2Region, setNewS2Region] = useState('grid_us_average');
  const [newS2Kwh, setNewS2Kwh] = useState('');
  const [newS2Renewable, setNewS2Renewable] = useState(0);

  // Totals calculations
  const totalScope1Tons = useMemo(() => {
    return Number(scope1List.reduce((acc, item) => acc + calculateScope1Entry(item), 0).toFixed(2));
  }, [scope1List]);

  const totalScope2Tons = useMemo(() => {
    return Number(scope2List.reduce((acc, item) => acc + calculateScope2Entry(item), 0).toFixed(2));
  }, [scope2List]);

  const totalScope3Tons = useMemo(() => {
    return Number(scope3List.reduce((acc, item) => acc + calculateScope3Entry(item), 0).toFixed(2));
  }, [scope3List]);

  const totalEmissionsTons = useMemo(() => {
    return Number((totalScope1Tons + totalScope2Tons + totalScope3Tons).toFixed(2));
  }, [totalScope1Tons, totalScope2Tons, totalScope3Tons]);

  const totalAvoidedTons = useMemo(() => {
    return Number(capexList.reduce((acc, p) => acc + (p.avoidedTco2ePerYear || 0), 0).toFixed(1));
  }, [capexList]);

  const totalAnnualSavingsUsd = useMemo(() => {
    return capexList.reduce((acc, p) => acc + (p.annualCostSavingsUsd || 0), 0);
  }, [capexList]);

  // AI Copilot Integration
  useAppAgent({
    appId: 'esg-hub',
    appName: 'ESG & Sustainability Hub',
    getContext: () => ({
      activeTab,
      totalEmissionsTco2e: totalEmissionsTons,
      scope1TotalTco2e: totalScope1Tons,
      scope2TotalTco2e: totalScope2Tons,
      scope3TotalTco2e: totalScope3Tons,
      totalAvoidedTco2ePerYear: totalAvoidedTons,
      annualUtilitySavingsUsd: totalAnnualSavingsUsd,
      activeProjectsCount: capexList.length
    }),
    suggestedPrompts: [
      'Calculate emissions for 15,000 kWh monthly electricity in California',
      'What are our highest Scope 1 emission sources?',
      'Simulate payback period for a $120k solar array',
      'Generate an executive summary of our SME carbon footprint'
    ],
    actions: [
      {
        name: 'add_scope1_entry',
        description: 'Add a fuel or fleet entry to Scope 1 emissions',
        parameters: {
          facility: { type: 'string', description: 'Name of the facility, warehouse, or fleet' },
          fuelType: { type: 'string', description: 'One of: naturalGas_therms, diesel_liters, gasoline_liters, refrigerant_r410a_kg' },
          quantity: { type: 'number', description: 'Volume or weight consumed' }
        },
        handler: ({ facility, fuelType, quantity }) => {
          if (!facility || !quantity) throw new Error('Facility and quantity are required');
          const labels = {
            naturalGas_therms: 'Natural Gas (Heating)',
            diesel_liters: 'Fleet Diesel Fuel',
            gasoline_liters: 'Gasoline Vehicle Fuel',
            refrigerant_r410a_kg: 'R-410A Refrigerant Leakage'
          };
          const units = {
            naturalGas_therms: 'therms',
            diesel_liters: 'liters',
            gasoline_liters: 'liters',
            refrigerant_r410a_kg: 'kg'
          };
          const newEntry = {
            id: `s1-${Date.now()}`,
            facility,
            fuelType: fuelType || 'diesel_liters',
            fuelLabel: labels[fuelType] || fuelType,
            quantity: Number(quantity),
            unit: units[fuelType] || 'units',
            category: fuelType?.includes('refrigerant') ? 'Fugitive Emissions' : 'Combustion'
          };
          setScope1List(prev => [...prev, newEntry]);
          return { success: true, entry: newEntry, tco2e: calculateScope1Entry(newEntry) };
        }
      },
      {
        name: 'add_scope2_entry',
        description: 'Add electricity grid usage entry for Scope 2 emissions',
        parameters: {
          facility: { type: 'string', description: 'Facility or office name' },
          kwh: { type: 'number', description: 'Annual or period electricity consumed in kWh' },
          region: { type: 'string', description: 'Grid key: grid_us_average, grid_us_california, grid_us_texas, grid_eu_average, grid_uk, grid_germany, grid_india' },
          renewablePct: { type: 'number', description: 'Percentage of green/solar tariffs (0-100)' }
        },
        handler: ({ facility, kwh, region = 'grid_us_average', renewablePct = 0 }) => {
          if (!facility || !kwh) throw new Error('Facility and kWh are required');
          const newEntry = {
            id: `s2-${Date.now()}`,
            facility,
            region,
            regionLabel: region.replace(/_/g, ' ').toUpperCase(),
            kwh: Number(kwh),
            renewablePct: Number(renewablePct)
          };
          setScope2List(prev => [...prev, newEntry]);
          return { success: true, entry: newEntry, tco2e: calculateScope2Entry(newEntry) };
        }
      },
      {
        name: 'simulate_solar_roi',
        description: 'Add a proposed green CapEx energy efficiency project',
        parameters: {
          projectName: { type: 'string', description: 'Title of clean energy initiative' },
          capexCost: { type: 'number', description: 'Total capital investment in USD' },
          annualCostSavingsUsd: { type: 'number', description: 'Expected annual utility savings in USD' },
          avoidedTco2ePerYear: { type: 'number', description: 'Tons of CO2e reduced annually' }
        },
        handler: ({ projectName, capexCost, annualCostSavingsUsd, avoidedTco2ePerYear }) => {
          const newProj = {
            id: `capex-${Date.now()}`,
            name: projectName,
            category: 'Clean Energy',
            capexCost: Number(capexCost),
            annualEnergySavedKwh: Math.round(Number(annualCostSavingsUsd) / 0.16),
            annualCostSavingsUsd: Number(annualCostSavingsUsd),
            incentivesSubsidiesUsd: Math.round(Number(capexCost) * 0.3), // 30% tax credit
            avoidedTco2ePerYear: Number(avoidedTco2ePerYear),
            status: 'Proposed'
          };
          setCapexList(prev => [...prev, newProj]);
          return { success: true, project: newProj, paybackYears: (newProj.capexCost - newProj.incentivesSubsidiesUsd) / (newProj.annualCostSavingsUsd || 1) };
        }
      }
    ]
  });

  const handleAddScope1 = (e) => {
    e.preventDefault();
    if (!newS1Facility.trim() || !newS1Qty) return;
    const labels = {
      naturalGas_therms: 'Natural Gas (Heating)',
      diesel_liters: 'Fleet Diesel Fuel',
      gasoline_liters: 'Gasoline Fuel',
      refrigerant_r410a_kg: 'R-410A Refrigerant Leak'
    };
    const units = {
      naturalGas_therms: 'therms',
      diesel_liters: 'liters',
      gasoline_liters: 'liters',
      refrigerant_r410a_kg: 'kg'
    };
    const newEntry = {
      id: `s1-${Date.now()}`,
      facility: newS1Facility.trim(),
      fuelType: newS1Fuel,
      fuelLabel: labels[newS1Fuel],
      quantity: parseFloat(newS1Qty),
      unit: units[newS1Fuel],
      category: newS1Fuel.includes('refrigerant') ? 'Fugitive Emissions' : 'Fuel Combustion'
    };
    setScope1List([...scope1List, newEntry]);
    setNewS1Facility('');
    setNewS1Qty('');
  };

  const handleDeleteScope1 = (id) => {
    setScope1List(scope1List.filter(item => item.id !== id));
  };

  const handleAddScope2 = (e) => {
    e.preventDefault();
    if (!newS2Facility.trim() || !newS2Kwh) return;
    const regionLabels = {
      grid_us_average: 'US Grid Average',
      grid_us_california: 'California (CAISO)',
      grid_us_texas: 'Texas (ERCOT)',
      grid_eu_average: 'EU Grid Average',
      grid_uk: 'United Kingdom',
      grid_germany: 'Germany Grid',
      grid_india: 'India National Grid',
      grid_australia: 'Australia Grid'
    };
    const newEntry = {
      id: `s2-${Date.now()}`,
      facility: newS2Facility.trim(),
      region: newS2Region,
      regionLabel: regionLabels[newS2Region] || newS2Region,
      kwh: parseFloat(newS2Kwh),
      renewablePct: parseFloat(newS2Renewable) || 0
    };
    setScope2List([...scope2List, newEntry]);
    setNewS2Facility('');
    setNewS2Kwh('');
    setNewS2Renewable(0);
  };

  const handleDeleteScope2 = (id) => {
    setScope2List(scope2List.filter(item => item.id !== id));
  };

  return (
    <AppShell title="ESG & Sustainability Hub" icon="fas fa-leaf">
      <div className="esg-hub-container">
        {/* Top KPI Metrics Bar */}
        <div className="esg-kpi-grid">
          <div className="esg-kpi-card total">
            <div className="kpi-icon-wrap"><i className="fas fa-smog"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">Total Carbon Footprint</span>
              <div className="kpi-val">{totalEmissionsTons} <span className="kpi-unit">tCO₂e</span></div>
              <span className="kpi-sub">Scope 1 + 2 + 3 combined</span>
            </div>
          </div>

          <div className="esg-kpi-card scope1">
            <div className="kpi-icon-wrap"><i className="fas fa-fire-flame-curved"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">Scope 1 (Direct Fuel)</span>
              <div className="kpi-val">{totalScope1Tons} <span className="kpi-unit">tCO₂e</span></div>
              <span className="kpi-sub">Fleet & facility gas combustion</span>
            </div>
          </div>

          <div className="esg-kpi-card scope2">
            <div className="kpi-icon-wrap"><i className="fas fa-bolt"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">Scope 2 (Electricity)</span>
              <div className="kpi-val">{totalScope2Tons} <span className="kpi-unit">tCO₂e</span></div>
              <span className="kpi-sub">Location & market grid load</span>
            </div>
          </div>

          <div className="esg-kpi-card capex">
            <div className="kpi-icon-wrap"><i className="fas fa-solar-panel"></i></div>
            <div className="kpi-meta">
              <span className="kpi-label">Avoided Emissions (CapEx)</span>
              <div className="kpi-val">-{totalAvoidedTons} <span className="kpi-unit">tCO₂e/yr</span></div>
              <span className="kpi-sub">${totalAnnualSavingsUsd.toLocaleString()} annual savings</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="esg-tabs-header">
          <button
            className={`esg-tab-btn ${activeTab === 'scope1' ? 'active' : ''}`}
            onClick={() => setTab('scope1')}
          >
            <i className="fas fa-gas-pump"></i> Scope 1 Emissions
          </button>
          <button
            className={`esg-tab-btn ${activeTab === 'scope2' ? 'active' : ''}`}
            onClick={() => setTab('scope2')}
          >
            <i className="fas fa-plug-circle-bolt"></i> Scope 2 Purchased Electricity
          </button>
          <button
            className={`esg-tab-btn ${activeTab === 'scope3' ? 'active' : ''}`}
            onClick={() => setTab('scope3')}
          >
            <i className="fas fa-truck-plane"></i> Scope 3 & Supplier Scorecard
          </button>
          <button
            className={`esg-tab-btn ${activeTab === 'capex' ? 'active' : ''}`}
            onClick={() => setTab('capex')}
          >
            <i className="fas fa-chart-line-down"></i> Green CapEx & ROI
          </button>
        </div>

        {/* Tab 1: Scope 1 */}
        {activeTab === 'scope1' && (
          <div className="esg-tab-content">
            <div className="esg-section-header">
              <div>
                <h3>Scope 1: Direct Greenhouse Gas Emissions</h3>
                <p>Combustion of stationary fuels (boilers, heaters, generators) and company vehicle fleet fuel.</p>
              </div>
            </div>

            <div className="esg-two-col">
              {/* Table of Entries */}
              <div className="esg-card table-card">
                <table className="esg-data-table">
                  <thead>
                    <tr>
                      <th>Facility / Source</th>
                      <th>Fuel / Type</th>
                      <th>Quantity</th>
                      <th>Category</th>
                      <th>Calculated tCO₂e</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scope1List.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.facility}</strong></td>
                        <td>{item.fuelLabel}</td>
                        <td>{item.quantity.toLocaleString()} {item.unit}</td>
                        <td><span className="badge-tag">{item.category}</span></td>
                        <td><span className="tco2e-badge">{calculateScope1Entry(item)} t</span></td>
                        <td>
                          <button className="row-del-btn" onClick={() => handleDeleteScope1(item.id)} title="Delete entry">
                            <i className="fas fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quick Add Form */}
              <div className="esg-card form-card">
                <h4><i className="fas fa-plus-circle"></i> Log Scope 1 Combustion</h4>
                <form onSubmit={handleAddScope1}>
                  <div className="form-group">
                    <label>Facility or Fleet Asset</label>
                    <input
                      type="text"
                      placeholder="e.g. Service Van #4 or Warehouse Boiler"
                      value={newS1Facility}
                      onChange={e => setNewS1Facility(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fuel Type / Refrigerant</label>
                    <select value={newS1Fuel} onChange={e => setNewS1Fuel(e.target.value)}>
                      <option value="diesel_liters">Fleet Diesel (Liters)</option>
                      <option value="gasoline_liters">Gasoline (Liters)</option>
                      <option value="naturalGas_therms">Natural Gas (Therms)</option>
                      <option value="refrigerant_r410a_kg">R-410A Refrigerant Leak (kg)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantity Consumed</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 1200"
                      value={newS1Qty}
                      onChange={e => setNewS1Qty(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="esg-primary-btn">
                    <i className="fas fa-calculator"></i> Calculate & Add Entry
                  </button>
                </form>
                <div className="esg-info-box">
                  <i className="fas fa-circle-info"></i>
                  <span>Calculations use standard EPA eGRID & DEFRA greenhouse gas conversion factors.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Scope 2 */}
        {activeTab === 'scope2' && (
          <div className="esg-tab-content">
            <div className="esg-section-header">
              <div>
                <h3>Scope 2: Purchased Electricity & Steam</h3>
                <p>Indirect emissions from consumption of purchased electricity across all company facilities.</p>
              </div>
            </div>

            <div className="esg-two-col">
              <div className="esg-card table-card">
                <table className="esg-data-table">
                  <thead>
                    <tr>
                      <th>Facility</th>
                      <th>Grid Sub-region</th>
                      <th>Electricity (kWh)</th>
                      <th>Renewable %</th>
                      <th>Net tCO₂e</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scope2List.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.facility}</strong></td>
                        <td>{item.regionLabel}</td>
                        <td>{item.kwh.toLocaleString()} kWh</td>
                        <td>
                          <span className={`renew-pill ${item.renewablePct > 0 ? 'active' : ''}`}>
                            {item.renewablePct}% Green
                          </span>
                        </td>
                        <td><span className="tco2e-badge">{calculateScope2Entry(item)} t</span></td>
                        <td>
                          <button className="row-del-btn" onClick={() => handleDeleteScope2(item.id)}>
                            <i className="fas fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="esg-card form-card">
                <h4><i className="fas fa-plus-circle"></i> Log Metered Electricity</h4>
                <form onSubmit={handleAddScope2}>
                  <div className="form-group">
                    <label>Facility Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Chicago Branch Office"
                      value={newS2Facility}
                      onChange={e => setNewS2Facility(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Grid Location</label>
                    <select value={newS2Region} onChange={e => setNewS2Region(e.target.value)}>
                      <option value="grid_us_average">US National Average (0.386 kg/kWh)</option>
                      <option value="grid_us_california">California CAISO (0.198 kg/kWh)</option>
                      <option value="grid_us_texas">Texas ERCOT (0.402 kg/kWh)</option>
                      <option value="grid_eu_average">EU Average (0.231 kg/kWh)</option>
                      <option value="grid_uk">United Kingdom (0.207 kg/kWh)</option>
                      <option value="grid_germany">Germany (0.366 kg/kWh)</option>
                      <option value="grid_india">India National (0.716 kg/kWh)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Total Metered kWh</label>
                    <input
                      type="number"
                      placeholder="e.g. 45000"
                      value={newS2Kwh}
                      onChange={e => setNewS2Kwh(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Verified Green Tariff / Solar %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0 - 100"
                      value={newS2Renewable}
                      onChange={e => setNewS2Renewable(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="esg-primary-btn">
                    <i className="fas fa-bolt"></i> Log Scope 2 Power
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Scope 3 & Scorecard */}
        {activeTab === 'scope3' && (
          <div className="esg-tab-content">
            <div className="esg-section-header">
              <div>
                <h3>Scope 3 & Supplier B2B Compliance</h3>
                <p>Value-chain upstream emissions (business travel, transport logistics, operational waste).</p>
              </div>
            </div>

            <div className="esg-card table-card" style={{ marginBottom: 24 }}>
              <table className="esg-data-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Category</th>
                    <th>Volume</th>
                    <th>Emission Rate</th>
                    <th>Total tCO₂e</th>
                  </tr>
                </thead>
                <tbody>
                  {scope3List.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.activity}</strong></td>
                      <td><span className="badge-tag">{item.category}</span></td>
                      <td>{item.quantity.toLocaleString()} {item.unit}</td>
                      <td>{EMISSION_FACTORS[item.factorKey]} kg/unit</td>
                      <td><span className="tco2e-badge">{calculateScope3Entry(item)} t</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="esg-card scorecard-card">
              <div className="scorecard-header">
                <div>
                  <h4>Enterprise Vendor ESG Readiness Score</h4>
                  <p>Standard questionnaire compliance for EcoVadis, CSRD, and Tier-1 buyer RFPs.</p>
                </div>
                <div className="scorecard-badge">84 / 100 · Grade A</div>
              </div>
              <div className="scorecard-bars">
                <div className="score-item">
                  <span>Scope 1 & 2 Metering Verified</span>
                  <div className="progress-bar"><div className="fill" style={{ width: '95%' }}></div></div>
                </div>
                <div className="score-item">
                  <span>Scope 3 Materiality Assessment</span>
                  <div className="progress-bar"><div className="fill" style={{ width: '70%' }}></div></div>
                </div>
                <div className="score-item">
                  <span>Emissions Reduction Target Published</span>
                  <div className="progress-bar"><div className="fill" style={{ width: '85%' }}></div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Green CapEx ROI */}
        {activeTab === 'capex' && (
          <div className="esg-tab-content">
            <div className="esg-section-header">
              <div>
                <h3>Green CapEx & Energy Efficiency ROI</h3>
                <p>Model financial payback periods, clean energy tax credits, and avoided emissions.</p>
              </div>
            </div>

            <div className="capex-project-grid">
              {capexList.map(proj => {
                const netCost = proj.capexCost - (proj.incentivesSubsidiesUsd || 0);
                const paybackYears = proj.annualCostSavingsUsd > 0 ? (netCost / proj.annualCostSavingsUsd).toFixed(1) : 'N/A';

                return (
                  <div key={proj.id} className="capex-card">
                    <div className="capex-badge-status">{proj.status}</div>
                    <h4>{proj.name}</h4>
                    <span className="capex-cat">{proj.category}</span>

                    <div className="capex-financials">
                      <div className="fin-row">
                        <span>Gross CapEx:</span>
                        <strong>${proj.capexCost.toLocaleString()}</strong>
                      </div>
                      <div className="fin-row green">
                        <span>Incentives / Tax Credits:</span>
                        <strong>-${(proj.incentivesSubsidiesUsd || 0).toLocaleString()}</strong>
                      </div>
                      <div className="fin-row highlight">
                        <span>Net Investment:</span>
                        <strong>${netCost.toLocaleString()}</strong>
                      </div>
                      <div className="fin-row">
                        <span>Annual Utility Savings:</span>
                        <strong>${proj.annualCostSavingsUsd.toLocaleString()}/yr</strong>
                      </div>
                      <div className="fin-row payback">
                        <span>Payback Period:</span>
                        <strong>{paybackYears} Years</strong>
                      </div>
                      <div className="fin-row carbon">
                        <span>Avoided Emissions:</span>
                        <strong>-{proj.avoidedTco2ePerYear} tCO₂e/yr</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
