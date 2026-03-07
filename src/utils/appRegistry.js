/**
 * APP_REGISTRY — Central definition of all applications in Skand Browser.
 *
 * Migration Status:
 * - type: 'react'   → Fully migrated to native React component, routed via /app/{id}
 * - type: 'offline' → Legacy HTML/JS app, loaded via /app-view?src=&title= (iframe)
 * - type: 'online'  → External/online web app, loaded via iframe
 * - type: 'hybrid'  → Mix of local + online data, loaded via iframe
 *
 * The DesktopPage uses `buildAppPath(app)` to construct the correct navigation target.
 */
export const APP_REGISTRY = [
    // ── Native React Apps (fully migrated) ──────────────────────────────────
    { id: 'calculator',    name: 'Calculator',         path: '/app/calculator', icon: 'fas fa-calculator',         category: 'utility',       type: 'react' },
    { id: 'todo-list',     name: 'To-Do List',         path: '/app/todo-list',  icon: 'fas fa-list-check',         category: 'productivity',  type: 'react' },
    { id: 'notebook',      name: 'Notebook',           path: '/app/notebook',   icon: 'fas fa-file-word',          category: 'productivity',  type: 'react' },

    // ── System ───────────────────────────────────────────────────────────────
    { id: 'desktop',       name: 'Desktop',            path: '/desktop',        icon: 'fas fa-desktop',            category: 'system',        type: 'react' },
    { id: 'web-browser',   name: 'Web Browser',        path: '/browser',        icon: 'fab fa-chrome',             category: 'system',        type: 'react' },
    { id: 'community-board',name:'Community Apps',     src: '/community/index.html',                             icon: 'fas fa-users-viewfinder', category: 'system',   type: 'offline' },
    { id: 'p2p-calling',   name: 'P2P Calling',        src: '/p2p-calling/index.html',                            icon: 'fas fa-phone-volume',     category: 'system',   type: 'online' },
    { id: 'api-key-manager',name:'API Key Manager',    src: '/api-key-manager/index.html',                        icon: 'fas fa-key',              category: 'system',   type: 'hybrid' },
    { id: 'pqc-education', name: 'PQC Explorer',       src: '/pqc-education/index.html',                          icon: 'fas fa-shield-halved',    category: 'system',   type: 'offline' },
    { id: 'vpn',           name: 'VPN',                src: '/vpn/index.html',                                    icon: 'fas fa-shield-virus',     category: 'system',   type: 'online' },
    { id: 'openfang',      name: 'OpenFang AI',        src: '/openfang/index.html',                               icon: 'fas fa-robot',            category: 'system',   type: 'online' },

    // ── Productivity ─────────────────────────────────────────────────────────
    { id: 'markdown-editor', name: 'Markdown Editor', icon: 'fas fa-file-lines', category: 'Productivity', type: 'react', path: '/app/markdown-editor' },
    { id: 'kanban-board', name: 'Kanban Board', icon: 'fas fa-columns', category: 'Productivity', type: 'react', path: '/app/kanban-board' },
    { id: 'spreadsheet-app',  name: 'Spreadsheets',           path: '/app/spreadsheet',                               icon: 'fas fa-table',              category: 'productivity',  type: 'react'    },
    { id: 'pomodoro-timer', name: 'Pomodoro Timer', icon: 'fas fa-clock', category: 'Productivity', type: 'react', path: '/app/pomodoro-timer' },
    { id: 'timer', name: 'Timer', icon: 'fas fa-stopwatch', category: 'Productivity', type: 'react', path: '/app/timer' },
    { id: 'quote-and-catalog-generator', name: 'Quote & Catalog', path: '/app/quote-generator',                 icon: 'fas fa-quote-left',         category: 'productivity',  type: 'react'    },
    { id: 'patent-researcher',name: 'Patent Researcher',      src: '/patent-researcher/index.html',                     icon: 'fas fa-lightbulb',          category: 'productivity',  type: 'online'  },
    { id: 'calendar',         name: 'Calendar',               src: '/calendar/index.html',                              icon: 'fas fa-calendar-days',      category: 'productivity',  type: 'offline' },
    { id: 'calendar-sync',    name: 'Calendar Sync',          src: '/calendar/calendar_sync.html',                      icon: 'fas fa-calendar-check',     category: 'productivity',  type: 'online'  },
    { id: 'life-board',       name: 'Life Board',             src: '/life-board/index.html',                            icon: 'fas fa-clipboard-user',     category: 'lifestyle',     type: 'hybrid'  },

    // ── Development ──────────────────────────────────────────────────────────
    { id: 'code-generator',  name: 'Code Generator',          src: '/code-generator/code-generator.html',               icon: 'fas fa-code',               category: 'development',   type: 'hybrid'  },
    { id: 'mermaid-editor',  name: 'Mermaid Editor',          src: '/mermaid-editor/mermaid-live-editor.html',          icon: 'fas fa-diagram-project',    category: 'development',   type: 'online'  },
    { id: 'python-ide',      name: 'Data Science Workspace',  src: '/python-IDE/index.html',                            icon: 'fas fa-flask-vial',         category: 'development',   type: 'offline' },

    // ── Finance ──────────────────────────────────────────────────────────────
    { id: 'stock-ticker',     name: 'Stock Ticker',           src: '/stock-ticker/stock-ticker.html',                   icon: 'fas fa-chart-line',         category: 'finance',       type: 'online'  },
    { id: 'send-money',       name: 'Send Money',             src: '/send-money/index.html',                            icon: 'fas fa-paper-plane',        category: 'finance',       type: 'online'  },
    { id: 'investment-board', name: 'Investment Board',       src: '/investment-board/index.html',                      icon: 'fas fa-coins',              category: 'finance',       type: 'offline' },
    { id: 'portfolio-manager',name: 'Portfolio Manager',      src: '/portfolio-manager/index.html',                     icon: 'fas fa-briefcase',          category: 'finance',       type: 'offline' },
    { id: 'stock-screener',   name: 'Stock Screener',         src: '/stock-screener/index.html',                        icon: 'fas fa-search-dollar',      category: 'finance',       type: 'online'  },
    { id: 'currency-converter',name:'Currency Converter',     src: '/currency-converter/index.html',                    icon: 'fas fa-money-bill-transfer', category: 'finance',      type: 'online'  },
    { id: 'financial-service',name: 'Financial Services',     src: '/financial-service/index.html',                     icon: 'fas fa-landmark',           category: 'finance',       type: 'hybrid'  },

    // ── Entertainment ────────────────────────────────────────────────────────
    { id: 'music',             name: 'Music Player',          src: '/music/index.html',                                 icon: 'fas fa-music',              category: 'entertainment', type: 'offline' },
    { id: 'galactic-simulator',name: 'Galactic Simulator',   src: '/galactic-simulator/index.html',                    icon: 'fas fa-rocket',             category: 'entertainment', type: 'offline' },

    // ── Lifestyle & Health ───────────────────────────────────────────────────
    { id: 'weather',           name: 'Weather App',           src: '/weather/weather-dashboard.html',                   icon: 'fas fa-cloud-sun',          category: 'lifestyle',     type: 'online'  },
    { id: 'social-feed',       name: 'Unified Social Feed',   src: '/social-feed/index.html',                           icon: 'fas fa-hashtag',            category: 'lifestyle',     type: 'online'  },
    { id: 'whatsapp-web',      name: 'WhatsApp',              src: 'https://web.whatsapp.com',                          icon: 'fab fa-whatsapp',           category: 'lifestyle',     type: 'online'  },
    { id: 'telegram-web',      name: 'Telegram',              src: 'https://web.telegram.org',                          icon: 'fab fa-telegram',           category: 'lifestyle',     type: 'online'  },
    { id: 'birthday-card-generator', name: 'Birthday Cards', icon: 'fas fa-gift', category: 'Lifestyle', type: 'react', path: '/app/birthday-card' },
    { id: 'grocery', name: 'Grocery List', icon: 'fas fa-shopping-basket', category: 'Productivity', type: 'react', path: '/app/grocery' },
    { id: 'Healthy-kitchen',   name: 'Healthy Kitchen',       path: '/app/healthy-kitchen',                             icon: 'fas fa-utensils',           category: 'lifestyle',     type: 'react'    },
    { id: 'secure-vault',      name: 'Secure Vault',          path: '/app/secure-vault',                                icon: 'fas fa-vault',              category: 'productivity',  type: 'react'    },
    { id: 'yoga', name: 'Yoga & Wellness', icon: 'fas fa-spa', category: 'Health', type: 'react', path: '/app/yoga' },
    { id: 'home-diagnostics',  name: 'Home Diagnostics',      src: '/home-diagnostics/index.html',                      icon: 'fas fa-stethoscope',        category: 'health',        type: 'hybrid'  },
];

/**
 * Returns the correct navigation path for a given app entry.
 * - React apps:  route directly to /app/{id} or /desktop etc.
 * - Other apps:  encode into /app-view?src=&title= for iframe loading.
 */
export function buildAppPath(app) {
    if (app.type === 'react') {
        return app.path;
    }
    const src = encodeURIComponent(app.src || '');
    const title = encodeURIComponent(app.name || '');
    return `/app-view?src=${src}&title=${title}`;
}

export const getCustomApps = () => {
    try {
        return JSON.parse(localStorage.getItem('custom_installed_apps')) || [];
    } catch {
        return [];
    }
};
