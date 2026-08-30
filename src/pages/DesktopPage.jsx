import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_REGISTRY, buildAppPath } from '../utils/appRegistry';
import { useSystemStore } from '../store/useSystemStore';
import { ensureDataManagerLoaded } from '../utils/dataManagerBridge';
import ThemeSelector from '../components/ThemeSelector/ThemeSelector';
import AuthModal from '../components/AuthModal/AuthModal';
import NewsFeed from '../components/NewsFeed/NewsFeed';
import ultrasudoLogo from '../assets/ultrasudo-logo.png';
import './DesktopPage.css';

export default function DesktopPage() {
    const navigate = useNavigate();
    const { setupComplete, enabledApps, loadFromStorage } = useSystemStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(() => {
        const savedEmail = localStorage.getItem('supabase_user_email');
        return savedEmail ? { email: savedEmail } : null;
    });

    useEffect(() => {
        loadFromStorage();
        ensureDataManagerLoaded();

        // Check active Supabase session if SDK present
        if (window.supabaseClient) {
            window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (session && session.user) {
                    setCurrentUser(session.user);
                }
            }).catch(e => console.warn(e));
        }
    }, [loadFromStorage]);

    useEffect(() => {
        if (setupComplete === false) navigate('/wizard');
    }, [setupComplete, navigate]);

    const handleAppClick = (app) => {
        const appPath = buildAppPath(app);
        navigate(appPath);
    };

    const handleSignOut = async () => {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut().catch(() => {});
        }
        localStorage.removeItem('supabase_auth_token');
        localStorage.removeItem('supabase_user_email');
        setCurrentUser(null);
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
        if (app.id === 'desktop') return false;
        
        if (enabledApps && enabledApps.length > 0 && !enabledApps.includes(app.id)) {
            if (app.category !== 'system' && app.type !== 'react') return false;
        }

        if (selectedCategory !== 'all' && app.category !== selectedCategory) return false;
        if (searchQuery && !app.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
    });

    const activeCatObj = categories.find(c => c.id === selectedCategory) || categories[0];

    /** Returns indicator badge elements for an app */
    function getIndicators(app) {
        const indicators = [];
        const isOffline = app.type === 'react' || app.type === 'offline';
        const isOnline  = app.type === 'online' || app.type === 'hybrid';

        if (isOffline && !isOnline) {
            indicators.push(
                <span key="offline" className="app-indicator offline" title="Works offline">📴</span>
            );
        }
        if (isOnline) {
            indicators.push(
                <span key="online" className="app-indicator online" title="Requires internet">🌐</span>
            );
        }
        if (app.ai) {
            indicators.push(
                <span key="ai" className="app-indicator ai" title="Uses Generative AI">🤖</span>
            );
        }
        return indicators;
    }

    return (
        <div className="desktop-page-wrapper">
            {/* Top Header Bar */}
            <header className="desktop-header">
                <div className="desktop-brand" onClick={() => navigate('/desktop')} style={{ cursor: 'pointer' }} title="UltraSudo Home">
                    <img src={ultrasudoLogo} alt="UltraSudo Logo" className="desktop-logo-img" />
                    <span className="brand-name">UltraSudo Home</span>
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ThemeSelector />

                    {currentUser ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'rgba(51, 65, 85, 0.5)',
                                    padding: '6px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <div style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    fontSize: '12px'
                                }}>
                                    {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {currentUser.email}
                                </span>
                            </div>
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={handleSignOut}
                                title="Sign Out"
                            >
                                <i className="fas fa-right-from-bracket"></i>
                            </button>
                        </div>
                    ) : (
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => setIsAuthOpen(true)}
                        >
                            <i className="fas fa-user-plus"></i> Sign In / Sign Up
                        </button>
                    )}
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
                                {/* Connectivity indicators — top-right corner */}
                                <div className="app-card-indicators">
                                    {getIndicators(app)}
                                </div>

                                <div className="app-card-icon">
                                    <i className={app.icon}></i>
                                </div>
                                <span className="app-card-title">{app.name}</span>
                                <span className="app-card-category">{app.category}</span>
                            </a>
                        ))}
                    </div>

                    {/* Integrated News Feed Section */}
                    <NewsFeed />
                </main>
            </div>

            {/* Supabase Authentication Modal */}
            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onAuthSuccess={(user) => setCurrentUser(user)}
            />

            {/* Floating Connectivity Legend */}
            <ConnectivityLegend />
        </div>
    );
}

/** Floating legend panel — fixed bottom-right */
function ConnectivityLegend() {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <div className={`connectivity-legend${collapsed ? ' collapsed' : ''}`}>
            <div className="legend-header" onClick={() => setCollapsed(c => !c)}>
                <span className="legend-title">App Legend</span>
                <span className="legend-chevron">{collapsed ? '▲' : '▼'}</span>
            </div>
            <div className="legend-body">
                <div className="legend-row">
                    <span className="legend-icon offline">📴</span>
                    <span>Works fully offline</span>
                </div>
                <div className="legend-row">
                    <span className="legend-icon online">🌐</span>
                    <span>Requires internet</span>
                </div>
                <div className="legend-row">
                    <span className="legend-icon ai">🤖</span>
                    <span>Uses Generative AI</span>
                </div>
            </div>
        </div>
    );
}
