/**
 * UltraSudo — Dashboard Controller
 * Handles auth, chat UI, app launching, and sidebar interactions
 */

// ─── Supabase Init ──────────────────────────────────────────────
const SUPABASE_URL = "https://kxvkklltpvlgglqqnjpl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmtrbGx0cHZsZ2dscXFuanBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzAzMjIsImV4cCI6MjA4NzUwNjMyMn0.SBOUFz_yX8aClroTuQhwIjP-YhEcxtfZTo1mEW1Jpmc";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── App Registry ───────────────────────────────────────────────
const APPS = [
    // 📋 Productivity & Business
    { id: 'notebook',          name: 'Notebook',          category: 'productivity', icon: 'fa-book-bookmark',  color: 'linear-gradient(135deg, #7C3AED, #3B82F6)', url: '/app/notebook' },
    { id: 'markdown-editor',   name: 'Markdown Editor',   category: 'productivity', icon: 'fa-file-lines',     color: 'linear-gradient(135deg, #3B82F6, #1E40AF)', url: '/app/markdown-editor' },
    { id: 'invoice-generator', name: 'Invoice Generator', category: 'productivity', icon: 'fa-file-invoice-dollar', color: 'linear-gradient(135deg, #10B981, #059669)', url: 'invoice-generator/index.html' },
    { id: 'quote-generator',   name: 'Quote Generator',   category: 'productivity', icon: 'fa-quote-left',     color: 'linear-gradient(135deg, #3B82F6, #06B6D4)', url: '/app/quote-generator' },
    { id: 'spreadsheet-app',   name: 'Spreadsheets',      category: 'productivity', icon: 'fa-table',          color: 'linear-gradient(135deg, #059669, #10B981)', url: '/app/spreadsheet' },
    { id: 'kanban',            name: 'Kanban Board',      category: 'productivity', icon: 'fa-columns',        color: 'linear-gradient(135deg, #6366F1, #4F46E5)', url: '/app/kanban-board' },
    { id: 'todo-list',         name: 'To-Do List',        category: 'productivity', icon: 'fa-list-check',     color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', url: '/app/todo-list' },
    { id: 'calendar',          name: 'Calendar',          category: 'productivity', icon: 'fa-calendar-days',  color: 'linear-gradient(135deg, #3B82F6, #06B6D4)', url: 'calendar/calendar.html' },
    { id: 'timer',             name: 'Timer',             category: 'productivity', icon: 'fa-stopwatch',      color: 'linear-gradient(135deg, #F59E0B, #D97706)', url: '/app/timer' },
    { id: 'pomodoro-timer',    name: 'Pomodoro Timer',    category: 'productivity', icon: 'fa-hourglass-half', color: 'linear-gradient(135deg, #EF4444, #DC2626)', url: '/app/pomodoro-timer' },

    // 💻 Development & Engineering
    { id: 'python-ide',        name: 'Data Science IDE',  category: 'developer',    icon: 'fa-flask-vial',     color: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', url: 'python-IDE/index.html' },
    { id: 'code-generator',    name: 'Code Generator',    category: 'developer',    icon: 'fa-code',           color: 'linear-gradient(135deg, #7C3AED, #6D28D9)', url: 'code-generator/code-generator.html' },
    { id: 'mermaid-editor',    name: 'Mermaid Diagrams',  category: 'developer',    icon: 'fa-diagram-project',color: 'linear-gradient(135deg, #06B6D4, #0891B2)', url: 'mermaid-editor/mermaid-live-editor.html' },
    { id: 'patent-researcher', name: 'Patent Researcher', category: 'developer',    icon: 'fa-lightbulb',      color: 'linear-gradient(135deg, #F59E0B, #B45309)', url: 'patent-researcher/index.html' },
    { id: 'openfang',          name: 'OpenFang AI Hub',   category: 'developer',    icon: 'fa-robot',          color: 'linear-gradient(135deg, #8B5CF6, #4C1D95)', url: 'openfang/index.html' },

    // 📈 Finance & Commerce
    { id: 'investment-board',  name: 'Investments',       category: 'finance',      icon: 'fa-chart-line',     color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', url: 'investment-board/investment-board.html' },
    { id: 'stock-screener',    name: 'Stock Screener',    category: 'finance',      icon: 'fa-search-dollar',  color: 'linear-gradient(135deg, #10B981, #047857)', url: 'stock-screener/index.html' },
    { id: 'stock-ticker',      name: 'Stock Ticker',      category: 'finance',      icon: 'fa-arrow-trend-up', color: 'linear-gradient(135deg, #06B6D4, #0E7490)', url: 'stock-ticker/stock-ticker.html' },
    { id: 'portfolio-manager', name: 'Portfolio Manager', category: 'finance',      icon: 'fa-briefcase',      color: 'linear-gradient(135deg, #6366F1, #4338CA)', url: '/app/finance' },
    { id: 'send-money',        name: 'Send Money P2P',    category: 'finance',      icon: 'fa-paper-plane',    color: 'linear-gradient(135deg, #3B82F6, #2563EB)', url: '/app/finance' },
    { id: 'currency-converter',name: 'Currency Converter',category: 'finance',      icon: 'fa-coins',          color: 'linear-gradient(135deg, #14B8A6, #0D9488)', url: '/app/finance' },
    { id: 'financial-service', name: 'Financial Services',category: 'finance',      icon: 'fa-landmark',       color: 'linear-gradient(135deg, #F59E0B, #D97706)', url: '/app/finance' },

    // 🌿 Health & Lifestyle
    { id: 'home-diagnostics',  name: 'Home Diagnostics',  category: 'health',       icon: 'fa-stethoscope',    color: 'linear-gradient(135deg, #EF4444, #B91C1C)', url: '/app/health' },
    { id: 'yoga',              name: 'Yoga & Wellness',   category: 'health',       icon: 'fa-spa',            color: 'linear-gradient(135deg, #10B981, #059669)', url: '/app/health' },
    { id: 'healthy-kitchen',   name: 'Healthy Kitchen',   category: 'health',       icon: 'fa-utensils',       color: 'linear-gradient(135deg, #EC4899, #DB2777)', url: '/app/health' },
    { id: 'grocery',            name: 'Grocery List',      category: 'health',       icon: 'fa-cart-shopping',  color: 'linear-gradient(135deg, #F59E0B, #D97706)', url: '/app/grocery' },
    { id: 'life-board',        name: 'Life Board',        category: 'health',       icon: 'fa-heart-pulse',    color: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', url: 'life-board/life-board.html' },
    { id: 'weather',           name: 'Weather App',       category: 'health',       icon: 'fa-cloud-sun',      color: 'linear-gradient(135deg, #06B6D4, #0284C7)', url: 'weather/weather-dashboard.html' },
    { id: 'birthday-card',     name: 'Birthday Cards',    category: 'health',       icon: 'fa-gift',           color: 'linear-gradient(135deg, #F43F5E, #E11D48)', url: '/app/birthday-card' },

    // 🎨 Media & Utilities
    { id: 'photo-editor',      name: 'Photo Studio',      category: 'media',        icon: 'fa-image',          color: 'linear-gradient(135deg, #EC4899, #8B5CF6)', url: 'photo-editor/index.html' },
    { id: 'calculator',        name: 'Calculator',        category: 'media',        icon: 'fa-calculator',     color: 'linear-gradient(135deg, #6366F1, #4F46E5)', url: '/app/calculator' },
    { id: 'music',             name: 'Music Player',      category: 'media',        icon: 'fa-music',          color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', url: 'music/index.html' },
    { id: 'galactic-simulator',name: 'Galactic 3D Sim',   category: 'media',        icon: 'fa-rocket',         color: 'linear-gradient(135deg, #7C3AED, #4C1D95)', url: 'galactic-simulator/index.html' },
    { id: 'social-feed',       name: 'Social Feed',       category: 'media',        icon: 'fa-hashtag',        color: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', url: 'social-feed/index.html' },
    { id: 'p2p-calling',       name: 'P2P Audio/Video',   category: 'media',        icon: 'fa-phone-volume',   color: 'linear-gradient(135deg, #10B981, #047857)', url: 'p2p-calling/index.html' },
    { id: 'news',              name: 'News Feed',         category: 'media',        icon: 'fa-newspaper',      color: 'linear-gradient(135deg, #06B6D4, #0891B2)', url: 'news/news.html' },

    // 🛡️ System & Security
    { id: 'vault',             name: 'Secure Vault',      category: 'system',       icon: 'fa-vault',          color: 'linear-gradient(135deg, #EF4444, #DC2626)', url: '/app/secure-vault' },
    { id: 'pqc-education',     name: 'PQC Explorer',      category: 'system',       icon: 'fa-shield-halved',  color: 'linear-gradient(135deg, #7C3AED, #3B82F6)', url: 'pqc-education/index.html' },
    { id: 'api-key-manager',   name: 'API Key Manager',   category: 'system',       icon: 'fa-key',            color: 'linear-gradient(135deg, #F59E0B, #D97706)', url: 'api-key-manager/index.html' },
    { id: 'vpn',               name: 'VPN Manager',       category: 'system',       icon: 'fa-shield-virus',   color: 'linear-gradient(135deg, #10B981, #059669)', url: 'vpn/index.html' },
    { id: 'community',         name: 'Community Apps',    category: 'system',       icon: 'fa-users-viewfinder', color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', url: 'community/index.html' }
];

// ─── State ──────────────────────────────────────────────────────
let currentUser = null;

// ─── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupUI();
    setupChat();
    setupAgent();
});

// ─── Auth Guard ─────────────────────────────────────────────────
async function checkAuth() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (!session || error) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = session.user;
    updateUserUI(currentUser);
}

function updateUserUI(user) {
    const email = user.email || 'User';
    const initial = email.charAt(0).toUpperCase();

    document.getElementById('user-email').textContent = email;
    document.getElementById('user-avatar').textContent = initial;
}

// ─── UI Setup ───────────────────────────────────────────────────
function setupUI() {
    // Sidebar toggle
    document.getElementById('sidebar-toggle-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });

    // User dropdown toggle
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');

    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    // Populate sidebar apps grouped by categories
    renderSidebarApps();

    // App Search Input Filtering
    const appSearchInput = document.getElementById('app-search-input');
    if (appSearchInput) {
        appSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            renderSidebarApps(query);
        });
    }

    // Populate quick apps grid (top featured apps)
    const quickAppsGrid = document.getElementById('quick-apps-grid');
    if (quickAppsGrid) {
        quickAppsGrid.innerHTML = '';
        // Featured quick apps
        const featuredIds = ['notebook', 'python-ide', 'invoice-generator', 'photo-editor', 'stock-screener', 'vault', 'home-diagnostics', 'kanban', 'calculator'];
        const featuredApps = APPS.filter(a => featuredIds.includes(a.id));

        featuredApps.forEach(app => {
            const card = document.createElement('div');
            card.className = 'quick-app';
            card.innerHTML = `
                <div class="quick-app-icon" style="background: ${app.color}"><i class="fas ${app.icon}"></i></div>
                <div class="quick-app-name">${app.name}</div>
            `;
            card.addEventListener('click', () => openApp(app.id));
            quickAppsGrid.appendChild(card);
        });
    }

    // App slide-over close
    document.getElementById('app-slideover-close').addEventListener('click', closeApp);

    // API key modal
    document.getElementById('save-api-key-btn').addEventListener('click', saveApiKey);

    // Load existing API key into input
    const existingKey = getApiKey();
    if (existingKey) {
        document.getElementById('api-key-input').value = existingKey;
    }
}

// ─── Render Sidebar Apps by Category ──────────────────────────────
function renderSidebarApps(filterQuery = '') {
    const sidebarAppsNav = document.getElementById('sidebar-apps-nav');
    if (!sidebarAppsNav) return;

    sidebarAppsNav.innerHTML = '';

    const categoryLabels = {
        productivity: { title: 'Productivity', icon: 'fa-briefcase' },
        developer:    { title: 'Development',   icon: 'fa-code' },
        finance:      { title: 'Finance',       icon: 'fa-chart-line' },
        health:       { title: 'Health & Life', icon: 'fa-heart-pulse' },
        media:        { title: 'Media & Tools', icon: 'fa-icons' },
        system:       { title: 'System & Security', icon: 'fa-shield-halved' }
    };

    const categories = ['productivity', 'developer', 'finance', 'health', 'media', 'system'];

    categories.forEach(catKey => {
        const catApps = APPS.filter(app => app.category === catKey &&
            (app.name.toLowerCase().includes(filterQuery) || app.id.includes(filterQuery))
        );

        if (catApps.length > 0) {
            const catHeader = document.createElement('div');
            catHeader.className = 'sidebar-cat-title';
            catHeader.innerHTML = `<i class="fas ${categoryLabels[catKey].icon}"></i> ${categoryLabels[catKey].title}`;
            sidebarAppsNav.appendChild(catHeader);

            catApps.forEach(app => {
                const btn = document.createElement('button');
                btn.className = 'sidebar-item';
                btn.title = app.name;
                btn.innerHTML = `<i class="fas ${app.icon}"></i> <span>${app.name}</span>`;
                btn.addEventListener('click', () => openApp(app.id));
                sidebarAppsNav.appendChild(btn);
            });
        }
    });
}

// ─── Chat Setup ─────────────────────────────────────────────────
function setupChat() {
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');

    // Send on Enter (Shift+Enter for newline)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Send button
    chatSendBtn.addEventListener('click', sendMessage);

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Suggested prompts
    document.querySelectorAll('.suggested-prompt').forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.dataset.prompt;
            sendMessage();
        });
    });
}

