import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrowserStore } from '../store/useBrowserStore';
import { APP_REGISTRY } from '../utils/appRegistry';
import ultrasudoLogo from '../assets/ultrasudo-logo.png';
import './BrowserPage.css';

export default function BrowserPage() {
    const navigate = useNavigate();
    const { bookmarks, history, addBookmark, removeBookmark, addHistory } = useBrowserStore();
    
    const [urlInput, setUrlInput] = useState('');
    const [sidebarActive, setSidebarActive] = useState('');
    const [localTabs, setLocalTabs] = useState([{ id: 'tab_1', url: 'https://duckduckgo.com', title: 'New Tab' }]);
    const [activeLocalTabId, setActiveLocalTabId] = useState('tab_1');

    const handleUrlSubmit = (e) => {
        if (e.key === 'Enter') {
            let url = urlInput;
            if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
                url = 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
            }
            navigateTab(activeLocalTabId, url);
        }
    };

    const navigateTab = (id, url) => {
        setLocalTabs(tabs => tabs.map(t => t.id === id ? { ...t, url, title: 'Loading...' } : t));
        if (window.__TAURI__) {
            try {
                window.__TAURI__.core.invoke('navigate_tab', { id, url }).catch(console.error);
            } catch (e) { console.error("Could not invoke navigate_tab", e); }
        }
        addHistory({ url, title: url, date: new Date().toISOString() });
    };

    const toggleSidebar = (panel) => {
        setSidebarActive(prev => prev === panel ? '' : panel);
    };

    return (
        <div style={{display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden'}}>
            {/* Apps Sidebar (Left) */}
            <div className="apps-sidebar">
                <div className="app-shortcut" onClick={() => navigate('/desktop')} title="Home">
                    <img src={ultrasudoLogo} alt="UltraSudo Logo" style={{ width: '24px', height: '24px', borderRadius: '5px', objectFit: 'contain' }} />
                </div>
                {APP_REGISTRY.filter(a => a.type !== 'system' && a.id !== 'web-browser').slice(0, 5).map(app => (
                    <div className="app-shortcut" key={app.id} onClick={(e) => {
                        e.preventDefault();
                        if (window.__TAURI__) {
                            window.__TAURI__.core.invoke('open_new_tab', { path: app.path }).catch(console.error);
                        } else {
                            window.location.href = app.path;
                        }
                    }} title={app.name}>
                        <i className={app.icon}></i>
                    </div>
                ))}
            </div>

            {/* Main Browser Canvas */}
            <div className="main-body" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <header className="browser-header">
                    <div className="window-controls"></div>
                    <div className="tabs-container">
                        {localTabs.map(t => (
                            <div key={t.id} className={`tab ${activeLocalTabId === t.id ? 'active' : ''}`} onClick={() => { setActiveLocalTabId(t.id); setUrlInput(t.url); }}>
                                <span className="tab-title">{t.title}</span>
                                <button className="tab-close"><i className="fas fa-times"></i></button>
                            </div>
                        ))}
                        <button className="tab-new" onClick={() => {
                            const newId = 'tab_' + Date.now();
                            setLocalTabs([...localTabs, { id: newId, url: 'https://duckduckgo.com', title: 'New Tab' }]);
                            setActiveLocalTabId(newId);
                        }}>
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>

                    <div className="nav-controls">
                        <button className="nav-btn" onClick={() => navigate(-1)} title="Go Back"><i className="fas fa-arrow-left"></i></button>
                        <button className="nav-btn" onClick={() => navigate(1)} title="Go Forward"><i className="fas fa-arrow-right"></i></button>
                        <button className="nav-btn" onClick={() => navigate('/desktop')} title="Go to Home"><i className="fas fa-house"></i></button>
                        <button className="nav-btn" onClick={() => {
                            const currentTab = localTabs.find(t => t.id === activeLocalTabId);
                            if (currentTab) navigateTab(activeLocalTabId, currentTab.url);
                        }} title="Reload"><i className="fas fa-redo"></i></button>
                        <div className="url-bar-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="url-bar" value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={handleUrlSubmit} />
                            <div className="bookmark-btn"><i className="far fa-star"></i></div>
                        </div>
                        <button className="nav-btn" onClick={() => toggleSidebar('settings')}><i className="fas fa-cog"></i></button>
                        <button className="nav-btn" onClick={() => toggleSidebar('history')}><i className="fas fa-history"></i></button>
                        <button className="nav-btn" onClick={() => toggleSidebar('bookmarks')}><i className="fas fa-bookmark"></i></button>
                        <button className="nav-btn" onClick={() => toggleSidebar('passwords')}><i className="fas fa-key"></i></button>
                    </div>
                </header>

                <div className="content-area" style={{flex: 1, position: 'relative', display: 'flex'}}>
                    {/* Left Sidebar Menu */}
                    <div className={`sidebar ${sidebarActive ? 'active' : ''}`}>
                         <div className="sidebar-header">
                             <h3 style={{textTransform:'capitalize'}}>{sidebarActive}</h3>
                             <button className="sidebar-close" onClick={() => setSidebarActive('')}><i className="fas fa-times"></i></button>
                         </div>
                         <div className="sidebar-content" style={{padding: '10px'}}>
                            {sidebarActive === 'history' && history.map((h, i) => <div key={i} style={{marginBottom: '10px'}}>{h.title}<br/><small style={{color:'gray'}}>{h.url}</small></div>)}
                            {sidebarActive === 'bookmarks' && bookmarks.map((b, i) => <div key={i}>{b.title}</div>)}
                         </div>
                    </div>

                    {/* Webviews fallback for React testing without Tauri */}
                    <div className="webviews" style={{flex: 1, position: 'relative'}}>
                        {!window.__TAURI__ && localTabs.map(t => (
                            <iframe 
                                key={t.id} 
                                src={t.url} 
                                style={{ width: '100%', height: '100%', border: 'none', display: activeLocalTabId === t.id ? 'block' : 'none' }}
                                title={t.title}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
