import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_REGISTRY } from '../utils/appRegistry';
import { useSystemStore } from '../store/useSystemStore';
import './WizardPage.css';

const USER_TYPE_DEFAULTS = {
    developer: ['web-browser', 'desktop', 'notebook', 'code-generator', 'python-ide', 'mermaid-editor', 'markdown-editor', 'kanban-board', 'calculator', 'timer', 'spreadsheet-app'],
    finance: ['web-browser', 'desktop', 'stock-ticker', 'stock-screener', 'currency-converter', 'investment-board', 'portfolio-manager', 'calculator', 'spreadsheet-app', 'notebook', 'todo-list'],
    student: ['web-browser', 'desktop', 'notebook', 'calculator', 'timer', 'todo-list', 'calendar', 'spreadsheet-app', 'pomodoro-timer', 'markdown-editor', 'kanban-board'],
    creative: ['web-browser', 'desktop', 'galactic-simulator', 'music', 'markdown-editor', 'kanban-board', 'notebook', 'mermaid-editor', 'calculator', 'timer'],
    general: ['web-browser', 'desktop', 'calculator', 'todo-list', 'notebook', 'timer', 'weather', 'pomodoro-timer', 'calendar', 'markdown-editor']
};

const CATEGORY_LABELS = { productivity: '📋 Productivity', finance: '💰 Finance', development: '🛠 Development', lifestyle: '🌿 Lifestyle', health: '❤ Health', entertainment: '🎮 Entertainment', system: '⚙ System' };
const CATEGORY_ORDER = ['productivity', 'finance', 'development', 'lifestyle', 'health', 'entertainment', 'system'];

const TOTAL_STEPS = 5;

// AI Provider cards shown in step 2
const AI_PROVIDERS = [
    {
        id: 'gemini',
        name: 'Google Gemini',
        badge: 'Free',
        badgeColor: '#10b981',
        description: 'Powerful multimodal AI — Gemini Flash is free with no card required.',
        icon: 'fab fa-google',
        gradient: 'linear-gradient(135deg, #4285f4, #0f9d58)',
        keyPlaceholder: 'AIzaSy...',
        registrationUrl: 'https://aistudio.google.com/apikey',
        registrationLabel: 'Get free key at Google AI Studio',
        storageKey: 'ultrasudo_gemini_key',
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        badge: 'Free Tier',
        badgeColor: '#10b981',
        description: 'Access 100+ models (Gemini, Claude, Llama, GPT-4) via one free key.',
        icon: 'fas fa-route',
        gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',
        keyPlaceholder: 'sk-or-v1-...',
        registrationUrl: 'https://openrouter.ai/keys',
        registrationLabel: 'Get free key at OpenRouter',
        storageKey: 'ultrasudo_openrouter_key',
    },
    {
        id: 'openai',
        name: 'OpenAI',
        badge: 'Paid',
        badgeColor: '#f59e0b',
        description: 'GPT-4o and GPT-4o-mini. Requires account credits (optional).',
        icon: 'fas fa-brain',
        gradient: 'linear-gradient(135deg, #10a37f, #0d8a6c)',
        keyPlaceholder: 'sk-...',
        registrationUrl: 'https://platform.openai.com/api-keys',
        registrationLabel: 'Get key at OpenAI Platform',
        storageKey: 'ultrasudo_api_key',
    },
];

