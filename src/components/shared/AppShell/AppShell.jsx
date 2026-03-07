import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AppShell.css';

/**
 * AppShell — Consistent layout wrapper for all native React apps.
 * Provides a header with back button, icon, and title.
 */
export default function AppShell({ title, icon, children, onBack }) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) onBack();
        else navigate('/desktop');
    };

    return (
        <div className="app-shell">
            <header className="app-shell-header">
                <button className="back-btn" onClick={handleBack} title="Back to Desktop">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div className="app-title-group">
                    {icon && <i className={`${icon} app-icon`}></i>}
                    <h1 className="app-title">{title}</h1>
                </div>
                <div className="header-spacer"></div>
            </header>
            <main className="app-shell-content">
                {children}
            </main>
        </div>
    );
}
