import React from 'react';
import { useNavigate } from 'react-router-dom';
import ultrasudoLogo from '../../../assets/ultrasudo-logo.png';
import './AppShell.css';

/**
 * AppShell — Consistent layout wrapper for all native React apps.
 * Provides a header with back button, icon, and title.
 */
export default function AppShell({ title, icon, children, onBack, headerActions, noPadding = false }) {
    const navigate = useNavigate();

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
                {headerActions && <div className="app-shell-header-actions">{headerActions}</div>}
            </header>
            <main className={`app-shell-content ${noPadding ? 'no-padding' : ''}`}>
                {children}
            </main>
        </div>
    );
}