export default function WizardPage() {
    const navigate = useNavigate();
    const { setupComplete, setUserType, setEnabledApps, setTheme, completeSetup } = useSystemStore();
    const [step, setStep] = useState(1);
    const [userType, localSetUserType] = useState('general');
    const [selectedApps, setSelectedApps] = useState(new Set(USER_TYPE_DEFAULTS.general));
    const [themeSelection, setThemeSelection] = useState('default');
    const [cloudSync, setCloudSync] = useState(false);
    const [apiKeys, setApiKeys] = useState({ gemini: '', openrouter: '', openai: '' });
    const [savedKeys, setSavedKeys] = useState({});
    const [showKeys, setShowKeys] = useState({});

    useEffect(() => {
        if (setupComplete) { navigate('/desktop'); return; }

        // Guest bypass — guests don't need the wizard
        const isGuest = window.currentUser?.isGuest === true || !window.currentUser;
        if (isGuest) {
            completeSetup();
            navigate('/desktop');
        }
    }, [setupComplete, navigate, completeSetup]);

    const handleNext = () => {
        if (step === 3) setSelectedApps(new Set(USER_TYPE_DEFAULTS[userType]));
        if (step < TOTAL_STEPS) setStep(s => s + 1);
    };

    const handlePrev = () => { if (step > 1) setStep(s => s - 1); };

    const handleFinish = () => {
        setUserType(userType);
        let appsToSave = Array.from(selectedApps);
        if (!appsToSave.includes('desktop')) appsToSave.push('desktop');
        if (!appsToSave.includes('web-browser')) appsToSave.push('web-browser');
        setEnabledApps(appsToSave);
        setTheme(themeSelection);
        completeSetup();
        navigate('/desktop');
    };

    const handleSaveKey = (provider) => {
        const key = apiKeys[provider.id]?.trim();
        if (!key) return;
        localStorage.setItem(provider.storageKey, key);
        // Also set via data-manager if available
        if (provider.id === 'gemini') {
            localStorage.setItem('gemini_api_key', key);
            if (window.setApiKey) window.setApiKey('gemini', { apiKey: key, model: 'gemini-2.0-flash' });
        }
        if (provider.id === 'openrouter') {
            if (window.setApiKey) window.setApiKey('openrouter', { apiKey: key, model: 'google/gemini-2.0-flash-exp:free', baseUrl: 'https://openrouter.ai/api/v1' });
        }
        if (provider.id === 'openai') {
            if (window.setApiKey) window.setApiKey('openai', { apiKey: key, model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' });
        }
        setSavedKeys(s => ({ ...s, [provider.id]: true }));
    };

    const toggleApp = (id) => {
        const newSet = new Set(selectedApps);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedApps(newSet);
    };

    const toggleCategory = (catApps) => {
        const allChecked = catApps.every(app => selectedApps.has(app.id));
        const newSet = new Set(selectedApps);
        catApps.forEach(app => { if (allChecked) newSet.delete(app.id); else newSet.add(app.id); });
        setSelectedApps(newSet);
    };

    return (
        <div className="wizard-container">
            <div className="wizard-progress">
                <div className="progress-track"><div className="progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}></div></div>
                <div className="progress-steps">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
                        <div key={s} className={`step-dot ${s === step ? 'active' : ''} ${s < step ? 'done' : ''}`}><span>{s}</span></div>
                    ))}
                </div>
            </div>

            {/* Step 1: Welcome */}
            {step === 1 && (
                <section className="wizard-step active">
                    <div className="step-content centered">
                        <div className="brand-icon"><i className="fas fa-layer-group"></i></div>
                        <h1>Welcome to <span className="gradient-text">Ultrasudo</span></h1>
                        <p className="subtitle">Your personal, secure desktop environment.<br />Let's set things up in under a minute.</p>
                        <button className="btn-next" onClick={handleNext}>Get Started <i className="fas fa-arrow-right"></i></button>
                    </div>
                </section>
            )}

            {/* Step 2: API Keys */}
            {step === 2 && (
                <section className="wizard-step active">
                    <div className="step-content">
                        <h2>⚡ Power up with AI</h2>
                        <p className="step-desc">Add an API key to enable AI features across Ultrasudo. All keys are <strong>free to get</strong> — you can skip and add them later.</p>

                        <div className="api-key-cards">
                            {AI_PROVIDERS.map(provider => (
                                <div className="api-key-card" key={provider.id}>
                                    <div className="api-key-card-header">
                                        <div className="api-provider-icon" style={{ background: provider.gradient }}>
                                            <i className={provider.icon}></i>
                                        </div>
                                        <div className="api-provider-info">
                                            <div className="api-provider-name">
                                                {provider.name}
                                                <span className="api-badge" style={{ color: provider.badgeColor, borderColor: provider.badgeColor + '55', background: provider.badgeColor + '18' }}>
                                                    {provider.badge}
                                                </span>
                                            </div>
                                            <div className="api-provider-desc">{provider.description}</div>
                                        </div>
                                        {savedKeys[provider.id] && (
                                            <span className="api-saved-tick"><i className="fas fa-check-circle"></i></span>
                                        )}
                                    </div>

                                    <a href={provider.registrationUrl} target="_blank" rel="noopener noreferrer" className="api-get-key-link">
                                        <i className="fas fa-external-link-alt"></i> {provider.registrationLabel}
                                    </a>

                                    <div className="api-key-input-row">
                                        <input
                                            type={showKeys[provider.id] ? 'text' : 'password'}
                                            placeholder={provider.keyPlaceholder}
                                            value={apiKeys[provider.id] || ''}
                                            onChange={e => setApiKeys(k => ({ ...k, [provider.id]: e.target.value }))}
                                            className="api-key-input"
                                            autoComplete="off"
                                        />
                                        <button
                                            className="api-eye-btn"
                                            onClick={() => setShowKeys(s => ({ ...s, [provider.id]: !s[provider.id] }))}
                                            title="Show/hide key"
                                        >
                                            <i className={`fas ${showKeys[provider.id] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                        <button
                                            className="api-save-btn"
                                            onClick={() => handleSaveKey(provider)}
                                            disabled={!apiKeys[provider.id]?.trim()}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="step-nav">
                            <button className="btn-back" onClick={handlePrev}><i className="fas fa-arrow-left"></i> Back</button>
                            <button className="btn-skip" onClick={handleNext}>Skip for now</button>
                            <button className="btn-next" onClick={handleNext}>Continue <i className="fas fa-arrow-right"></i></button>
                        </div>
                        <p className="wizard-hint">You can always add or change keys in the <strong>API Key Manager</strong> app.</p>
                    </div>
                </section>
            )}

            {/* Step 3: User Type */}
            {step === 3 && (
                <section className="wizard-step active">
                    <div className="step-content">
                        <h2>What best describes you?</h2>
                        <p className="step-desc">We'll pre-select the best apps for your workflow. You can always change this later.</p>
                        <div className="user-type-grid">
                            {['developer', 'finance', 'student', 'creative', 'general'].map(t => (
                                <label key={t} className={`user-type-card ${userType === t ? 'selected' : ''}`}>
                                    <input type="radio" value={t} checked={userType === t} onChange={(e) => localSetUserType(e.target.value)} />
                                    <div className="card-inner">
                                        <i className={`fas fa-${t === 'developer' ? 'code' : t === 'finance' ? 'chart-line' : t === 'student' ? 'graduation-cap' : t === 'creative' ? 'palette' : 'house-user'}`}></i>
                                        <h3 style={{ textTransform: 'capitalize' }}>{t}</h3>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="step-nav">
                            <button className="btn-back" onClick={handlePrev}><i className="fas fa-arrow-left"></i> Back</button>
                            <button className="btn-next" onClick={handleNext}>Next <i className="fas fa-arrow-right"></i></button>
                        </div>
                    </div>
                </section>
            )}

            {/* Step 4: Apps */}
            {step === 4 && (
                <section className="wizard-step active">
                    <div className="step-content">
                        <h2>Choose your apps</h2>
                        <p className="step-desc">Apps are grouped by category.</p>
                        <div className="apps-scroll-area">
                            {CATEGORY_ORDER.map(cat => {
                                const catApps = APP_REGISTRY.filter(a => a.category === cat && a.id !== 'desktop');
                                if (!catApps.length) return null;
                                return (
                                    <div className="category-group" key={cat}>
                                        <div className="category-header">
                                            <h4>{CATEGORY_LABELS[cat] || cat}</h4>
                                            <button className="category-toggle-all" onClick={() => toggleCategory(catApps)}>Toggle All</button>
                                        </div>
                                        <div className="category-apps">
                                            {catApps.map(app => (
                                                <label key={app.id} className={`app-toggle-card ${selectedApps.has(app.id) ? 'selected' : ''}`}>
                                                    <input type="checkbox" checked={selectedApps.has(app.id)} onChange={() => toggleApp(app.id)} />
                                                    <div className="app-check"><i className="fas fa-check"></i></div>
                                                    <i className={`${app.icon} icon`}></i>
                                                    <div className="app-info"><span className="app-name">{app.name}</span></div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="step-nav">
                            <button className="btn-back" onClick={handlePrev}><i className="fas fa-arrow-left"></i> Back</button>
                            <button className="btn-next" onClick={handleNext}>Next <i className="fas fa-arrow-right"></i></button>
                        </div>
                    </div>
                </section>
            )}

            {/* Step 5: Final touches */}
            {step === 5 && (
                <section className="wizard-step active">
                    <div className="step-content">
                        <h2>Final touches</h2>
                        <div className="theme-section">
                            <h3><i className="fas fa-paint-brush"></i> Theme</h3>
                            <div className="theme-grid">
                                {['default', 'dark-grey', 'nature', 'light'].map(t => (
                                    <label key={t} className={`theme-card ${themeSelection === t ? 'selected' : ''}`}>
                                        <input type="radio" value={t} checked={themeSelection === t} onChange={(e) => setThemeSelection(e.target.value)} />
                                        <div className="theme-preview" style={{ background: t === 'default' ? 'linear-gradient(135deg, #0f172a, #1e3a5f)' : t === 'light' ? '#f8fafc' : t === 'nature' ? '#14532d' : '#1e293b' }}></div>
                                        <span>{t}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="data-section">
                            <h3><i className="fas fa-cloud"></i> Data Sync</h3>
                            <label className="toggle-row">
                                <span>Sync app data to cloud</span>
                                <input type="checkbox" checked={cloudSync} onChange={(e) => setCloudSync(e.target.checked)} />
                                <div className="toggle-switch"></div>
                            </label>
                        </div>
                        <div className="step-nav">
                            <button className="btn-back" onClick={handlePrev}><i className="fas fa-arrow-left"></i> Back</button>
                            <button className="btn-finish" onClick={handleFinish}><i className="fas fa-rocket"></i> Launch</button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
