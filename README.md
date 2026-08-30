# Ultrasudo: Secure & Private Workspace ✅

A high-performance, secure, and purely private desktop environment. Built with **React 19**, **Rust**, **Electron**, and **Tauri**, featuring Post-Quantum Cryptography (PQC) local encryption natively bundled.

---

## 🚀 Key Features

*   **Post-Quantum Security**: All sensitive data is protected via **Kyber-1024** (KEM) and **AES-256-GCM**.
*   **Dual Runtime Support**: Runs on both **Electron** (for rapid development) and **Tauri** (for lightweight distribution).
*   **Native & Consolidated Hubs**: High-performance, sandboxed local React applications combined into unified suites.
*   **Clean Data Architecture**: Strict separation of static application datasets (`src/data/`) and UI components.
*   **Zero-Tracking Feeds**: Privacy-shielded news and video streams entirely stripped of corporate analytics.
*   **Premium Glassmorphism**: Dynamic dark mode interface with micro-animations.

---

## 📦 Consolidated Native Application Hubs

Ultrasudo Browser consolidates fragmented legacy applications into unified, state-of-the-art native React Application Hubs:

- **Finance Hub** (`/app/finance`): Unified suite combining Stock Ticker, Stock Screener, Investment Board, Portfolio Manager, P2P Money Transfers, and Multi-Currency Converter into 4 interactive tabs.
- **Productivity Hub** (`/app/productivity`): Unified focus workspace combining Pomodoro sessions, Stopwatch timers, Gamified To-Do List, and 4-column sync Kanban Board into 3 interactive tabs.
- **Health & Wellness Hub** (`/app/health`): Mindful health suite combining low-GI Recipe Kitchen (25 recipes), Surya Namaskar Yoga workouts, AI Health Diagnostics (31 OTC Meds), BMI calculators, and Hydration trackers.
- **Secure Vault**: Quantum-resistant credential and secret management.
- **Spreadsheets**: Advanced grid with formula engine and Chart.js integration.
- **...plus**: Calculator, AI Notebook, Smart Grocery, Markdown Editor, and more!

---

## 🗺️ Registered Applications & Legacy HTML Directory

