import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ultrasudoLogo from '../../../assets/ultrasudo-logo.png';
import CopilotDrawer from '../CopilotDrawer/CopilotDrawer';
import ThemeSelector from '../../ThemeSelector/ThemeSelector';
import './AppShell.css';

/**
 * AppShell — Consistent layout wrapper for all native React apps.
 * Provides a header with back button, icon, title, and integrated AI Copilot.
 */
export default function AppShell({ title, icon, children, onBack, headerActions, noPadding = false }) {
    const navigate = useNavigate();
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);

    useEffect(() => {
        const handleOpenCopilot = () => setIsCopilotOpen(true);
        window.addEventListener('ultrasudo:open-copilot', handleOpenCopilot);
        return () => window.removeEventListener('ultrasudo:open-copilot', handleOpenCopilot);
    }, []);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const handleHome = () => {
        navigate('/desktop');
    };

    return (
        <div className="app-shell">
            <header className="app-shell-header">
                <div className="nav-controls-group">
                    <button className="nav-ctrl-btn back-btn" onClick={handleBack} title="Go Back">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <button className="nav-ctrl-btn home-btn" onClick={handleHome} title="Go to Home">
                        <i className="fas fa-house"></i>
                    </button>
                </div>
                <div className="app-title-group">
                    <img src={ultrasudoLogo} alt="UltraSudo Logo" className="app-logo-img" onClick={handleHome} title="UltraSudo Home" />
                    {icon && <i className={`${icon} app-icon`}></i>}
                    <h1 className="app-title">{title}</h1>
                </div>
                <div className="header-spacer"></div>
                <div className="app-shell-header-actions">
                    <ThemeSelector />
                    <button
                        className="nav-copilot-btn"
                        onClick={() => setIsCopilotOpen((v) => !v)}
                        title="Toggle UltraSudo Copilot (Ctrl+K)"
                    >
                        <i className="fas fa-sparkles"></i>
                        <span>Ask AI</span>
                        <span className="copilot-kbd">Ctrl+K</span>
                    </button>
                    {headerActions}
                </div>
            </header>
            <main className={`app-shell-content ${noPadding ? 'no-padding' : ''}`}>
                {children}
            </main>

            {/* Global Copilot Drawer */}
            <CopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
        </div>
    );
}
