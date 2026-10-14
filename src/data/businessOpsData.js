/**
 * UltraSudo — Business Operations & SME Cash Flow Engines and Datasets
 * Models 13-Week Cash Flow, Days Sales Outstanding (DSO), Pricing Breakeven, and EOQ Logistics.
 */

// ── 13-Week Cash Flow Baseline Model ─────────────────────────────────────────
export const INITIAL_CASH_FLOW_WEEKS = Array.from({ length: 13 }, (_, i) => {
  const weekNum = i + 1;
  const baseInflow = [32000, 24000, 48000, 19000, 52000, 31000, 28000, 61000, 22000, 45000, 34000, 58000, 41000][i];
  const apOutflow = [14000, 12000, 22000, 9500, 18000, 15000, 13000, 26000, 11000, 19000, 14000, 24000, 17000][i];
  // Bi-weekly payroll spikes (weeks 2, 4, 6, 8, 10, 12)
  const payroll = (weekNum % 2 === 0) ? 28500 : 0;
  // Monthly rent/facility on week 1, 5, 9, 13
  const rentOverhead = (weekNum % 4 === 1) ? 8200 : 1500;

  return {
    week: weekNum,
    label: `Week ${weekNum}`,
    arInflow: baseInflow,
    apOutflow: apOutflow,
    payroll: payroll,
    overhead: rentOverhead,
    notes: weekNum === 4 ? 'Large Client Retainer Due' : (weekNum === 8 ? 'Quarterly Tax Withholding' : '')
  };
});

// ── Invoicing & DSO Aging Buckets ─────────────────────────────────────────────
export const INITIAL_INVOICES = [
  { id: 'inv-101', client: 'Apex Retail Dynamics', amount: 14500, issueDate: '2026-07-15', dueDate: '2026-08-14', status: 'overdue', daysOverdue: 62, bucket: '61-90 days' },
  { id: 'inv-102', client: 'Nexus MedTech Solutions', amount: 28400, issueDate: '2026-08-01', dueDate: '2026-08-31', status: 'overdue', daysOverdue: 45, bucket: '31-60 days' },
  { id: 'inv-103', client: 'Starlight Bio-Labs', amount: 9800, issueDate: '2026-09-01', dueDate: '2026-10-01', status: 'overdue', daysOverdue: 14, bucket: '1-30 days' },
  { id: 'inv-104', client: 'Vanguard Global Logistics', amount: 37500, issueDate: '2026-09-20', dueDate: '2026-10-20', status: 'pending', daysOverdue: 0, bucket: 'Current' },
  { id: 'inv-105', client: 'Crestview Capital Partners', amount: 16200, issueDate: '2026-09-28', dueDate: '2026-10-28', status: 'pending', daysOverdue: 0, bucket: 'Current' },
  { id: 'inv-106', client: 'Horizon Digital Studio', amount: 6400, issueDate: '2026-06-10', dueDate: '2026-07-10', status: 'critical', daysOverdue: 96, bucket: '90+ days' }
];

// ── Pricing & Breakeven Default Model ────────────────────────────────────────
export const INITIAL_BREAKEVEN_CONFIG = {
  productName: 'Enterprise SaaS License & Hardware Unit',
  monthlyFixedCosts: 38500,   // Rent, core salaries, insurance, hosting
  unitSellingPrice: 450,       // Revenue per unit sold
  unitVariableCost: 195,       // COGS, direct materials, shipping per unit
  currentMonthlyUnits: 180,    // Current sales run rate
  targetMonthlyProfit: 25000   // Target profit goal
};

// ── EOQ & Supply Chain Logistics Defaults ────────────────────────────────────
export const INITIAL_EOQ_CONFIG = {
  skuName: 'SKU-7740 Industrial Controller PCB',
  annualDemand: 6000,         // Units needed per year (D)
  orderCost: 220,              // Cost per purchase order placement (S)
  holdingCostPerUnit: 14.50,   // Annual storage, insurance, capital cost (H)
  leadTimeDays: 18,            // Supplier transit/lead time
  dailyUsage: 25,              // Average daily consumption
  safetyStockDays: 7,          // Buffer inventory days

  // Landed Cost parameters
  exWorksUnitCost: 65.00,
  freightPerUnit: 8.50,
  tariffRatePct: 7.5,          // Import duty
  customsFeesPerUnit: 2.20,
  localDeliveryPerUnit: 3.10
};

// ── Formulas ─────────────────────────────────────────────────────────────────
export function compute13WeekCashFlow(startingCash = 85000, minCashThreshold = 25000, weeks = INITIAL_CASH_FLOW_WEEKS) {
  let runningBalance = startingCash;
  return weeks.map(w => {
    const totalOutflow = w.apOutflow + w.payroll + w.overhead;
    const netCash = w.arInflow - totalOutflow;
    const starting = runningBalance;
    runningBalance += netCash;
    return {
      ...w,
      startingCash: starting,
      totalOutflow,
      netCash,
      endingCash: runningBalance,
      isAlert: runningBalance < minCashThreshold
    };
  });
}

export function computeDsoMetrics(invoices = INITIAL_INVOICES, annualCreditSales = 420000) {
  const totalAr = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAr = invoices.filter(i => i.status === 'overdue' || i.status === 'critical').reduce((sum, inv) => sum + inv.amount, 0);
  // Standard DSO formula = (Total AR / Total Credit Sales) * 365
  const dsoDays = Math.round((totalAr / (annualCreditSales || 1)) * 365);
  return { totalAr, overdueAr, dsoDays };
}

export function computeBreakeven(cfg = INITIAL_BREAKEVEN_CONFIG) {
  const contributionMargin = cfg.unitSellingPrice - cfg.unitVariableCost;
  const cmRatio = contributionMargin / (cfg.unitSellingPrice || 1);
  const breakevenUnits = contributionMargin > 0 ? Math.ceil(cfg.monthlyFixedCosts / contributionMargin) : 0;
  const breakevenRevenue = breakevenUnits * cfg.unitSellingPrice;
  const targetUnits = contributionMargin > 0 ? Math.ceil((cfg.monthlyFixedCosts + cfg.targetMonthlyProfit) / contributionMargin) : 0;
  const currentProfit = (cfg.currentMonthlyUnits * contributionMargin) - cfg.monthlyFixedCosts;

  return {
    contributionMargin,
    cmRatio: Number((cmRatio * 100).toFixed(1)),
    breakevenUnits,
    breakevenRevenue,
    targetUnits,
    currentProfit
  };
}

export function computeEoqMetrics(cfg = INITIAL_EOQ_CONFIG) {
  // Wilson EOQ Formula: sqrt((2 * D * S) / H)
  const eoqUnits = Math.round(Math.sqrt((2 * cfg.annualDemand * cfg.orderCost) / (cfg.holdingCostPerUnit || 1)));
  const ordersPerYear = Math.round(cfg.annualDemand / (eoqUnits || 1));
  const safetyStock = Math.round(cfg.dailyUsage * cfg.safetyStockDays);
  const reorderPoint = Math.round((cfg.dailyUsage * cfg.leadTimeDays) + safetyStock);

  // Landed Cost
  const tariffCost = cfg.exWorksUnitCost * (cfg.tariffRatePct / 100);
  const totalLandedCost = cfg.exWorksUnitCost + cfg.freightPerUnit + tariffCost + cfg.customsFeesPerUnit + cfg.localDeliveryPerUnit;

  return {
    eoqUnits,
    ordersPerYear,
    safetyStock,
    reorderPoint,
    tariffCost: Number(tariffCost.toFixed(2)),
    totalLandedCost: Number(totalLandedCost.toFixed(2))
  };
}