Below is the complete inventory of all registered applications in `APP_REGISTRY` ([appRegistry.js](file:///c:/Projects/ultrasudo/src/utils/appRegistry.js)), detailing whether they run as **Native React** components or as **Legacy Offline / Hybrid HTML** applications:

| App ID | Name | Category | Integration Type | Route / Source Path | Data Layer Location | Migration Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `finance-hub` | Finance Hub | Finance | `Native React` | `/app/finance` | `src/data/financeData.js` & `useFinanceStore` | Consolidated Suite |
| `stock-ticker` | Stock Ticker | Finance | `Native React` | `/app/finance?tab=markets` | `src/data/financeData.js` | Migrated |
| `portfolio-manager` | Portfolio Manager | Finance | `Native React` | `/app/finance?tab=portfolio` | `useFinanceStore` | Migrated |
| `send-money` | Send Money | Finance | `Native React` | `/app/finance?tab=payments` | `useFinanceStore` | Migrated |
| `currency-converter`| Currency Converter| Finance | `Native React` | `/app/finance?tab=payments` | `src/data/financeData.js` | Migrated |
| `productivity-hub` | Productivity Hub | Productivity | `Native React` | `/app/productivity` | `src/data/productivityData.js` | Consolidated Suite |
| `todo-list` | To-Do List | Productivity | `Native React` | `/app/productivity?tab=tasks` | `useLocalStore` | Migrated |
| `kanban-board` | Kanban Board | Productivity | `Native React` | `/app/productivity?tab=kanban` | `src/data/productivityData.js` | Migrated |
| `pomodoro-timer` | Pomodoro Timer | Productivity | `Native React` | `/app/productivity?tab=timers` | `src/data/productivityData.js` | Migrated |
| `timer` | Timer | Productivity | `Native React` | `/app/productivity?tab=timers` | `src/data/productivityData.js` | Migrated |
| `health-hub` | Health & Wellness | Lifestyle | `Native React` | `/app/health` | `src/data/recipes.js` & `otcMedications.js` | Consolidated Suite |
| `Healthy-kitchen` | Healthy Kitchen | Lifestyle | `Native React` | `/app/health?tab=kitchen` | `src/data/recipes.js` | Migrated (25 recipes) |
| `yoga` | Yoga & Wellness | Lifestyle | `Native React` | `/app/health?tab=yoga` | Local Storage | Migrated |
| `home-diagnostics` | AI Home Diagnostics | Lifestyle | `Native React` | `/app/health?tab=diagnostics` | `src/data/otcMedications.js` | Migrated (31 OTC Meds) |
| `notebook` | AI Notebook | Productivity | `Native React` | `/app/notebook` | `useLocalStore` | Multi-Model AI |
| `calculator` | Calculator | Utility | `Native React` | `/app/calculator` | Component State | Native |
| `markdown-editor` | Markdown Editor | Productivity | `Native React` | `/app/markdown-editor` | `useLocalStore` | Native |
| `spreadsheet-app` | Spreadsheets | Productivity | `Native React` | `/app/spreadsheet` | `useLocalStore` | Native |
| `grocery` | Smart Grocery | Productivity | `Native React` | `/app/grocery` | `src/data/groceryData.js` | Country-Aware |
| `secure-vault` | Secure Vault | Security | `Native React` | `/app/secure-vault` | Local PQC Rust Engine | Native PQC |
| `birthday-card-generator`| Birthday Cards | Lifestyle | `Native React` | `/app/birthday-card` | Component Templates | Native |
| `quote-and-catalog-generator`| Quote & Catalog | Productivity | `Native React` | `/app/quote-generator` | Component State | Native |
| `desktop` | Workspace Desktop | System | `Native React` | `/desktop` | `appRegistry.js` | Core System |
| `community-board` | Community Apps | System | `Legacy Offline` | `/community/index.html` | `/community/` static HTML | Legacy Iframe |
| `p2p-calling` | P2P Calling | System | `Legacy Online` | `/p2p-calling/index.html` | WebRTC / PeerJS | Legacy Iframe |
| `api-key-manager` | API Key Manager | System | `Legacy Hybrid` | `/api-key-manager/index.html` | Local Encrypted Storage | Legacy Iframe |
| `pqc-education` | PQC Explorer | System | `Legacy Offline` | `/pqc-education/index.html` | `/pqc-education/` algorithm demos | Legacy Iframe |
| `vpn` | VPN Service | System | `Legacy Online` | `/vpn/index.html` | `useVpnStore.js` & Proxy Engine | Global Synced |
| `openfang` | OpenFang AI | System | `Legacy Online` | `/openfang/index.html` | Local AI Gateway | Legacy Iframe |
| `patent-researcher`| Patent Researcher | Productivity | `Legacy Online` | `/patent-researcher/index.html` | External API | Legacy Iframe |
| `calendar` | Calendar | Productivity | `Legacy Offline` | `/calendar/index.html` | Local ICS / Storage | Legacy Iframe |
| `calendar-sync` | Calendar Sync | Productivity | `Legacy Online` | `/calendar/calendar_sync.html` | CalDAV / WebDAV | Legacy Iframe |
| `life-board` | Life Board | Lifestyle | `Legacy Hybrid` | `/life-board/index.html` | `state-data.js` | Ported to React Apps |
| `code-generator` | Code Generator | Development | `Legacy Hybrid` | `/code-generator/code-generator.html` | Snippets Engine | Legacy Iframe |
| `mermaid-editor` | Mermaid Live Editor | Development | `Legacy Online` | `/mermaid-editor/mermaid-live-editor.html` | Mermaid.js engine | Legacy Iframe |
| `python-ide` | Data Science Workspace | Development | `Legacy Offline` | `/python-IDE/index.html` | Pyodide / WASM | Legacy Iframe |
| `news` | News Feed | Entertainment | `Legacy Offline` | `/news/news.html` | Zero-Tracker RSS | Legacy Iframe |
| `music` | Music Player | Entertainment | `Legacy Offline` | `/music/index.html` | Audio Assets | Legacy Iframe |
| `weather` | Weather App | Lifestyle | `Legacy Online` | `/weather/weather-dashboard.html` | OpenWeather API | Legacy Iframe |
| `social-feed` | Unified Social Feed| Lifestyle | `Legacy Online` | `/social-feed/index.html` | RSS / Mastodon API | Legacy Iframe |

---

## 📁 Centralized Data Layer (`src/data/`)

Ultrasudo maintains strict separation between view components and static application data:

- **`src/data/recipes.js`**: 25 multi-cuisine recipes with full ingredients, steps, and dietary tags (`vegan`, `low-gi`, `gluten-free`, `high-protein`, `keto`).
- **`src/data/otcMedications.js`**: 31 clinical OTC medications with brand names, uses, side effects, contraindications, and meal timings.
- **`src/data/groceryData.js`**: Glycemic index food ratings and country-aware delivery provider registries (US, UK, IN, DE, AU, CA).
- **`src/data/financeData.js`**: Default market ticker watchlists and currency conversion rates.
- **`src/data/productivityData.js`**: Kanban column presets, task templates, and pomodoro timer presets.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+)
- Rust & Cargo (Required for PQC features)

### One-Click Setup (Windows)
Run the automated installer to bootstrap the environment:
```powershell
.\install_windows.bat
```

### Manual Build
```bash
# 1. Build PQC engine
cd system-manager && cargo build --release && cd ..

# 2. Build Frontend
npm run build:frontend

# 3. Launch Electron
npm start
```

For a deep dive into the inner compilation processes, please refer to the detailed breakdown in [architecture.md](file:///c:/Projects/ultrasudo/architecture.md) and [BUILD.md](file:///c:/Projects/ultrasudo/BUILD.md).
