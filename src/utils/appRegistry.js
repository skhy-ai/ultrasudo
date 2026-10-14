/**
 * APP_REGISTRY & HUB_REGISTRY — Central definition of all applications in Ultrasudo.
 *
 * All applications are grouped into consolidated Hubs to eliminate visual clutter
 * while guaranteeing that NO application is left orphan.
 */

export const HUB_REGISTRY = [
  {
    id: 'esg-hub',
    name: 'ESG & Sustainability Hub',
    description: 'GHG Scope 1 & 2 emissions inventory, Scope 3 supply chain scorecard, and Green CapEx Solar/Heat-pump ROI.',
    icon: 'fas fa-leaf',
    category: 'sme-ops',
    path: '/app/esg',
    type: 'react',
    badge: 'SME Standard',
    colorGradient: 'linear-gradient(135deg, #10b981, #059669)',
    subApps: [
      { id: 'scope1-calc', name: 'Scope 1 Fuel Logs', path: '/app/esg?tab=scope1', icon: 'fas fa-fire-flame-curved' },
      { id: 'scope2-calc', name: 'Scope 2 Electricity & Grid', path: '/app/esg?tab=scope2', icon: 'fas fa-bolt' },
      { id: 'scope3-calc', name: 'Scope 3 Supply Chain', path: '/app/esg?tab=scope3', icon: 'fas fa-truck-ramp-box' },
      { id: 'capex-sim', name: 'Green CapEx & Solar ROI', path: '/app/esg?tab=capex', icon: 'fas fa-solar-panel' }
    ]
  },
  {
    id: 'bops-hub',
    name: 'Business Operations & Cash Flow Hub',
    description: '13-week direct cash runway forecaster, smart invoicing with DSO aging, unit breakeven model, and Wilson EOQ landed cost logistics.',
    icon: 'fas fa-briefcase',
    category: 'sme-ops',
    path: '/app/business-ops',
    type: 'react',
    badge: 'Cash Runway',
    colorGradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    subApps: [
      { id: 'cashflow-13w', name: '13-Week Cash Runway', path: '/app/business-ops?tab=cashflow', icon: 'fas fa-calendar-week' },
      { id: 'dso-invoicing', name: 'Invoicing & DSO Aging', path: '/app/business-ops?tab=invoicing', icon: 'fas fa-receipt' },
      { id: 'breakeven-model', name: 'Pricing & Breakeven', path: '/app/business-ops?tab=breakeven', icon: 'fas fa-chart-pie' },
      { id: 'eoq-landed', name: 'EOQ & Landed Logistics', path: '/app/business-ops?tab=eoq', icon: 'fas fa-dolly' }
    ]
  },
  {
    id: 'legal-compliance-hub',
    name: 'Legal, HR & Compliance Hub',
    description: 'Contract risk redliner with standard counter-clauses, fully burdened labor rate calculator, HR policy handbook, and GDPR/cybersecurity audit.',
    icon: 'fas fa-scale-balanced',
    category: 'sme-ops',
    path: '/app/legal-compliance',
    type: 'react',
    badge: 'Governance',
    colorGradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    subApps: [
      { id: 'contract-redliner', name: 'Contract & NDA Redliner', path: '/app/legal-compliance?tab=redliner', icon: 'fas fa-pen-fancy' },
      { id: 'burdened-labor', name: 'Fully Burdened Labor Rate', path: '/app/legal-compliance?tab=labor', icon: 'fas fa-user-clock' },
      { id: 'hr-handbook', name: 'HR Policy Handbook', path: '/app/legal-compliance?tab=handbook', icon: 'fas fa-book' },
      { id: 'privacy-audit', name: 'Cyber & GDPR Audit', path: '/app/legal-compliance?tab=privacy', icon: 'fas fa-shield-halved' }
    ]
  },
  {
    id: 'finance-hub',
    name: 'Finance & Markets Hub',
    description: 'Real-time stock ticker, peer-to-peer money transfers, investment portfolio manager, and multi-currency converter.',
    icon: 'fas fa-chart-line',
    category: 'finance',
    path: '/app/finance',
    type: 'react',
    badge: 'Wealth & FX',
    colorGradient: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
    subApps: [
      { id: 'stock-ticker', name: 'Stock Ticker & Markets', path: '/app/finance?tab=markets', icon: 'fas fa-chart-candlestick' },
      { id: 'send-money', name: 'Send & Receive Money', path: '/app/finance?tab=payments', icon: 'fas fa-paper-plane' },
      { id: 'portfolio-manager', name: 'Portfolio Asset Manager', path: '/app/finance?tab=portfolio', icon: 'fas fa-wallet' },
      { id: 'currency-converter', name: 'Currency Converter', path: '/app/finance?tab=payments', icon: 'fas fa-money-bill-transfer' }
    ]
  },
  {
    id: 'productivity-hub',
    name: 'Productivity & Office Hub',
    description: 'Unified workspace featuring Kanban boards, task lists, Pomodoro timers, spreadsheet modeling, markdown documentation, and calculators.',
    icon: 'fas fa-stopwatch',
    category: 'productivity',
    path: '/app/productivity',
    type: 'react',
    badge: 'Workspace',
    colorGradient: 'linear-gradient(135deg, #f59e0b, #b45309)',
    subApps: [
      { id: 'todo-list', name: 'Tasks & Checklists', path: '/app/productivity?tab=tasks', icon: 'fas fa-list-check' },
      { id: 'kanban-board', name: 'Kanban Sprint Board', path: '/app/productivity?tab=kanban', icon: 'fas fa-columns' },
      { id: 'pomodoro-timer', name: 'Pomodoro Focus Timer', path: '/app/productivity?tab=timers', icon: 'fas fa-clock' },
      { id: 'markdown-editor', name: 'Markdown Docs Editor', path: '/app/markdown-editor', icon: 'fas fa-file-lines' },
      { id: 'spreadsheet-app', name: 'Spreadsheets', path: '/app/spreadsheet', icon: 'fas fa-table' },
      { id: 'notebook', name: 'AI Notebook', path: '/app/notebook', icon: 'fas fa-file-word' },
      { id: 'calculator', name: 'Scientific Calculator', path: '/app/calculator', icon: 'fas fa-calculator' },
      { id: 'quote-generator', name: 'Quote & Catalog', path: '/app/quote-generator', icon: 'fas fa-quote-left' },
      { id: 'calendar', name: 'Company Calendar', src: '/calendar/index.html', icon: 'fas fa-calendar-days', type: 'offline' }
    ]
  },
  {
    id: 'health-hub',
    name: 'Health & Lifestyle Hub',
    description: 'Personal and employee wellness, healthy kitchen nutrition planner, guided yoga, symptom diagnostics, grocery organizer, and greeting cards.',
    icon: 'fas fa-heart-pulse',
    category: 'lifestyle',
    path: '/app/health',
    type: 'react',
    badge: 'Wellness',
    colorGradient: 'linear-gradient(135deg, #ec4899, #be185d)',
    subApps: [
      { id: 'healthy-kitchen', name: 'Healthy Kitchen & Recipes', path: '/app/health?tab=kitchen', icon: 'fas fa-utensils' },
      { id: 'yoga', name: 'Guided Yoga & Meditation', path: '/app/health?tab=yoga', icon: 'fas fa-spa' },
      { id: 'home-diagnostics', name: 'Home Diagnostics', path: '/app/health?tab=diagnostics', icon: 'fas fa-stethoscope' },
      { id: 'grocery', name: 'Smart Grocery List', path: '/app/grocery', icon: 'fas fa-shopping-basket' },
      { id: 'birthday-cards', name: 'Birthday & Event Cards', path: '/app/birthday-card', icon: 'fas fa-gift' },
      { id: 'weather-app', name: 'Weather Forecast', src: '/weather/weather-dashboard.html', icon: 'fas fa-cloud-sun', type: 'online' },
      { id: 'life-board', name: 'Life Vision Board', src: '/life-board/index.html', icon: 'fas fa-clipboard-user', type: 'hybrid' }
    ]
  },
  {
    id: 'dev-studio-hub',
    name: 'Dev Studio & AI Workspace',
    description: 'Autonomous agentic code developer (Plan, Architect, Structure, Sequence, Verify, Generate), live Mermaid diagrams, and Python data science sandbox.',
    icon: 'fas fa-code',
    category: 'development',
    path: '/app/code-studio',
    type: 'react',
    badge: 'Engineering',
    colorGradient: 'linear-gradient(135deg, #6366f1, #4338ca)',
    subApps: [
      { id: 'code-studio', name: 'Agentic Code Developer', path: '/app/code-studio', icon: 'fas fa-terminal', type: 'react', ai: true },
      { id: 'code-generator', name: 'Legacy Code Generator', src: '/code-generator/code-generator.html', icon: 'fas fa-code', type: 'hybrid', ai: true },
      { id: 'mermaid-editor', name: 'Mermaid Architecture Editor', src: '/mermaid-editor/mermaid-live-editor.html', icon: 'fas fa-diagram-project', type: 'online' },
      { id: 'python-ide', name: 'Data Science Workspace', src: '/python-IDE/index.html', icon: 'fas fa-flask-vial', type: 'offline' },
      { id: 'openfang', name: 'OpenFang AI Agent', src: '/openfang/index.html', icon: 'fas fa-robot', type: 'online', ai: true },
      { id: 'patent-researcher', name: 'Patent Researcher', src: '/patent-researcher/index.html', icon: 'fas fa-lightbulb', type: 'online', ai: true }
    ]
  },
  {
    id: 'system-security-hub',
    name: 'Security, Privacy & Comms Hub',
    description: 'Post-Quantum safe vault, API key management, encrypted VPN tunnel, P2P calling, and private messaging.',
    icon: 'fas fa-shield-halved',
    category: 'system',
    path: '/app/secure-vault',
    type: 'react',
    badge: 'Zero-Trust',
    colorGradient: 'linear-gradient(135deg, #475569, #1e293b)',
    subApps: [
      { id: 'secure-vault', name: 'Secure Password Vault', path: '/app/secure-vault', icon: 'fas fa-vault', type: 'react' },
      { id: 'api-key-manager', name: 'API Key Manager', src: '/api-key-manager/index.html', icon: 'fas fa-key', type: 'hybrid' },
      { id: 'pqc-education', name: 'PQC Quantum Shield', src: '/pqc-education/index.html', icon: 'fas fa-shield-halved', type: 'offline' },
      { id: 'vpn', name: 'Private VPN Tunnel', src: '/vpn/index.html', icon: 'fas fa-shield-virus', type: 'online' },
      { id: 'p2p-calling', name: 'P2P Encrypted Calling', src: '/p2p-calling/index.html', icon: 'fas fa-phone-volume', type: 'online' },
      { id: 'community-board', name: 'Community Apps Board', src: '/community/index.html', icon: 'fas fa-users-viewfinder', type: 'offline' },
      { id: 'social-feed', name: 'Unified Social Feed', src: '/social-feed/index.html', icon: 'fas fa-hashtag', type: 'online' },
      { id: 'news', name: 'News & Media Feed', src: '/news/news.html', icon: 'fas fa-newspaper', type: 'offline' },
      { id: 'music', name: 'Offline Music Player', src: '/music/index.html', icon: 'fas fa-music', type: 'offline' }
    ]
  }
];

// Flat list for global search and backwards compatibility
export const APP_REGISTRY = [
  ...HUB_REGISTRY.map(hub => ({
    id: hub.id,
    name: hub.name,
    path: hub.path,
    src: hub.src,
    icon: hub.icon,
    category: hub.category,
    type: hub.type,
    isHub: true,
    description: hub.description,
    subApps: hub.subApps
  }))
];

/**
 * Returns the correct navigation path for any app or subApp entry.
 */
export function buildAppPath(app) {
  if (app.path) {
    return app.path;
  }
  const src = encodeURIComponent(app.src || '');
  const title = encodeURIComponent(app.name || '');
  return `/app-view?src=${src}&title=${title}`;
}

export const getCustomApps = () => {
  try {
    return JSON.parse(localStorage.getItem('custom_installed_apps')) || [];
  } catch {
    return [];
  }
};
