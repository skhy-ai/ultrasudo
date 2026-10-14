import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HUB_REGISTRY, buildAppPath } from '../utils/appRegistry';
import { useSystemStore } from '../store/useSystemStore';
import { ensureDataManagerLoaded } from '../utils/dataManagerBridge';
import { useAppAgent } from '../hooks/useAppAgent';
import CopilotDrawer from '../components/shared/CopilotDrawer/CopilotDrawer';
import ThemeSelector from '../components/ThemeSelector/ThemeSelector';
import AuthModal from '../components/AuthModal/AuthModal';
import QuickLaunch from '../components/QuickLaunch/QuickLaunch';
import { useFavorites } from '../hooks/useFavorites';
import ultrasudoLogo from '../assets/ultrasudo-logo.png';
import './DesktopPage.css';

export default function DesktopPage() {
    const navigate = useNavigate();
    const { setupComplete, loadFromStorage } = useSystemStore();
    const { toggleFavorite, isFavorite } = useFavorites();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(() => {
        const savedEmail = localStorage.getItem('supabase_user_email');
        return savedEmail ? { email: savedEmail } : null;
    });

    const totalSubApps = HUB_REGISTRY.reduce((acc, h) => acc + (h.subApps?.length || 0), 0);

    useAppAgent({
        appId: 'desktop',
        appName: 'UltraSudo Home',
        getContext: () => ({
            selectedCategory,
            totalHubsAvailable: HUB_REGISTRY.length,
            totalIntegratedSubApps: totalSubApps,
            searchQuery: searchQuery || undefined
        }),
        suggestedPrompts: [
            'Show me the ESG & Carbon emissions tools',
            'How do I model our 13-week cash runway?',
            'What legal and contract redlining features are available?',
            'Help me plan my workday'
        ]
    });

    useEffect(() => {
        const handleOpenCopilot = () => setIsCopilotOpen(true);
        window.addEventListener('ultrasudo:open-copilot', handleOpenCopilot);
        return () => window.removeEventListener('ultrasudo:open-copilot', handleOpenCopilot);
    }, []);

    useEffect(() => {
        loadFromStorage();
        ensureDataManagerLoaded();

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

    const handleLaunch = (target) => {
        const path = buildAppPath(target);
        navigate(path);
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
        { id: 'all',          name: 'All Hubs',         icon: 'fas fa-layer-group' },
        { id: 'sme-ops',      name: 'SME & Operations', icon: 'fas fa-building-circle-check' },
        { id: 'finance',      name: 'Finance & Markets',icon: 'fas fa-chart-line' },
        { id: 'productivity', name: 'Productivity',     icon: 'fas fa-briefcase' },
        { id: 'lifestyle',    name: 'Health & Life',    icon: 'fas fa-heart-pulse' },
        { id: 'development',  name: 'Dev & AI Studio',  icon: 'fas fa-code' },
        { id: 'system',       name: 'Security & Comms', icon: 'fas fa-shield-halved' }
    ];

    // Filter Hubs: check category and search query (which matches Hub name, description, OR any sub-app)
    const displayHubs = HUB_REGISTRY.filter(hub => {
        if (selectedCategory !== 'all' && hub.category !== selectedCategory) return false;
        
        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase();
        const matchesHub = hub.name.toLowerCase().includes(q) || hub.description.toLowerCase().includes(q);
        const matchesSubApp = hub.subApps?.some(sub => sub.name.toLowerCase().includes(q));

        return matchesHub || matchesSubApp;
    });

    const activeCatObj = categories.find(c => c.id === selectedCategory) || categories[0];

    return (
        <div className="desktop-page-wrapper">
            {/* Top Header Bar */}
            <header className="desktop-header">
                <div className="desktop-brand" onClick={() => navigate('/desktop')} style={{ cursor: 'pointer' }} title="UltraSudo Home">
                    <img src={ultrasudoLogo} alt="UltraSudo Logo" className="desktop-logo-img" />
                    <span className="brand-name">UltraSudo</span>
                    <span className="hub-badge-top">Enterprise Hubs</span>
                </div>

                <div className="search-bar-container">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        id="search-bar"
                        placeholder="Search hubs, tools (e.g. 'emissions', 'cashflow', 'redliner', 'kanban')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        className="nav-copilot-btn"
                        onClick={() => setIsCopilotOpen((v) => !v)}
                        title="Open UltraSudo Copilot (Ctrl+K)"
                    >
                        <i className="fas fa-sparkles"></i>
                        <span>Ask AI</span>
                        <span className="copilot-kbd">Ctrl+K</span>
                    </button>
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
                        <span>WORKSPACE HUBS</span>
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

                    <div className="sidebar-footer-stat">
                        <i className="fas fa-layer-group"></i>
                        <span>{HUB_REGISTRY.length} Hubs • {totalSubApps} Tools</span>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="desktop-main-area">
                    <div className="apps-section-header">
                        <div>
                            <h2>
                                <i className={activeCatObj.icon}></i>
                                {activeCatObj.name}
                            </h2>
                            <p className="section-subtitle">
                                Focused application suites built for SMEs. No app is left orphan.
                            </p>
                        </div>
                        <span className="app-count">{displayHubs.length} Active Hubs</span>
                    </div>

                    {/* Consolidated Hubs Grid */}
                    <div className="hubs-grid">
                        {displayHubs.map(hub => {
                            const isSearchMatch = searchQuery.trim().length > 0;
                            return (
                                <div key={hub.id} className="hub-card">
                                    <div className="hub-card-header">
                                        <div
                                            className="hub-icon-wrapper"
                                            style={{ background: hub.colorGradient || 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
                                            onClick={() => handleLaunch(hub)}
                                        >
                                            <i className={hub.icon}></i>
                                        </div>
                                        <div className="hub-title-block">
                                            <div className="hub-title-row">
                                                <h3 className="hub-title" onClick={() => handleLaunch(hub)}>
                                                    {hub.name}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {hub.badge && <span className="hub-badge">{hub.badge}</span>}
                                                    <button
                                                        className={`hub-fav-star-btn ${isFavorite(hub.id) ? 'is-fav' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFavorite(hub.id);
                                                        }}
                                                        title={isFavorite(hub.id) ? "Remove from Quick Launch" : "Pin to Quick Launch"}
                                                    >
                                                        <i className="fas fa-star"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="hub-desc">{hub.description}</p>
                                        </div>
                                    </div>

                                    {/* Sub-Applications Tray: All member apps nested cleanly */}
                                    <div className="hub-subapps-section">
                                        <div className="subapps-tray-header">
                                            <span>Integrated Sub-Tools ({hub.subApps?.length || 0}):</span>
                                            <button className="open-hub-btn" onClick={() => handleLaunch(hub)}>
                                                Open Full Hub <i className="fas fa-arrow-right"></i>
                                            </button>
                                        </div>
                                        <div className="subapps-chips-grid">
                                            {hub.subApps?.map(sub => {
                                                const matchesQuery = isSearchMatch && sub.name.toLowerCase().includes(searchQuery.toLowerCase());
                                                const isSubFav = isFavorite(sub.id);
                                                return (
                                                    <div key={sub.id} className="subapp-chip-wrapper">
                                                        <button
                                                            className={`subapp-chip ${matchesQuery ? 'chip-highlight' : ''}`}
                                                            onClick={() => handleLaunch(sub)}
                                                            title={`Open ${sub.name}`}
                                                        >
                                                            <i className={sub.icon}></i>
                                                            <span>{sub.name}</span>
                                                        </button>
                                                        <button
                                                            className={`subapp-fav-pin ${isSubFav ? 'is-fav' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFavorite(sub.id);
                                                            }}
                                                            title={isSubFav ? "Unpin from Quick Launch" : "Pin to Quick Launch"}
                                                        >
                                                            <i className="fas fa-star"></i>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Launch Favourites Tray (Replaces News Rail) */}
                    <QuickLaunch />
                </main>
            </div>

            {/* Supabase Authentication Modal */}
            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onAuthSuccess={(user) => setCurrentUser(user)}
            />

            {/* Global Copilot Drawer */}
            <CopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
        </div>
    );
}
