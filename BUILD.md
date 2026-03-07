# Skand Browser — Build Guide

Skand Browser supports **two independent runtime targets** — Electron and Tauri — sharing the same React frontend `src/`. Both targets depend on the Rust-based `system-manager` for security features.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build the PQC backend (system-manager)
cd system-manager && cargo build --release && cd ..

# 3. Build the React frontend
npm run build:frontend

# 4. Test with Electron
npm start
```

---

## 🔐 Security Component (system-manager)

The `system-manager` is a standalone Rust binary that provides Post-Quantum Cryptography (PQC) and service discovery.

**You must build the release version of system-manager before packaging Electron or Tauri:**
```bash
cd system-manager
cargo build --release
```
The resulting binary (`system-manager.exe` or `system-manager`) is automatically bundled into Electron's `extraResources` or Tauri's binary path.

---

## Electron Build

### Development (with DevTools)
```bash
npm run electron:dev
```
> **Note**: Requires the Vite dev server to be running (`npm run dev`) or a fresh `dist/` folder.

### Production Test
```bash
npm run electron:test
# OR
npm start
```

### Packaging for Distribution
| Target | Command |
|---|---|
| Windows `.exe` | `npm run electron:win` |
| Linux AppImage | `npm run electron:linux` |
| Fast Check | `npm run electron:pack` |

---

## Tauri Build

Tauri provides the smallest binary footprint and strongest IP protection for the core browser shell.

### Development
```bash
npm run tauri:dev
```

### Production Build
```bash
npm run tauri:build       # Current platform
npm run tauri:build:win   # Windows MSI
npm run tauri:build:linux # Linux AppImage
```

---

## Troubleshooting

- **"Request Autofill.enable failed"**: Normal Electron console warning during dev; can be ignored.
- **"Connection Refused" (Electron)**: Ensure the Vite dev server is running or you have run `npm run build:frontend`.
- **Vault not working**: Ensure `system-manager` is built and located in `system-manager/target/release`.
```
