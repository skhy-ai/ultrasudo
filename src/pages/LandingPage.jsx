import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ultrasudoLogo from '../assets/ultrasudo-logo.png';
import './LandingPage.css';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-page-wrapper">
            <nav className="landing-nav">
                <Link to="/" className="landing-logo">
                    <img src={ultrasudoLogo} alt="UltraSudo Logo" className="landing-logo-img" />
                    UltraSudo
                </Link>
                <div className="landing-nav-links">
                    <a href="#features">Features</a>
                    <a href="https://github.com/ultrasudo" target="_blank" rel="noopener noreferrer">GitHub</a>
                    <button className="landing-btn landing-btn-secondary" onClick={() => navigate('/desktop')}>
                        Web Desktop
                    </button>
                </div>
            </nav>

            <main className="landing-main">
                <section className="landing-hero">
                    <h1>Your personal, secure OS environment.</h1>
                    <p>
                        Ultrasudo isn't just a workspace. It's a fully encapsulated desktop suite with built-in Post-Quantum
                        Cryptography, peer-to-peer sync, and native apps ranging from Python IDEs to secure wallets.
                    </p>

                    <div className="landing-cta-buttons">
                        <button className="landing-btn landing-btn-primary" onClick={() => navigate('/desktop')}>
                            <i className="fas fa-desktop"></i> Launch Web OS
                        </button>
                        <button className="landing-btn landing-btn-outline" onClick={() => navigate('/desktop')}>
                            <i className="fas fa-globe"></i> Open Web Version
                        </button>
                    </div>
                </section>

                <section id="features" className="landing-features">
                    <h2 className="landing-section-title">Everything you need, built-in.</h2>
                    <div className="landing-grid">
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon"><i className="fas fa-shield-halved"></i></div>
                            <h3>Post-Quantum Security</h3>
                            <p>Protect your data against future threats. Ultrasudo utilizes experimental Kyber KEM logic combined with AES-256 for impenetrable cloud syncs.</p>
                        </div>

                        <div className="landing-feature-card">
                            <div className="landing-feature-icon"><i className="fas fa-paper-plane"></i></div>
                            <h3>Native P2P Transfers</h3>
                            <p>Send and receive funds securely with other users directly within your browser desktop without relying on bulky third-party gateways.</p>
                        </div>

                        <div className="landing-feature-card">
                            <div className="landing-feature-icon"><i className="fas fa-cloud-arrow-up"></i></div>
                            <h3>Cross-Device Sync</h3>
                            <p>Your notes, Kanban tasks, and code snippets automatically sync across your Mac, Windows, and Web clients in real-time via Supabase.</p>
                        </div>

                        <div className="landing-feature-card">
                            <div className="landing-feature-icon"><i className="fas fa-code"></i></div>
                            <h3>Developer First</h3>
                            <p>A native Python IDE powered by Pyodide, an AI Code Generator, and centralized API Key management built right into the core OS.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <p>&copy; 2026 Ultrasudo. Open-source and privacy-first.</p>
            </footer>
        </div>
    );
}
