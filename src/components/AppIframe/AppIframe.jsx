import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AppIframe.css';

/**
 * Generic fullscreen iframe wrapper for online/hybrid apps.
 * Used for apps that are external URLs (WhatsApp, Telegram, etc.)
 * or internal HTML-file apps not yet migrated to native React components.
 *
 * Usage via React Router: /iframe?src=https://web.whatsapp.com&title=WhatsApp
 */
export default function AppIframe({ src, title = 'App', showControls = true }) {
    const navigate = useNavigate();
    const iframeRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    // Also support URL query params if loaded from router
    const params = new URLSearchParams(window.location.search);
    const resolvedSrc = src || params.get('src') || '';
    const resolvedTitle = title !== 'App' ? title : (params.get('title') || 'App');

    const handleLoad = () => setIsLoading(false);
    const handleError = () => {
        setIsLoading(false);
        setLoadError(true);
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setLoadError(false);
        if (iframeRef.current) {
            iframeRef.current.src = resolvedSrc;
        }
    };

    const handleBack = () => navigate(-1);

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
                    <button className="iframe-back-btn" onClick={handleBack} title="Back">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <span className="iframe-title">{resolvedTitle}</span>
                    <button className="iframe-refresh-btn" onClick={handleRefresh} title="Refresh">
                        <i className="fas fa-rotate-right"></i>
                    </button>
                </div>
            )}

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
        </div>
    );
}
