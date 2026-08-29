import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_REGISTRY, buildAppPath } from '../utils/appRegistry';
import { useSystemStore } from '../store/useSystemStore';
import './DesktopPage.css';

export default function DesktopPage() {
    const navigate = useNavigate();
    const { setupComplete, enabledApps, loadFromStorage } = useSystemStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    useEffect(() => {
        if (setupComplete === false) navigate('/wizard');
    }, [setupComplete, navigate]);

    const handleAppClick = (app) => {
        const appPath = buildAppPath(app);
        navigate(appPath);
    };

    const categories = [
        { id: 'all',          name: 'All Apps',          icon: 'fas fa-th-large' },
        { id: 'productivity', name: 'Productivity',     icon: 'fas fa-briefcase' },
        { id: 'development',  name: 'Development',      icon: 'fas fa-code' },
        { id: 'finance',      name: 'Finance',          icon: 'fas fa-chart-line' },
        { id: 'lifestyle',    name: 'Health & Life',    icon: 'fas fa-heart-pulse' },
        { id: 'entertainment',name: 'Media & Tools',    icon: 'fas fa-icons' },
        { id: 'system',       name: 'System Utilities', icon: 'fas fa-shield-halved' }
    ];

    const displayApps = APP_REGISTRY.filter(app => {
        // Exclude desktop itself from list
        if (app.id === 'desktop') return false;
        
        // Filter enabled apps if setup complete
        if (enabledApps && enabledApps.length > 0 && !enabledApps.includes(app.id)) {
            // Keep system core apps visible
            if (app.category !== 'system' && app.type !== 'react') return false;
        }

        // Filter by selected category
        if (selectedCategory !== 'all' && app.category !== selectedCategory) return false;

        // Filter by search query
        if (searchQuery && !app.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
    });

    const activeCatObj = categories.find(c => c.id === selectedCategory) || categories[0];

    return (
        <div className="desktop-page-wrapper">
            {/* Top Header Bar */}
            <header className="desktop-header">
                <div className="desktop-brand">
                    <i className="fas fa-bolt brand-icon"></i>
                    <span className="brand-name">UltraSudo</span>
                </div>
                <div className="search-bar-container">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        id="search-bar"
                        placeholder="Search apps, web, or offline tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <div className="desktop-body">
                {/* Left Category Sidebar */}
                <aside className="category-sidebar">
                    <div className="sidebar-header">
                        <span>CATEGORIES</span>
                    </div>
                    <nav className="category-nav">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-nav-item ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                <i className={cat.icon}></i>
                                <span>{cat.name}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="desktop-main-area">
                    <div className="apps-section-header">
                        <h2>
                            <i className={activeCatObj.icon}></i>
                            {activeCatObj.name}
                        </h2>
                        <span className="app-count">{displayApps.length} apps available</span>
                    </div>

                    <div className="app-grid">
                        {displayApps.map(app => (
                            <a
                                key={app.id}
                                href="#"
                                className="app-card"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleAppClick(app);
                                }}
                            >
                                <div className="app-card-icon">
                                    <i className={app.icon}></i>
                                </div>
                                <span className="app-card-title">{app.name}</span>
                                <span className="app-card-category">{app.category}</span>
                            </a>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
