# Skand Browser - Design Principles

Inspired by modern, sleek browsers like Comet and Firefox, Skand Browser focuses on creating a seamless, focused, and powerful user experience. This document outlines the core aesthetic and functional design principles that drive the platform.

## 1. Aesthetic Vision: The Glass Canvas
*   **Translucency & Frosting:** Strategic use of blurred backgrounds (backdrop-filter) and semi-transparent panes to create depth without clutter. The UI should feel like glass layered over the content.
*   **Dynamic Dark Mode:** A deep, rich dark mode (`#0f172a` slates and deep blues) that reduces eye strain while allowing vivid accent colors to pop.
*   **Rounded Geometry:** Softened corners on windows, buttons, and modals to create a friendly and approachable feel.
*   **Micro-interactions:** Subtle, performant CSS animations (0.2s transitions) for hovers, clicks, and state changes to make the interface feel alive and responsive.

## 2. Navigational Hierarchy
*   **The Global Sidebar:** A powerful, collapsible sidebar that houses core apps, settings, and tools off-canvas. 
*   **Minimalist Top Bar:** The address bar is centered, with back/forward controls on the left and core extensions/settings on the right. 
*   **React Unified Shell**: The entire browser UI is a unified React application, ensuring instant transitions and a "thick-client" feel.

## 3. The Desktop Paradigm
*   **App-Centric Experience:** Skand is an OS-like environment. The "New Tab" page acts as a full Desktop launcher.
*   **Post-Quantum Sandbox**: Sensitive components (like the Secure Vault) are protected by PQC and isolated from general web traffic.
*   **App Store Approach**: Users explicitly opt into tools via the First-Run Wizard, preventing bloat.

## 4. Privacy & Control By Default
*   **Post-Quantum Encryption**: Automated PQC local data protection for all user information.
*   **Zero-Tracking Feeds**: RSS and video streams are proxied and stripped of all metadata for maximum privacy.
*   **Accessible Settings**: Privacy controls are max 2 clicks away from the main view.

## 5. Performance & Resource Restraint
*   **Dual Runtime Efficiency**: Supports both **Electron** (for feature richness) and **Tauri** (for minimal footprints).
*   **Offline First**: 14+ native React apps (Calculator, Spreadsheet, etc.) function entirely offline with no network dependencies.
*   **Smart Rendering**: Optimized DOM structures and CSS variables ensure the browser footprint stays light.
