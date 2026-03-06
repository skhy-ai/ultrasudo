# Skand Browser

A high-performance, secure, and purely private Web3-ready desktop environment. Built with Tauri and Rust, featuring peer-to-peer data transfers, decentralized cloud sync, and aggressive Post-Quantum Cryptography (PQC) local encryption capabilities natively bundled.

---

## 🚀 Key Features

* **Data-First Encryption:** All data persisted to local disk utilizes asynchronous `crypto.subtle` AES-GCM methodologies (`PQC:v1:` padding) out of the box. Absolutely nothing is saved to your hard drive in plaintext.
* **Tauri/Rust Powerhouse:** Bypasses bloated Electron/Chromium engines by hooking directly into your Operating System's native Webview (WebKit / WebView2), making installer sizes significantly smaller and reducing RAM consumption to nearly zero on idle.
* **Component-Based Workspace:** Native, sandboxed local applications integrated directly into a personalized 4-column desktop dashboard.
* **Zero-Tracking Feeds:** Leverages privacy-friendly alternatives like `RSS2JSON` APIs and `Invidious` (YouTube frontend proxy) hooks to stream news and videos entirely stripped of corporate analytics or fingerprint trackers.

---

## 📦 Bundled Applications

Skand Browser behaves as an entire Desktop OS environment. Essential capabilities bundled inside the executable include:

- **Unified Control Dashboard:** 4 vertical columns managing your apps, global news, favorite websites, and privacy-shielded videos simultaneously.
- **Notebook:** Professional Docx-style word processor generating true-PDF outputs without web-styling curved margins.
- **Spreadsheets:** A Microsoft Excel alternative featuring formula rendering, Chart.js injections, and dynamic pivot tables tracking state with `data-manager.js`.
- **Kanban Board:** Workflow management tool syncing instantaneously.
- **Data Science IDE:** A complete Python/Pyodide programming interface running natively offline inside the browser limits.
- **...and 20+ more:** Calculators, Stock Tickers, Calendars, Investment Planners, and System Monitors individually tracked by the dynamic `app-classifier.js`.

---

## 🛠️ Build Engine & Architecture

For a deep dive into the inner compilation processes and why 450+ Rust Crates are utilized during linking, please refer to the detailed breakdown in `architecture.md`.

### Windows Quick-Start Automated Installer

A single batch script has been provided to autonomously bootstrap and compile everything safely without any CLI commands required.

1. **Close any open terminals.**
2. **Execute the automation script:**
   ```bash
   .\install_windows.bat
   ```
This script sequentially:
* Installs Rust/Cargo if omitted.
* Unobtrusively fetches and configures the Microsoft C++ Linker APIs (Required for Webview2).
* Executes `npm run build:frontend` (Which invokes the custom `build_frontend.js` Terser minification script)
* Finalizes by compiling the native `.exe` binary.

### Manual Developer Testing (Cross-Platform)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Frontend Minification Bundle:**
   ```bash
   npm run build:frontend
   ```

3. **Launch in Dev-Mode:**
   ```bash
   npm run tauri:dev
   ```

4. **Compile Distribution Release:**
   ```bash
   npm run tauri:build
   ```
