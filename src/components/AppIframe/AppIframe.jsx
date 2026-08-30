import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ultrasudoLogo from '../../assets/ultrasudo-logo.png';
import './AppIframe.css';

/**
 * Apps that block iframe embedding (X-Frame-Options / CSP frame-ancestors).
 * Instead of showing a broken frame, we render a friendly BlockedAppScreen.
 */
const IFRAME_BLOCKED_APPS = {
    'web.whatsapp.com': {
        name: 'WhatsApp',
        iconClass: 'fab fa-whatsapp',
        color: '#25D366',
        gradient: 'linear-gradient(135deg, #25D366, #128C7E)',
        url: 'https://web.whatsapp.com',
        desktopUrl: 'https://www.whatsapp.com/download',
        desktopNote: 'WhatsApp Desktop — Windows & Mac',
        pwaGuide: true,
        qrGuide: true,
        qrSteps: [
            'Open WhatsApp on your phone',
            'Tap the ⋮ menu (Android) or Settings (iPhone)',
            'Tap Linked Devices → Link a Device',
            'Scan the QR code at web.whatsapp.com in your browser',
        ],
    },
    'web.telegram.org': {
        name: 'Telegram',
        iconClass: 'fab fa-telegram',
        color: '#0088CC',
        gradient: 'linear-gradient(135deg, #0088CC, #005fa3)',
        url: 'https://web.telegram.org',
        desktopUrl: 'https://desktop.telegram.org',
        desktopNote: 'Telegram Desktop — Windows, Mac & Linux',
        pwaGuide: true,
        qrGuide: false,
        qrSteps: [],
    },
};

function getBlockedConfig(src) {
    if (!src) return null;
    for (const [domain, cfg] of Object.entries(IFRAME_BLOCKED_APPS)) {
        if (src.includes(domain)) return cfg;
    }
    return null;
}

