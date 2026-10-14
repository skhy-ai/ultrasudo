/**
 * UltraSudo — ESG & Sustainability Calculation Engines and Datasets
 * Based on official GHG Protocol, US EPA eGRID, and UK DEFRA standard emission factors.
 */

// ── Standard Emission Factors ────────────────────────────────────────────────
export const EMISSION_FACTORS = {
  // Scope 1: Fuel Combustion (kg CO2e per unit)
  naturalGas_therms: 5.306,        // per therm
  naturalGas_m3: 2.03,             // per cubic meter
  diesel_gallons: 10.21,           // per US gallon
  diesel_liters: 2.687,            // per liter
  gasoline_gallons: 8.78,          // per US gallon
  gasoline_liters: 2.315,          // per liter
  lpg_gallons: 5.68,               // per US gallon
  refrigerant_r410a_kg: 2088,      // GWP per kg leaked
  refrigerant_r134a_kg: 1430,      // GWP per kg leaked

  // Scope 2: Electricity Grid Average Factors (kg CO2e per kWh)
  grid_us_average: 0.386,
  grid_us_california: 0.198,
  grid_us_texas: 0.402,
  grid_eu_average: 0.231,
  grid_uk: 0.207,
  grid_germany: 0.366,
  grid_india: 0.716,
  grid_australia: 0.656,
  grid_canada: 0.120,

  // Scope 3: Travel & Freight proxies (kg CO2e per unit)
  flight_short_haul_km: 0.158,     // passenger-km (<500 km)
  flight_long_haul_km: 0.102,      // passenger-km (>500 km)
  road_freight_tonne_km: 0.105,    // per tonne-km
  waste_landfill_kg: 0.45          // per kg municipal waste
};

// ── Realistic Benchmark Datasets ─────────────────────────────────────────────
export const INITIAL_SCOPE1_ENTRIES = [
  { id: 's1-1', facility: 'Headquarters & Warehouse', fuelType: 'naturalGas_therms', fuelLabel: 'Natural Gas (Heating)', quantity: 2450, unit: 'therms', category: 'Stationary Combustion' },
  { id: 's1-2', facility: 'Delivery & Service Van Fleet (6 vans)', fuelType: 'diesel_liters', fuelLabel: 'Fleet Diesel Fuel', quantity: 8200, unit: 'liters', category: 'Mobile Fleet' },
  { id: 's1-3', facility: 'Backup Generator', fuelType: 'diesel_liters', fuelLabel: 'Diesel Backup Generator', quantity: 450, unit: 'liters', category: 'Stationary Combustion' },
  { id: 's1-4', facility: 'Server Room HVAC System', fuelType: 'refrigerant_r410a_kg', fuelLabel: 'R-410A Refrigerant Top-up', quantity: 1.5, unit: 'kg', category: 'Fugitive Emissions' }
];

export const INITIAL_SCOPE2_ENTRIES = [
  { id: 's2-1', facility: 'Main Office & Tech Hub', region: 'grid_us_average', regionLabel: 'US National Grid Average', kwh: 64200, renewablePct: 20 },
  { id: 's2-2', facility: 'Assembly & Storage Facility', region: 'grid_us_texas', regionLabel: 'ERCOT / Texas Grid', kwh: 112500, renewablePct: 15 },
  { id: 's2-3', facility: 'European Remote Operations Hub', region: 'grid_eu_average', regionLabel: 'EU Grid Average', kwh: 28400, renewablePct: 60 }
];

export const INITIAL_SCOPE3_ITEMS = [
  { id: 's3-1', activity: 'Executive & Client Business Flights', quantity: 42000, unit: 'passenger-km', factorKey: 'flight_long_haul_km', category: 'Business Travel' },
  { id: 's3-2', activity: 'B2B Pallet Freight Logistics', quantity: 68000, unit: 'tonne-km', factorKey: 'road_freight_tonne_km', category: 'Upstream Freight' },
  { id: 's3-3', activity: 'Office & Facility Landfill Waste', quantity: 9500, unit: 'kg', factorKey: 'waste_landfill_kg', category: 'Waste in Operations' }
];

export const GREEN_CAPEX_PROJECTS = [
  {
    id: 'capex-1',
    name: 'Rooftop Solar PV Array (85 kWp)',
    category: 'Renewable Power',
    capexCost: 98000,
    annualEnergySavedKwh: 115000,
    annualCostSavingsUsd: 18400,
    incentivesSubsidiesUsd: 29400, // 30% Federal ITC
    avoidedTco2ePerYear: 44.4,
    status: 'Proposed'
  },
  {
    id: 'capex-2',
    name: 'Facility-wide Smart LED Retrofit & Occupancy Sensors',
    category: 'Energy Efficiency',
    capexCost: 14500,
    annualEnergySavedKwh: 36000,
    annualCostSavingsUsd: 5760,
    incentivesSubsidiesUsd: 3200,
    avoidedTco2ePerYear: 13.9,
    status: 'In Progress'
  },
  {
    id: 'capex-3',
    name: 'Fleet Electrification (Replace 3 Diesel Vans with Commercial EVs)',
    category: 'Green Fleet',
    capexCost: 142000,
    annualEnergySavedKwh: 0,
    annualCostSavingsUsd: 16800, // fuel + maintenance savings
    incentivesSubsidiesUsd: 22500, // clean vehicle credits
    avoidedTco2ePerYear: 22.1,
    status: 'Planned'
  }
];

// Helper calculations
export function calculateScope1Entry(entry) {
  const factor = EMISSION_FACTORS[entry.fuelType] || 0;
  const kg = entry.quantity * factor;
  return Number((kg / 1000).toFixed(2)); // metric tonnes CO2e (tCO2e)
}

export function calculateScope2Entry(entry) {
  const gridFactor = EMISSION_FACTORS[entry.region] || 0.386;
  const netKwh = entry.kwh * (1 - (entry.renewablePct || 0) / 100);
  const kg = netKwh * gridFactor;
  return Number((kg / 1000).toFixed(2));
}

export function calculateScope3Entry(entry) {
  const factor = EMISSION_FACTORS[entry.factorKey] || 0;
  const kg = entry.quantity * factor;
  return Number((kg / 1000).toFixed(2));
}