// ─── Agent Setup ────────────────────────────────────────────────
function setupAgent() {
    ultrasudoAgent.onFunctionCall = async (name, args) => {
        switch (name) {
            case 'open_app':
                return openApp(args.app_name);

            case 'check_security':
                return {
                    privacy_score: 85,
                    trackers_blocked: 247,
                    connection: 'Secure (TLS 1.3)',
                    vault_entries: 12,
                    breaches_found: 0,
                    last_scan: new Date().toISOString()
                };

            case 'convert_currency':
                // Simple mock conversion (in production, call a real API)
                const rates = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, INR: 83.2, CAD: 1.36, AUD: 1.53 };
                const fromRate = rates[args.from_currency?.toUpperCase()] || 1;
                const toRate = rates[args.to_currency?.toUpperCase()] || 1;
                const result = (args.amount / fromRate) * toRate;
                return {
                    amount: args.amount,
                    from: args.from_currency,
                    to: args.to_currency,
                    result: Math.round(result * 100) / 100,
                    rate: Math.round((toRate / fromRate) * 10000) / 10000
                };

            case 'calculate':
                try {
                    // Safe math evaluation (replace common functions)
                    let expr = args.expression
                        .replace(/sqrt/gi, 'Math.sqrt')
                        .replace(/pow/gi, 'Math.pow')
                        .replace(/abs/gi, 'Math.abs')
                        .replace(/pi/gi, 'Math.PI')
                        .replace(/(\d+)%\s*of\s*(\d+)/gi, '($1/100)*$2')
                        .replace(/%/g, '/100');
                    const calcResult = Function('"use strict"; return (' + expr + ')')();
                    return { expression: args.expression, result: calcResult };
                } catch (e) {
                    return { expression: args.expression, error: 'Could not evaluate expression' };
                }

            case 'take_note':
            case 'open_notebook':
                openApp('notebook');
                return { created: true, title: args.title || 'New Note', message: 'Notebook opened', action: 'opened_notebook' };

            case 'create_invoice':
            case 'open_invoice_generator':
                openApp('invoice-generator');
                return { created: true, client: args.client_name || 'Client', items: args.items || [], message: 'Invoice Generator opened', action: 'opened_invoice_generator' };

            case 'generate_quote':
            case 'open_quote_generator':
                openApp('quote-generator');
                return { created: true, client: args.client_name || 'Client', items: args.items || [], message: 'Quote Generator opened', action: 'opened_quote_generator' };

            case 'edit_photo':
            case 'open_photo_editor':
                openApp('photo-editor');
                return { action: 'opened_photo_editor', message: 'Photo Studio opened' };

            case 'create_note':
                openApp('notebook');
                return { created: true, title: args.title, content: args.content || '', timestamp: new Date().toISOString() };

            case 'search_news':
                // In production, this would call a news API
                return { query: args.query, message: 'Opening news feed with your search...', action: 'opened_news' };

            default:
                return { error: `Unknown function: ${name}` };
        }
    };
}

