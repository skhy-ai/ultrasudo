# Intuitive Simple Apps

A curated collection of lightning-fast, highly extensible web applications. 

This project aims to provide flexible, single-purpose apps built strictly on a **"keep it simple" architecture (Vanilla HTML/CSS/JavaScript)**, powered by a remarkably fast **Rust-based multi-threaded backend**.

## 🏗️ Architecture Philosophy

To maximize community involvement and architectural flexibility, the system is separated into two decoupled layers:

1. **The Frontend Layer (Vanilla JS)**: 
   We explicitly avoid complex frameworks (like React, Angular, or Vite) for the individual apps. By using pure Vanilla HTML, CSS, and JS, **anyone** in the community can instantly build and contribute an app without needing to learn complex build chains or state management. It boots instantly and runs incredibly fast natively in the browser.

2. **The Backend Manager Layer (Rust)**:
   The apps are served, and their underlying background Python services are managed, by a highly performant, multi-threaded **Rust application (`system-manager`)**. 
   - **Why Rust?** It eliminates single-threaded bottlenecks. It asynchronously serves static frontend files concurrently while flawlessly proxying outputs from heavy Python processing logic (like the Stock Ticker or Patent Researcher) directly to the user.

## 🚀 Getting Started

The platform is packaged natively as **Skand Browser**, an open-source Chromium wrapper (Electron) that natively bundles the high-performance Rust System Manager and serves the Vanilla JS apps locally.

### 1-Click Installation and Setup
We've built automated installers that will handle downloading the required dependencies (such as the Rust toolchain and Node.js) so you don't have to!

1. **Install and Run the Server:**
   - **Windows:** Double-click `install_windows.bat` first, then run `start_windows.bat`.
   - **Linux/macOS:** Run `chmod +x start_linux.sh && ./start_linux.sh` in the terminal. The script will automatically trigger the Linux installer if dependencies are missing.
   
   *Under the hood, these scripts will install Node.js and Rust, compile the `system-manager` via Cargo, install the Chromium wrappers via `npm install`, and boot the standalone application window via `npm start`.*

### Packaging Skand Browser natively (.exe, .dmg, .AppImage)
If you wish to distribute the standalone app to others (without them needing to use the batch scripts):
```bash
npm run dist
```
*This command uses `electron-builder` to package the Rust backend and HTML code into a single zero-dependency executable in the `dist/` folder.*

## 🌍 The Community Hub (Add-ons)

Because of the Vanilla JS architecture, extending the system is incredibly easy. 

We encourage users to build their own tools! Visit the **[Community Add-Ons Hub](community/)** inside the Skand Browser (or at http://localhost:8000/community) to view, submit, and share custom tools built by the community.

## 📱 Core Apps

| App | Description | Status | How to Access |
|-----|-------------|--------|---------------|
| [API Key Manager](api-key-manager/) | Securely manage your API keys | ✅ Complete | Open `api-key-manager/index.html` |
| [Birthday Card Generator](birthday-card-generator/) | Create custom birthday cards | ✅ Complete | Open `birthday-card-generator/index.html` |
| [Calculator](calculator/) | A simple calculator | ✅ Complete | Open `calculator/index.html` |
| [Calendar](calendar/) | Interactive calendar with event management | ✅ Complete | Open `calendar/index.html` |
| [Code Generator](code-generator/) | Generate code snippets | ✅ Complete | Open `code-generator/index.html` |
| [Data Science Notebook](datascience-notebook/) | Interactive data analysis | ✅ Complete | Open `datascience-notebook/index.html` |
| [Desktop Environment](desktop/) | Web-based WebOS desktop simulation | ✅ Complete | Open `desktop/desktop.html` |
| [Galactic Simulator](galactic-simulator/) | 3D space simulation | ✅ Complete | Open `galactic-simulator/index.html` |
| [Home Diagnostics](home-diagnostics/) | Home maintenance tracker | ✅ Complete | Open `home-diagnostics/index.html` |
| [Investment Board](investment-board/) | Investment tracking and analysis | ✅ Complete | Open `investment-board/index.html` |
| [Kanban Board](kanban-board/) | Project management tool | 🔄 Incomplete | Open `kanban-board/index.html` |
| [Life Board](life-board/) | Personal life management dashboard | ✅ Complete | Open `life-board/index.html` |
| [Markdown Editor](markdown-editor/) | Edit and preview Markdown | ✅ Complete | Open `markdown-editor/index.html` |
| [Mermaid Editor](mermaid-editor/) | Create diagrams with Mermaid | 🔄 Incomplete | Open `mermaid-editor/index.html` |
| [Music Player](music/) | Simple music player | 🔄 Incomplete | Open `music/index.html` |
| [Notebook](notebook/) | Note-taking application | ✅ Complete | Open `notebook/index.html` |
| [Patent Researcher](patent-researcher/) | Research patents | 🔄 Incomplete | Open `patent-researcher/index.html` |
| [Pomodoro Timer](pomodoro-timer/) | Productivity timer | ✅ Complete | Open `pomodoro-timer/index.html` |
| [Portfolio Manager](portfolio-manager/) | Manage investment portfolios | ✅ Complete | Open `portfolio-manager/index.html` |
| [Python IDE](python-IDE/) | Online Python development environment | ✅ Complete | Open `python-IDE/index.html` |
| [Spreadsheet App](spreadsheet-app/) | Excel-like spreadsheet | ✅ Complete | Open `spreadsheet-app/index.html` |
| [Stock Screener](stock-screener/) | Screen stocks | ✅ Complete | Open `stock-screener/index.html` |
| [Stock Ticker](stock-ticker/) | Real-time stock prices | ✅ Complete | Open `stock-ticker/index.html` |
| [Timer](timer/) | Simple timer application | ✅ Complete | Open `timer/index.html` |
| [Todo List](todo-list/) | Manage tasks | ✅ Complete | Open `todo-list/index.html` |
| [Weather App](weather/) | Weather information | 🔄 Incomplete | Open `weather/index.html` |

## ➕ Building a New App or Add-on

Since we use Vanilla JS, building an app is as easy as creating a folder.

1. **Frontend**: Create a new directory in the root folder.
2. Add your pure `index.html`, `style.css`, and `script.js`.
3. **Rust Backend Service (Optional)**: Want to build a high-performance backend? Simply run `cargo init` inside your app folder. As long as the `system-manager` sees a `Cargo.toml` file in your directory, it will automatically compile it via `--release` and launch your native Rust microservice in the background alongside your UI!

## 🤝 Contributing

We welcome all community tools!
1. Fork the repository
2. Build your app using the simple architecture guidelines.
3. Submit a Pull Request tying it into the `community/` hub!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.