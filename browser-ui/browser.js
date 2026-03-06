const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const btnBack = document.getElementById('btn-back');
    const btnForward = document.getElementById('btn-forward');
    const btnReload = document.getElementById('btn-reload');
    const btnHome = document.getElementById('btn-home');
    const btnBookmark = document.getElementById('btn-bookmark');

    const tabsContainer = document.getElementById('tabs-container');
    const webviewsContainer = document.getElementById('webviews-container');
    const btnNewTab = document.getElementById('btn-new-tab');

    // Modal elements
    const modalOverlay = document.getElementById('modal-overlay');
    const btnHistory = document.getElementById('btn-history');
    const btnBookmarksMenu = document.getElementById('btn-bookmarks-menu');
    const btnPasswords = document.getElementById('btn-passwords');
    const historyModal = document.getElementById('history-modal');
    const bookmarksModal = document.getElementById('bookmarks-modal');
    const passwordsModal = document.getElementById('passwords-modal');

    // Sidebar elements
    const globalSidebar = document.getElementById('global-sidebar');
    const btnSettingsSidebar = document.getElementById('btn-settings-sidebar');
    const btnCloseSidebar = document.getElementById('close-sidebar');

    let tabs = [];
    let currentTabId = null;
    let tabCounter = 0;

    // --- Sidebar Management ---
    btnSettingsSidebar.addEventListener('click', () => {
        globalSidebar.classList.toggle('open');
    });

    btnCloseSidebar.addEventListener('click', () => {
        globalSidebar.classList.remove('open');
    });

    const devToolsCheckbox = document.getElementById('setting-devtools');
    devToolsCheckbox.addEventListener('change', (e) => {
        // Toggle devtools for current tab natively if supported, else visual feedback
        if (currentTabId && e.target.checked) {
            invoke('open_devtools', { id: currentTabId }).catch(console.error);
        }
    });

    // --- Settings Management ---
    const searchEngineSelect = document.getElementById('setting-search-engine');
    const trackingCheckbox = document.getElementById('setting-tracking');
    const darkmodeCheckbox = document.getElementById('setting-darkmode');
    const wotCheckbox = document.getElementById('setting-wot-script-blocker');
    const btnClearData = document.getElementById('btn-clear-data');

    // Load saved settings
    if (localStorage.getItem('setting_search_engine')) searchEngineSelect.value = localStorage.getItem('setting_search_engine');
    if (localStorage.getItem('setting_tracking') !== null) trackingCheckbox.checked = localStorage.getItem('setting_tracking') === 'true';
    if (localStorage.getItem('setting_darkmode') !== null) darkmodeCheckbox.checked = localStorage.getItem('setting_darkmode') === 'true';
    if (localStorage.getItem('setting_wot') !== null) wotCheckbox.checked = localStorage.getItem('setting_wot') === 'true';
    
    searchEngineSelect.addEventListener('change', (e) => localStorage.setItem('setting_search_engine', e.target.value));
    trackingCheckbox.addEventListener('change', (e) => localStorage.setItem('setting_tracking', e.target.checked));
    
    darkmodeCheckbox.addEventListener('change', (e) => {
        localStorage.setItem('setting_darkmode', e.target.checked);
        if (e.target.checked) {
            document.documentElement.style.setProperty('--bg-color', '#0f172a');
            document.documentElement.style.setProperty('--header-bg', '#1e293b');
        } else {
            document.documentElement.style.setProperty('--bg-color', '#f8fafc');
            document.documentElement.style.setProperty('--header-bg', '#e2e8f0');
        }
    });
    
    wotCheckbox.addEventListener('change', (e) => {
        localStorage.setItem('setting_wot', e.target.checked);
        if (e.target.checked && currentTabId) injectBlockScript(currentTabId);
    });

    btnClearData.addEventListener('click', () => {
        if(confirm("Clear browsing data? This resets history and passwords.")) {
            setStoredData('browser_history', '[]');
            setStoredData('browser_passwords', '[]');
            setStoredData('browser_bookmarks', '[]');
            alert("Data cleared.");
        }
    });

    function injectBlockScript(id) {
        if (localStorage.getItem('setting_wot') !== 'true') return;
        const blockJs = `
            if (!window.__WOT_INJECTED) {
                window.__WOT_INJECTED = true;
                const _createElement = document.createElement.bind(document);
                document.createElement = function(tagName, options) {
                    const el = _createElement(tagName, options);
                    if (tagName && tagName.toLowerCase() === 'script') {
                        let originalSrc = '';
                        Object.defineProperty(el, 'src', {
                            set: function(val) {
                                const blockedDomains = ['analytics', 'tracker', 'adserver', 'doubleclick', 'telemetry'];
                                if (val && blockedDomains.some(domain => val.toLowerCase().includes(domain))) {
                                    console.warn('WOT Blocked Script:', val);
                                    originalSrc = ''; // Prevent loading
                                } else {
                                    originalSrc = val;
                                    el.setAttribute('src', val);
                                }
                            },
                            get: function() { return originalSrc; }
                        });
                    }
                    return el;
                };
            }
        `;
        invoke('evaluate_js', { id, js: blockJs }).catch(console.error);
    }

    // --- Tab Management ---

    async function createNewTab(url = 'desktop/desktop.html', makeActive = true) {
        tabCounter++;
        const id = `tab-${tabCounter}`;

        // Create Tab UI
        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        tabEl.id = `ui-${id}`;

        const titleEl = document.createElement('span');
        titleEl.className = 'tab-title';
        titleEl.innerText = 'New Tab';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';

        tabEl.appendChild(titleEl);
        tabEl.appendChild(closeBtn);
        tabsContainer.appendChild(tabEl);

        const rect = getWebviewRect();

        // Invoke Rust to create the native webview
        try {
            await invoke('create_tab', { id, url, rect });
        } catch (e) {
            console.error("Failed to create native tab", e);
        }

        const tabData = { id, title: 'New Tab', url, tabEl, titleEl };
        tabs.push(tabData);

        // Event Listeners for Tab
        tabEl.addEventListener('click', (e) => {
            if (e.target !== closeBtn && e.target.parentNode !== closeBtn) {
                switchTab(id);
            }
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(id);
        });

        if (makeActive) {
            switchTab(id);
        }
    }

    async function switchTab(id) {
        currentTabId = id;

        const allIds = tabs.map(t => t.id);
        try {
            await invoke('switch_tab', { activeId: id, allIds });
        } catch (e) {
            console.error("Failed to switch native tab", e);
        }

        tabs.forEach(tab => {
            if (tab.id === id) {
                tab.tabEl.classList.add('active');
                updateUrlBar(tab.url);
                checkIfBookmarked(tab.url);
            } else {
                tab.tabEl.classList.remove('active');
            }
        });
    }

    async function closeTab(id) {
        const tabIndex = tabs.findIndex(t => t.id === id);
        if (tabIndex === -1) return;

        const tab = tabs[tabIndex];
        tab.tabEl.remove();

        try {
            await invoke('close_tab', { id });
        } catch (e) {
            console.error("Failed to close native tab", e);
        }

        tabs.splice(tabIndex, 1);

        if (tabs.length === 0) {
            createNewTab();
        } else if (currentTabId === id) {
            const newIndex = Math.max(0, tabIndex - 1);
            switchTab(tabs[newIndex].id);
        }
    }

    // --- Layout Sync ---

    function getWebviewRect() {
        const bounds = webviewsContainer.getBoundingClientRect();
        return {
            x: Math.round(bounds.left),
            y: Math.round(bounds.top),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height)
        };
    }

    // Sync native webviews on resize
    const resizeObserver = new ResizeObserver(() => {
        const rect = getWebviewRect();
        const ids = tabs.map(t => t.id);
        if (ids.length > 0) {
            invoke('resize_tabs', { ids, rect }).catch(console.error);
        }
    });
    resizeObserver.observe(webviewsContainer);

    // Listen for events from Rust (sent by all webviews)
    listen('open-new-tab', (event) => {
        const url = event.payload;
        createNewTab(url, true);
    });

    listen('webview-url-changed', (event) => {
        const [id, url] = event.payload;
        const tab = tabs.find(t => t.id === id);
        if (tab) {
            tab.url = url;
            saveHistory(url, tab.title);
            if (id === currentTabId) {
                updateUrlBar(url);
                checkIfBookmarked(url);
            }
            autoFillPasswords(id, url);
            injectBlockScript(id);
        }
    });

    listen('webview-title-changed', (event) => {
        const [id, title] = event.payload;
        const tab = tabs.find(t => t.id === id);
        if (tab) {
            tab.title = title;
            tab.titleEl.innerText = title;
            saveHistory(tab.url, title);
        }
    });

    // --- Passwords and Autofill ---
    async function autoFillPasswords(id, url) {
        try {
            let domain = "";
            try { domain = new URL(url).hostname; } catch (e) { }
            if (!domain) return;

            const data = await getStoredData();
            if (data['browser_passwords']) {
                const passes = JSON.parse(data['browser_passwords']);
                const match = passes.find(p => p.site === domain || p.site.includes(domain) || domain.includes(p.site));
                if (match) {
                    const js = `
                        (function() {
                            const userFields = document.querySelectorAll('input[type="text"], input[type="email"], input[name*="user"], input[id*="user"]');
                            const passFields = document.querySelectorAll('input[type="password"]');
                            if (userFields.length > 0 && passFields.length > 0) {
                                userFields[0].value = "${match.username.replace(/"/g, '\\"')}";
                                passFields[0].value = "${match.password.replace(/"/g, '\\"')}";
                                userFields[0].dispatchEvent(new Event('input', { bubbles: true }));
                                passFields[0].dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        })();
                    `;
                    invoke('evaluate_js', { id, js }).catch(console.error);
                }
            }
        } catch (e) {
            console.error('Autofill failed', e);
        }
    }

    // --- Data Persistence ---
    async function getStoredData() {
        try {
            return await invoke('read_data');
        } catch (e) {
            console.warn("Could not invoke read_data", e);
            return {};
        }
    }

    async function setStoredData(key, value) {
        try {
            await invoke('write_data', { key, value });
        } catch (e) {
            console.warn("Could not invoke write_data", e);
        }
    }

    // --- Navigation Controls ---

    btnNewTab.addEventListener('click', () => createNewTab());

    function navigateTo(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                const searchEngine = localStorage.getItem('setting_search_engine') || 'google';
                if (searchEngine === 'duckduckgo') {
                    url = 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
                } else {
                    url = 'https://google.com/search?q=' + encodeURIComponent(url);
                }
            }
        }

        const tab = tabs.find(t => t.id === currentTabId);
        if (tab) {
            tab.url = url;
            tab.titleEl.innerText = 'Loading...';
            invoke('navigate_tab', { id: tab.id, url }).catch(console.error);
            btnReload.innerHTML = '<i class="fas fa-times"></i>';
        }
    }

    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            navigateTo(urlInput.value.trim());
            urlInput.blur();
        }
    });

    btnBack.addEventListener('click', () => {
        if (currentTabId) invoke('go_back', { id: currentTabId }).catch(console.error);
    });
    btnForward.addEventListener('click', () => {
        if (currentTabId) invoke('go_forward', { id: currentTabId }).catch(console.error);
    });
    btnReload.addEventListener('click', () => {
        if (currentTabId) invoke('reload_tab', { id: currentTabId }).catch(console.error);
    });
    btnHome.addEventListener('click', () => {
        navigateTo('desktop/desktop.html');
    });

    function updateUrlBar(url) {
        urlInput.value = url;
        const sIcon = document.getElementById('security-icon');
        const isInternal = url.includes('/desktop/desktop.html') || url.startsWith('tauri://') || url.startsWith('http://tauri.localhost') || url.startsWith('http://localhost:8000') || url.startsWith('http://localhost:8080');

        if (url.startsWith('https://') || isInternal) {
            sIcon.className = 'fas fa-lock security-icon';
            sIcon.style.color = '#10b981';
        } else if (url.includes('/desktop/desktop.html')) {
            sIcon.className = 'fas fa-desktop security-icon';
            sIcon.style.color = '#3b82f6';
        } else {
            sIcon.className = 'fas fa-lock-open security-icon';
            sIcon.style.color = '#ef4444';
        }
    }



    // --- History API ---
    async function saveHistory(url, title) {
        if (url.startsWith('devtools://')) return; // Ignore devtools

        try {
            const data = await getStoredData();
            let history = [];
            if (data['browser_history']) {
                history = JSON.parse(data['browser_history']);
            }

            // Only add if it's different from the very last to prevent spam
            if (history.length > 0 && history[0].url === url) return;

            history.unshift({
                url,
                title,
                timestamp: new Date().toISOString()
            });

            if (history.length > 500) history = history.slice(0, 500);

            await setStoredData('browser_history', JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save history', e);
        }
    }

    async function loadHistory() {
        const container = document.getElementById('history-list');
        container.innerHTML = '<div class="loading">Loading...</div>';
        try {
            const data = await getStoredData();
            if (!data['browser_history']) {
                container.innerHTML = '<div>No history yet.</div>';
                return;
            }

            const history = JSON.parse(data['browser_history']);
            if (history.length === 0) {
                container.innerHTML = '<div>No history yet.</div>';
                return;
            }

            container.innerHTML = history.map(item => `
                <div class="list-item" onclick="document.getElementById('url-input').value='${item.url}'; document.getElementById('url-input').dispatchEvent(new KeyboardEvent('keydown', {'key':'Enter'})); closeModals();">
                    <div class="list-title">${item.title}</div>
                    <div class="list-url">${item.url}</div>
                    <div style="font-size:10px; color:#64748b;">${new Date(item.timestamp).toLocaleString()}</div>
                </div>
            `).join('');

        } catch (e) {
            console.error(e);
            container.innerHTML = '<div>Failed to load history.</div>';
        }
    }

    // --- Bookmarks API ---
    let currentBookmarks = [];

    async function fetchBookmarks() {
        try {
            const data = await getStoredData();
            if (data['browser_bookmarks']) {
                currentBookmarks = JSON.parse(data['browser_bookmarks']);
            } else {
                currentBookmarks = [];
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function saveBookmarks() {
        try {
            await setStoredData('browser_bookmarks', JSON.stringify(currentBookmarks));
        } catch (e) { }
    }

    async function checkIfBookmarked(url) {
        await fetchBookmarks();
        const exists = currentBookmarks.some(b => b.url === url);
        if (exists) {
            btnBookmark.classList.add('bookmarked');
            btnBookmark.innerHTML = '<i class="fas fa-star"></i>';
        } else {
            btnBookmark.classList.remove('bookmarked');
            btnBookmark.innerHTML = '<i class="far fa-star"></i>';
        }
    }

    btnBookmark.addEventListener('click', async () => {
        const tab = tabs.find(t => t.id === currentTabId);
        if (!tab) return;

        const url = tab.url;
        const title = tab.title;

        await fetchBookmarks();
        const index = currentBookmarks.findIndex(b => b.url === url);

        if (index >= 0) {
            currentBookmarks.splice(index, 1);
            btnBookmark.classList.remove('bookmarked');
            btnBookmark.innerHTML = '<i class="far fa-star"></i>';
        } else {
            try {
                let domain = "";
                try { domain = new URL(url).hostname.replace('www.', ''); } catch (e) { }
                let category = "General";
                if (domain.includes('google') || domain.includes('github') || domain.includes('stackoverflow')) category = "Tech";
                else if (domain.includes('news') || domain.includes('nyt')) category = "News";

                currentBookmarks.unshift({ url, title, category, timestamp: new Date().toISOString() });
                btnBookmark.classList.add('bookmarked');
                btnBookmark.innerHTML = '<i class="fas fa-star"></i>';
            } catch (e) { }
        }
        await saveBookmarks();
    });

    async function loadBookmarksUI() {
        const container = document.getElementById('bookmarks-list');
        await fetchBookmarks();

        if (currentBookmarks.length === 0) {
            container.innerHTML = '<div>No bookmarks yet.</div>';
            return;
        }

        const grouped = {};
        currentBookmarks.forEach(b => {
            if (!grouped[b.category]) grouped[b.category] = [];
            grouped[b.category].push(b);
        });

        let html = '';
        for (const cat in grouped) {
            html += `<h3 style="margin: 10px 0 5px 0; font-size:13px; color:#94a3b8;">${cat}</h3>`;
            html += grouped[cat].map(item => `
                <div class="list-item" onclick="document.getElementById('url-input').value='${item.url}'; document.getElementById('url-input').dispatchEvent(new KeyboardEvent('keydown', {'key':'Enter'})); closeModals();">
                    <div class="list-title"><i class="fas fa-bookmark" style="margin-right:5px; color:#eab308;"></i> ${item.title}</div>
                    <div class="list-url">${item.url}</div>
                </div>
            `).join('');
        }
        container.innerHTML = html;
    }

    // --- Passwords API ---
    async function loadPasswords() {
        const container = document.getElementById('passwords-list');
        container.innerHTML = '<div class="loading">Loading...</div>';
        try {
            const data = await getStoredData();

            if (!data['browser_passwords']) {
                container.innerHTML = '<div>No saved passwords.</div>';
                return;
            }

            const passes = JSON.parse(data['browser_passwords']);
            if (passes.length === 0) {
                container.innerHTML = '<div>No saved passwords.</div>';
                return;
            }

            container.innerHTML = passes.map(item => `
                <div class="list-item" style="cursor:default;">
                    <div class="list-title"><i class="fas fa-lock" style="margin-right:5px;"></i> ${item.site}</div>
                    <div class="list-url">User: ${item.username}</div>
                    <div class="list-url">Pass: <span style="background:#334155; padding:2px 4px; border-radius:3px;">${'*'.repeat(item.password.length)}</span></div>
                </div>
            `).join('');

        } catch (e) {
            console.error(e);
            container.innerHTML = '<div>Failed to load passwords.</div>';
        }
    }

    document.getElementById('btn-save-password').addEventListener('click', async () => {
        const site = document.getElementById('pass-site').value;
        const username = document.getElementById('pass-user').value;
        const password = document.getElementById('pass-pass').value;

        if (!site || !username || !password) return alert("Fill all fields");

        try {
            const data = await getStoredData();
            let passes = data['browser_passwords'] ? JSON.parse(data['browser_passwords']) : [];

            passes.push({ site, username, password });
            await setStoredData('browser_passwords', JSON.stringify(passes));

            document.getElementById('pass-site').value = '';
            document.getElementById('pass-user').value = '';
            document.getElementById('pass-pass').value = '';
            loadPasswords();

        } catch (e) {
            console.error(e);
            alert("Failed to save password");
        }
    });

    // --- Modal Management ---
    const allModals = [historyModal, bookmarksModal, passwordsModal];

    function closeModals() {
        allModals.forEach(m => m.classList.add('hidden'));
        modalOverlay.classList.add('hidden');
    }

    function openModal(modal) {
        closeModals();
        modalOverlay.classList.remove('hidden');
        modal.classList.remove('hidden');
    }

    btnHistory.addEventListener('click', () => { openModal(historyModal); loadHistory(); });
    btnBookmarksMenu.addEventListener('click', () => { openModal(bookmarksModal); loadBookmarksUI(); });
    btnPasswords.addEventListener('click', () => {
        openModal(passwordsModal);
        try {
            const tab = tabs.find(t => t.id === currentTabId);
            if (tab) {
                const domain = new URL(tab.url).hostname;
                document.getElementById('pass-site').value = domain;
            }
        } catch (e) { }
        loadPasswords();
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModals();
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // --- Initialize ---
    createNewTab(); // Automatically open first tab pointing to desktop
});