// ─── Chat Messaging ─────────────────────────────────────────────
let isProcessing = false;

async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();

    if (!message || isProcessing) return;

    isProcessing = true;
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Hide welcome state
    const welcome = document.getElementById('chat-welcome');
    if (welcome) welcome.style.display = 'none';

    // Add user message to UI
    appendMessage('user', message);

    // Show typing indicator
    showTyping(true);

    try {
        const response = await ultrasudoAgent.chat(message);
        showTyping(false);

        if (response.text) {
            appendMessage('ai', response.text);
        }
    } catch (error) {
        showTyping(false);
        appendMessage('ai', '⚠️ Something went wrong. Please try again.');
        console.error('[Dashboard] Chat error:', error);
    }

    isProcessing = false;
    document.getElementById('chat-send-btn').disabled = false;
}

function appendMessage(role, text) {
    const container = document.getElementById('chat-container');

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;

    const avatarContent = role === 'ai' ? '<i class="fas fa-bolt"></i>' : (currentUser?.email?.charAt(0).toUpperCase() || 'U');

    msgDiv.innerHTML = `
        <div class="chat-message-avatar">${avatarContent}</div>
        <div class="chat-message-content">${formatMarkdown(text)}</div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function formatMarkdown(text) {
    // Basic markdown rendering
    return text
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #A78BFA;">$1</a>')
        // Line breaks
        .replace(/\n/g, '<br>');
}

function showTyping(show) {
    document.getElementById('typing-indicator').classList.toggle('active', show);
    document.getElementById('chat-send-btn').disabled = show;
}

// ─── App Launcher ───────────────────────────────────────────────
function openApp(appId) {
    // Normalize app ID
    const normalizedId = appId.toLowerCase().replace(/\s+/g, '-');
    const app = APPS.find(a => a.id === normalizedId || a.name.toLowerCase().replace(/\s+/g, '-') === normalizedId || a.name.toLowerCase() === appId.toLowerCase());

    if (!app) {
        return { error: `App "${appId}" not found`, available_apps: APPS.map(a => a.name) };
    }

    if (app.url.startsWith('/app/') || app.url.startsWith('/desktop')) {
        window.location.href = app.url;
        return { opened: true, app: app.name, url: app.url };
    }

    const slideover = document.getElementById('app-slideover');
    document.getElementById('app-slideover-title').textContent = app.name;
    document.getElementById('app-slideover-iframe').src = app.url;
    slideover.classList.add('active');

    return { opened: true, app: app.name, url: app.url };
}

function closeApp() {
    const slideover = document.getElementById('app-slideover');
    slideover.classList.remove('active');
    document.getElementById('app-slideover-iframe').src = '';
}

// ─── API Key Modal ──────────────────────────────────────────────
function openApiKeyModal() {
    document.getElementById('api-key-modal').classList.add('active');
    const existingKey = getApiKey();
    if (existingKey) {
        document.getElementById('api-key-input').value = existingKey;
    }
}

function closeApiKeyModal() {
    document.getElementById('api-key-modal').classList.remove('active');
}

function saveApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (key) {
        setApiKey(key);
        closeApiKeyModal();
        // Clear chat history to start fresh with new key
        ultrasudoAgent.clearHistory();
        // Reset chat UI
        const container = document.getElementById('chat-container');
        container.innerHTML = '';
        const welcome = document.getElementById('chat-welcome');
        if (!welcome) {
            // Re-create welcome state
            container.innerHTML = `
                <div class="chat-welcome" id="chat-welcome">
                    <div class="chat-welcome-icon"><i class="fas fa-bolt"></i></div>
                    <h2>API Key Saved! ✅</h2>
                    <p>Your AI agent is ready. Try asking me something!</p>
                </div>
            `;
        }
    }
}

// Close API key modal on overlay click
document.getElementById('api-key-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeApiKeyModal();
});
