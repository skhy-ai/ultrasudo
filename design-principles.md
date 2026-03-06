# Skand Browser - Design Principles

Inspired by modern, sleek browsers like Comet and Firefox, Skand Browser focuses on creating a seamless, focused, and powerful user experience. This document outlines the core aesthetic and functional design principles that drive the platform.

## 1. Aesthetic Vision: The Glass Canvas
*   **Translucency & Frosting:** Strategic use of blurred backgrounds (backdrop-filter) and semi-transparent panes to create depth without clutter. The UI should feel like glass layered over the content, putting the web first.
*   **Dynamic Dark Mode:** A deep, rich dark mode (`#0f172a` slates and deep blues) that reduces eye strain while allowing vivid accent colors to pop.
*   **Rounded Geometry:** Softened corners (e.g., 8px to 16px radii) on windows, buttons, and modals to create a friendly and approachable feel.
*   **Micro-interactions:** Subtle, performant CSS animations (0.2s transitions) for hovers, clicks, and state changes to make the interface feel alive and responsive.

## 2. Navigational Hierarchy
*   **The Global Sidebar:** A powerful, collapsible sidebar that houses core apps, settings, and tools off-canvas. It slides smoothly alongside the webview, ensuring the main browsing area remains unobstructed.
*   **Minimalist Top Bar:** The address bar is centered, with back/forward controls on the left and core extensions/settings on the right. It should take up minimal vertical space.
*   **Tab Management:** Tabs should visually separate active vs. inactive states clearly through contrast and subtle glowing underlines, similar to Firefox's Proton redesign.

## 3. The Desktop Paradigm
*   **App-Centric Experience:** Skand is not just a browser; it's an OS-like environment. The "New Tab" page acts as a full Desktop.
*   **Modular Architecture:** Each feature (Kanban, P2P Calling, Social Feed) is treated as a standalone application that can be snapped into view, completely isolated from web traffic for security.
*   **App Store Approach:** Users explicitly opt into tools via the First-Run Wizard or the App Store, preventing bloat. If a user doesn't need the Timer, it doesn't load.

## 4. Privacy & Control By Default
*   **Prominent Security Indicators:** Clear, understandable lock icons in the address bar communicating HTTPS, Local, and potentially insecure connections.
*   **WOT (Web of Trust) Integration:** Visual cues and active blocking for known tracking or malicious domains.
*   **Accessible Settings:** Privacy controls (tracker blocking, data clearing) should be max 2 clicks away from the main view, hosted intuitively in the sidebar.

## 5. Performance & Resource Restraint
*   **Zero-Overhead Idle:** Apps and tabs that are not focused must not consume unnecessary resources.
*   **Offline First:** Mini-apps (like the Calculator, Diagram Editor, and Kanban) are built to function entirely offline, saving network requests and speeding up load times.
*   **Smart Rendering:** The use of native Tauri windows combined with lightweight DOM structures ensures the browser footprint remains comparable to or smaller than traditional Chromium shells.