// ── Blocked App Screen ───────────────────────────────────────────────────────
function BlockedAppScreen({ cfg, onBack }) {
    const [showQr, setShowQr] = useState(false);
    const [showPwa, setShowPwa] = useState(false);

    return (
        <div className="blocked-app-screen">
            {/* Brand hero */}
            <div className="blocked-hero">
                <div className="blocked-app-icon" style={{ background: cfg.gradient }}>
                    <i className={cfg.iconClass}></i>
                </div>
                <h2 className="blocked-title">{cfg.name}</h2>
                <div className="blocked-badge">
                    <i className="fas fa-shield-halved"></i> Secure Embedding Blocked
                </div>
            </div>

            {/* Explanation */}
            <div className="blocked-explanation">
                <p>
                    <strong>{cfg.name}</strong> uses <code>X-Frame-Options</code> security headers to prevent
                    embedding in other apps — this protects your account from clickjacking attacks.
                    You can still use {cfg.name} in a dedicated browser window.
                </p>
            </div>

            {/* Primary CTA */}
            <button
                className="blocked-open-btn"
                style={{ background: cfg.gradient }}
                onClick={() => window.open(cfg.url, '_blank', 'noopener,noreferrer')}
            >
                <i className="fas fa-arrow-up-right-from-square"></i>
                Open {cfg.name} in Browser
            </button>

            {/* Option cards */}
            <div className="blocked-options">
                {/* QR Login guide — WhatsApp only */}
                {cfg.qrGuide && (
                    <div className="blocked-option-card">
                        <button className="option-toggle" onClick={() => setShowQr(v => !v)}>
                            <span><i className="fas fa-qrcode"></i> How to use {cfg.name} Web</span>
                            <i className={`fas fa-chevron-${showQr ? 'up' : 'down'}`}></i>
                        </button>
                        {showQr && (
                            <ol className="option-steps">
                                {cfg.qrSteps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ol>
                        )}
                    </div>
                )}

                {/* PWA install */}
                {cfg.pwaGuide && (
                    <div className="blocked-option-card">
                        <button className="option-toggle" onClick={() => setShowPwa(v => !v)}>
                            <span><i className="fas fa-mobile-screen"></i> Install as Desktop App (PWA)</span>
                            <i className={`fas fa-chevron-${showPwa ? 'up' : 'down'}`}></i>
                        </button>
                        {showPwa && (
                            <ol className="option-steps">
                                <li>
                                    Open{' '}
                                    <a href={cfg.url} target="_blank" rel="noopener noreferrer"
                                        style={{ color: cfg.color }}>{cfg.url}</a>{' '}
                                    in Google Chrome
                                </li>
                                <li>Click the <strong>⋮</strong> menu in Chrome's address bar area</li>
                                <li>Select <strong>Save and share → Install page as app</strong></li>
                                <li>{cfg.name} will open as a standalone desktop window with no browser tabs</li>
                            </ol>
                        )}
                    </div>
                )}

                {/* Desktop app */}
                <div className="blocked-option-card desktop-app-card">
                    <div className="desktop-app-info">
                        <div className="desktop-app-icon-sm" style={{ background: cfg.gradient }}>
                            <i className={cfg.iconClass}></i>
                        </div>
                        <div>
                            <div className="desktop-app-name">{cfg.desktopNote}</div>
                            <div className="desktop-app-sub">Best performance — native app experience</div>
                        </div>
                    </div>
                    <a href={cfg.desktopUrl} target="_blank" rel="noopener noreferrer"
                        className="desktop-download-btn" style={{ borderColor: cfg.color, color: cfg.color }}>
                        <i className="fas fa-download"></i> Download
                    </a>
                </div>
            </div>

            <button className="blocked-back-btn" onClick={onBack}>
                <i className="fas fa-arrow-left"></i> Back to Desktop
            </button>
        </div>
    );
}

// ── Main AppIframe Component ──────────────────────────────────────────────────
export default function AppIframe({ src, title = 'App', showControls = true }) {
    const navigate = useNavigate();
    const iframeRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const params = new URLSearchParams(window.location.search);
    const resolvedSrc = src || params.get('src') || '';
    const resolvedTitle = title !== 'App' ? title : (params.get('title') || 'App');

    const blockedCfg = getBlockedConfig(resolvedSrc);

    const handleLoad = () => setIsLoading(false);
    const handleError = () => { setIsLoading(false); setLoadError(true); };
    const handleRefresh = () => {
        setIsLoading(true);
        setLoadError(false);
        if (iframeRef.current) iframeRef.current.src = resolvedSrc;
    };
    const handleBack = () => navigate(-1);
    const handleHome = () => navigate('/desktop');

    if (!resolvedSrc) {
        return (
            <div className="app-iframe-error">
                <i className="fas fa-exclamation-triangle"></i>
                <p>No source URL provided for this app.</p>
                <button onClick={handleBack}>← Go Back</button>
            </div>
        );
    }

    return (
        <div className="app-iframe-wrapper">
            {showControls && (
                <div className="app-iframe-toolbar">
                    <div className="iframe-nav-controls">
                        <button className="iframe-nav-btn iframe-back-btn" onClick={handleBack} title="Go Back">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <button className="iframe-nav-btn iframe-home-btn" onClick={handleHome} title="Go to Home">
                            <i className="fas fa-house"></i>
                        </button>
                        <img src={ultrasudoLogo} alt="UltraSudo Logo" className="iframe-logo-img" onClick={handleHome} title="UltraSudo Home" />
                    </div>
                    <span className="iframe-title">{resolvedTitle}</span>
                    {!blockedCfg && (
                        <button className="iframe-refresh-btn" onClick={handleRefresh} title="Refresh">
                            <i className="fas fa-rotate-right"></i>
                        </button>
                    )}
                </div>
            )}

            {/* Blocked app — show friendly screen instead of broken iframe */}
            {blockedCfg ? (
                <BlockedAppScreen cfg={blockedCfg} onBack={handleBack} />
            ) : (
                <>
                    {isLoading && (
                        <div className="app-iframe-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading {resolvedTitle}…</p>
                        </div>
                    )}

                    {loadError ? (
                        <div className="app-iframe-error">
                            <i className="fas fa-wifi-slash"></i>
                            <p>Could not load <strong>{resolvedTitle}</strong>.</p>
                            <p className="error-hint">This app may require an internet connection, or the URL may have changed.</p>
                            <button onClick={handleRefresh}>Try Again</button>
                            <button onClick={handleBack}>← Go Back</button>
                        </div>
                    ) : (
                        <iframe
                            ref={iframeRef}
                            src={resolvedSrc}
                            title={resolvedTitle}
                            className="app-iframe-frame"
                            onLoad={handleLoad}
                            onError={handleError}
                            allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
                        />
                    )}
                </>
            )}
        </div>
    );
}
