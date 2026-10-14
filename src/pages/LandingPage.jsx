import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthModal from '../components/AuthModal/AuthModal';
import ThemeSelector from '../components/ThemeSelector/ThemeSelector';
import QuickLaunch from '../components/QuickLaunch/QuickLaunch';
import ultrasudoLogo from '../assets/ultrasudo-logo.png';
import './LandingPage.css';

export default function LandingPage() {
    const navigate = useNavigate();
    const [isAuthOpen, setIsAuthOpen] = useState(false);

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
                    <ThemeSelector />
                    <button className="landing-btn landing-btn-secondary" onClick={() => setIsAuthOpen(true)}>
                        <i className="fas fa-user-plus"></i> Sign In / Sign Up
                    </button>
                    <button className="landing-btn landing-btn-primary" onClick={() => navigate('/desktop')}>
                        Web Desktop
                    </button>
                </div>
            </nav>

            <main className="landing-main">
                <section className="landing-hero">
                    <h1>Your personal, secure OS environment.</h1>
                    <p>
                        Ultrasudo isn't just a workspace. It's a fully encapsulated desktop suite with built-in Post-Quantum
                        Cryptography, peer-to-peer sync, and native business suites ranging from ESG carbon accounting to Agentic Code Studios.
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

                {/* Instant Quick Launch Section */}
                <section className="landing-quick-launch-wrap">
                    <QuickLaunch
                        title="Instant Quick Launch"
                        subtitle="Jump directly into your pinned applications and SME hubs"
                    />
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
                            <div className="landing-feature-icon"><i className="fas fa-leaf"></i></div>
                            <h3>ESG & Sustainability</h3>
                            <p>Scope 1 and Scope 2 GHG protocol emissions inventory, upstream Scope 3 scorecard, and solar CapEx payback models.</p>
                        </div>

                        <div className="landing-feature-card">
                            <div className="landing-feature-icon"><i className="fas fa-briefcase"></i></div>
                            <h3>13-Week Cash Runway</h3>
                            <p>Direct liquidity forecasting, Smart Invoicing with DSO aging, and Wilson EOQ landed cost logistics built for SMEs.</p>
                        </div>

                        <div className="landing-feature-card">
                            <div className="landing-feature-icon"><i className="fas fa-code"></i></div>
                            <h3>Agentic Code Studio</h3>
                            <p>An AI developer that plans, architects, generates project structures and sequence diagrams, awaiting user verification before writing code.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <p>&copy; 2026 Ultrasudo. Open-source and privacy-first.</p>
            </footer>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onAuthSuccess={() => navigate('/desktop')}
            />
        </div>
    );
}
