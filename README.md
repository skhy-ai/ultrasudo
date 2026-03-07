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

## 📦 Bundled Native Applications (14+)

Skand Browser includes 14 fully-migrated native React applications:

- **Secure Vault**: Quantum-resistant credential and secret management.
- **Spreadsheets**: Advanced grid with formula engine and Chart.js integration.
- **Healthy Kitchen**: Recipe browser and nutrition tracker.
- **...plus**: Calculator, To-Do List, Notebook, Pomodoro, Kanban, Markdown Editor, and more!

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

For a deep dive into the inner compilation processes, please refer to the detailed breakdown in [architecture.md](file:///d:/skand-browser/architecture.md) and the [Build Guide](file:///d:/skand-browser/BUILD.md).
