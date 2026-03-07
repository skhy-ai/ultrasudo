# Skand Browser — React Architecture Overview

## Project Summary

Skand Browser is a mission-critical desktop environment featuring a custom browser UI and a full suite of local productivity and lifestyle applications. The frontend is a **React 19 Single Page Application (SPA)** built with Vite, communicating with a **Rust backend** (`system-manager`) for Post-Quantum Cryptography (PQC) and localized file operations.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 19 + React Router DOM v7 |
| **Build Tool** | Vite (Premium Obfuscation Pipeline) |
| **Security** | **Kyber-1024 (PQC)** + AES-256-GCM |
| **Backend Orchestrator** | Rust `system-manager` (Axum + Tokio) |
| **Desktop Shell** | Electron 29 / Tauri v2 |
| **State Management** | Zustand (`useBrowserStore`, `useSystemStore`) |

---

## Project Structure

```
d:/skand-browser/
├── system-manager/                    # Rust backend (Orchestrator & PQC Provider)
│   ├── src/
│   │   ├── main.rs                   # Axum API routes, service discovery
│   │   └── pqc_helper.rs             # Kyber-1024 KEM + AES-GCM logic
│   └── data.json                     # Encrypted local data store
│
├── src/                               # React frontend source
│   ├── main.jsx                      # App entry point
│   ├── App.jsx                       # Router (SPA navigation)
│   ├── pages/
│   │   ├── WizardPage.jsx            # Setup & theme configuration
│   │   ├── DesktopPage.jsx           # Premium app grid launcher
│   │   ├── BrowserPage.jsx           # Multi-tab web browser
│   │   └── Apps/                     # 14 Native React Applications
│   │       ├── SecureVault/          # ✅ PQC-secured credential manager
│   │       ├── Spreadsheet/          # ✅ Native Grid + Formula Engine
│   │       ├── HealthyKitchen/       # ✅ Recipe & Nutrition Dashboard
│   │       └── ...                   # (Calculator, Notebook, Kanban, etc.)
│   │
│   ├── components/
│   │   ├── shared/                   # AppShell, SplitPane, Modal wrappers
│   │   └── AppIframe/                # Legacy/Online app container
│   │
│   ├── store/                        # Zustand global state (IPC integrated)
│   └── utils/                        # appRegistry.js (Central routing logic)
│
├── electron/                         # Electron main process & IPC handlers
├── src-tauri/                         # Tauri configuration & Rust bridge
└── vite.config.js                    # Vite pipeline + JavaScript Obfuscator
```

---

## Security Architecture (PQC)

Skand Browser implements **Post-Quantum Cryptography** to ensure that data encrypted today remains secure against future quantum computation threats.

1.  **Key Exchange**: Uses **Kyber-1024** (NIST Category 5) for secure shared secret generation.
2.  **Encryption**: Derived shared secrets key an **AES-256-GCM** authenticated encryption pipeline.
3.  **Secure Vault**: A native React application (`SecureVault.jsx`) providing a premium UI for managing credentials encrypted at rest.
4.  **Backend Proxy**: All cryptographic operations are offloaded to the `system-manager` Rust binary to keep keys out of the JavaScript memory space.

---

## Routing & App Integration

All navigation is managed by `react-router-dom`. The `appRegistry.js` utility serves as the single source of truth for app metadata.

| App Type | Handling Mechanism |
|---|---|
| `react` | Managed components mounted directly into the SPA router. |
| `offline` | Local `.html` legacy apps loaded via `AppIframe`. |
| `online` | External web apps secured within the `AppIframe` sandbox. |

---

## Build & Distribution

The project supports dual-target builds (Electron/Tauri) using a shared `dist/` folder produced by Vite.

```bash
# 1. Build the PQC Backend
cd system-manager && cargo build --release

# 2. Build the Frontend
npm run build:frontend

# 3. Package for Desktop
npm run electron:win   # (Electron)
npm run tauri:build    # (Tauri)
```

> ℹ️ Post-Quantum security features require the `system-manager` binary to be running.
