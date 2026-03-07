import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_REGISTRY, buildAppPath } from '../utils/appRegistry';
import { useSystemStore } from '../store/useSystemStore';
import './DesktopPage.css';

export default function DesktopPage() {
    const navigate = useNavigate();
    const { setupComplete, enabledApps, theme, loadFromStorage } = useSystemStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadFromStorage();
    }, []);

    useEffect(() => {
        if (!setupComplete) navigate('/wizard');
    }, [setupComplete, navigate]);

    // ... (theme useEffect remains unchanged)

    const handleAppClick = (app) => {
        const appPath = buildAppPath(app);
        navigate(appPath);
    };

    const displayApps = APP_REGISTRY.filter(app => {
        // Core system apps always visible
        if (app.id === 'desktop' || app.id === 'web-browser') return app.id !== 'desktop'; 
        
        // Other apps must be enabled
        if (!enabledApps.includes(app.id)) return false;
        
        // Filter by search query
        if (searchQuery && !app.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        
        return true;
    });

    return (
        <div className="desktop-container">
            <header className="desktop-header">
                <div className="search-bar-container">
                    <i className="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        id="search-bar" 
                        placeholder="Search apps, web, or offline data... (Cmd+Space)" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <div className="main-content">
                <div className="left-panel">
                    <div className="panel apps-panel" style={{flex: 1, backgroundColor: 'transparent', border: 'none'}}>
                        <div className="app-grid" id="app-grid">
                            {displayApps.map(app => (
                                <a key={app.id} href="#" className="app-icon" onClick={(e) => { e.preventDefault(); handleAppClick(app); }}>
                                    <i className={app.icon}></i>
                                    <span>{app.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="right-panel">
                    <div className="panel widget-panel">
                        <div className="widget-header">
                            <h3><i className="fas fa-cubes"></i> Widgets</h3>
                            <button id="add-widget-btn"><i className="fas fa-plus"></i> Add</button>
                        </div>
                        <div className="widget-area" id="widget-area">
                            <div className="empty-state">React migration: Widget engine mapping in progress...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
