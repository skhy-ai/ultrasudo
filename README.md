# Skand Browser: Secure & Private Workspace ✅

A high-performance, secure, and purely private desktop environment. Built with **React 19**, **Rust**, **Electron**, and **Tauri**, featuring Post-Quantum Cryptography (PQC) local encryption natively bundled.

---

## 🚀 Key Features

*   **Post-Quantum Security**: All sensitive data is protected via **Kyber-1024** (KEM) and **AES-256-GCM**.
*   **Dual Runtime Support**: Runs on both **Electron** (for rapid development) and **Tauri** (for lightweight distribution).
*   **14 Native React Apps**: High-performance, sandboxed local applications integrated directly into a personalized dashboard.
*   **Zero-Tracking Feeds**: Privacy-shielded news and video streams entirely stripped of corporate analytics.
*   **Premium Glassmorphism**: Stunning, reactive UI with smooth micro-animations and deep dark mode support.

---

## 📦 Consolidated Native Application Hubs

Ultrasudo Browser consolidates fragmented legacy applications into unified, state-of-the-art native React Application Hubs:

- **Finance Hub** (`/app/finance`): Unified suite combining Stock Ticker, Stock Screener, Investment Board, Portfolio Manager, P2P Money Transfers, and Multi-Currency Converter into 4 interactive tabs.
- **Productivity Hub** (`/app/productivity`): Unified focus workspace combining Pomodoro sessions, Stopwatch timers, Gamified To-Do List, and 4-column sync Kanban Board into 3 interactive tabs.
- **Health & Wellness Hub** (`/app/health`): Mindful health suite combining low-GI Recipe Kitchen, Surya Namaskar Yoga workouts, Pranayama box breathing, BMI calculators, and Hydration trackers into 3 interactive tabs.
- **Secure Vault**: Quantum-resistant credential and secret management.
- **Spreadsheets**: Advanced grid with formula engine and Chart.js integration.
- **...plus**: Calculator, Notebook, Markdown Editor, and more!

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

For a deep dive into the inner compilation processes, please refer to the detailed breakdown in [architecture.md](file:///c:/Projects/ultrasudo/architecture.md) and the [BUILD.md](file:///c:/Projects/ultrasudo/BUILD.md).
