const TELEMETRY_SERVER = 'http://localhost:4000/ingest';

function logDesktopTelemetry(type, details) {
    if (!navigator.onLine) return;
    fetch(TELEMETRY_SERVER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ...details
        })
    }).catch(err => console.warn('Telemetry offline', err));
}

// Global Error Hooks for Desktop view
window.addEventListener('error', (event) => {
    logDesktopTelemetry('ERROR', {
        message: event.message,
        source: 'desktop.js',
        error: event.error ? event.error.stack : null
    });
});

window.addEventListener('unhandledrejection', (event) => {
    logDesktopTelemetry('ERROR', {
        message: 'Unhandled Promise Rejection',
        reason: event.reason ? event.reason.toString() : 'Unknown Reason'
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Check if setup complete
    if (!localStorage.getItem('ultrasudo_setup_complete')) {
        window.location.href = 'wizard.html';
        return;
    } else if (!localStorage.getItem('telemetry_install_logged')) {
        // Send initial install telemetry once
        logDesktopTelemetry('INSTALL', {
            os: navigator.userAgentData ? navigator.userAgentData.platform : 'Unknown OS',
            installedApps: JSON.parse(localStorage.getItem('enabled_apps') || '[]')
        });
        localStorage.setItem('telemetry_install_logged', 'true');
    }

    const searchBar = document.getElementById('search-bar');
    const appGrid = document.getElementById('app-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const widgetArea = document.getElementById('widget-area');
    const addWidgetBtn = document.getElementById('add-widget-btn');

    let currentType = 'all';
    let currentSearch = '';

    function renderAppIcons() {
        if (!window.appClassifier || !appGrid) {
            console.error('AppClassifier or appGrid not found');
            return;
        }

        const registry = window.appClassifier.appRegistry;
        appGrid.innerHTML = ''; // Clear existing icons

        const categorySelect = document.getElementById('app-category-select');
        const selectedCategory = categorySelect ? categorySelect.value : 'all';

        const savedEnabledApps = localStorage.getItem('enabled_apps');
        let enabledAppIds = savedEnabledApps ? JSON.parse(savedEnabledApps) : null;

        const filteredApps = Array.from(registry.values()).filter(app => {
            if (app.comingSoon) return false; // Exclude coming soon apps
            if (enabledAppIds && app.id !== 'desktop' && !enabledAppIds.includes(app.id)) return false;

            const typeOk = currentType === 'all' ? true : app.type === currentType;
            const categoryOk = selectedCategory === 'all' ? true : app.category === selectedCategory;
            const searchOk = !currentSearch || app.name.toLowerCase().includes(currentSearch.toLowerCase());
            return typeOk && categoryOk && searchOk;
        });

        filteredApps.forEach(app => {
            const iconLink = document.createElement('a');
            iconLink.href = 'javascript:void(0)';
            iconLink.onclick = () => {
                if (window.__TAURI__) {
                    window.__TAURI__.event.emit('open-new-tab', app.path);
                } else {
                    window.location.href = app.path;
                }
            };
            iconLink.className = 'app-icon';
            iconLink.dataset.name = app.name;

            const icon = document.createElement('i');
            icon.className = app.icon;

            const appName = document.createElement('span');
            appName.textContent = app.name;

            iconLink.appendChild(icon);
            iconLink.appendChild(appName);
            appGrid.appendChild(iconLink);
        });

        // Add network indicators after icons are in DOM
        if (window.appClassifier) {
            window.appClassifier.updateDesktopIcons();
        }
    }

    // Widgets Logic
    window.createWidget = function (app) {
        const widgetArea = document.getElementById('widget-area');
        if (!widgetArea) return;
        const emptyState = widgetArea.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.appId = app.id;

        const header = document.createElement('div');
        header.className = 'widget-header';
        header.innerHTML = `
            <span><i class="${app.icon}"></i> ${app.name}</span>
            <button class="widget-close" onclick="this.parentElement.parentElement.remove()">×</button>
        `;

        const content = document.createElement('div');
        content.className = 'widget-content';

        if (app.id === 'todo-list') {
            try {
                const todosStr = localStorage.getItem('db_todo_data') || '[]';
                const todosObj = JSON.parse(todosStr);
                const todos = Array.isArray(todosObj.value) ? todosObj.value : [];
                const today = new Date().toISOString().split('T')[0];
                const todayTasks = todos.filter(t => t.date === today && !t.completed);
                if (todayTasks.length > 0) {
                    content.innerHTML = `<b>Today's Tasks:</b><br>` + todayTasks.slice(0, 3).map(t => `<div style="margin-top:4px;">- ${t.text}</div>`).join('');
                    if (todayTasks.length > 3) content.innerHTML += `<div style="margin-top:4px; color:#94a3b8;">+ ${todayTasks.length - 3} more...</div>`;
                } else {
                    content.innerHTML = `No tasks for today! 🎉`;
                }
            } catch (e) {
                content.innerHTML = `No tasks for today! 🎉`;
            }
        } else if (app.id === 'weather') {
            content.innerHTML = `<div style="font-size: 16px;">28°C Sunny</div><div style="color:#94a3b8;">Bangalore</div>`;
        } else if (app.id === 'pomodoro-timer') {
            content.innerHTML = `<div style="text-align:center; font-size:18px;" id="widget-timer">25:00</div>
            <div style="text-align:center; margin-top:5px;"><button class="btn-small" style="background:#3b82f6;" onclick="window.startWidgetTimer()">Start</button></div>`;
        } else {
            content.innerHTML = `<div style="text-align:center; padding: 10px 0;"><a href="${app.path}" style="color:#6ee7b7; text-decoration:none;">Launch App</a></div>`;
        }

        widget.appendChild(header);
        widget.appendChild(content);
        widgetArea.appendChild(widget);
    };

    if (addWidgetBtn) {
        addWidgetBtn.addEventListener('click', () => {
            const registry = window.appClassifier ? window.appClassifier.appRegistry : new Map();
            const apps = Array.from(registry.values());
            if (apps.length === 0) return;

            const appsStr = apps.map((a, i) => `${i + 1}. ${a.name}`).join('\n');
            const selectedStr = prompt(`Select an app to add its widget (enter number):\n${appsStr}`);

            const selectedIndex = parseInt(selectedStr);
            if (!isNaN(selectedIndex) && selectedIndex > 0 && selectedIndex <= apps.length) {
                window.createWidget(apps[selectedIndex - 1]);
            }
        });
    }

    // Initialize Panels
    setTimeout(() => {
        window.newsPage = 0;
        window.newsPageSize = 20;
        if (window.fetchNews) window.fetchNews();
        if (window.fetchVideos) window.fetchVideos();

        const categorySelect = document.getElementById('app-category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                renderAppIcons();
            });
        }
    }, 500);

    const spotlightResults = document.getElementById('spotlight-results');

    if (searchBar) {
        // Global shortcut Cmd/Ctrl + Space
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
                e.preventDefault();
                searchBar.focus();
            }
        });

        searchBar.addEventListener('input', (e) => {
            currentSearch = e.target.value.trim();
            renderAppIcons();

            if (currentSearch.length > 0) {
                renderSpotlightResults(currentSearch);
            } else {
                if (spotlightResults) spotlightResults.style.display = 'none';
            }
        });

        // Hide when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== searchBar && e.target !== spotlightResults && (!spotlightResults || !spotlightResults.contains(e.target))) {
                if (spotlightResults) spotlightResults.style.display = 'none';
            }
        });
    }

    function renderSpotlightResults(query) {
        if (!spotlightResults) return;
        const q = query.toLowerCase();
        let matches = [];

        // 1. App Matches (Exact or Substring in name or description)
        if (window.appClassifier) {
            Array.from(window.appClassifier.appRegistry.values()).forEach(app => {
                if (app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q)) {
                    matches.push({
                        title: app.name,
                        meta: 'Application • ' + app.description,
                        icon: app.icon,
                        path: app.path
                    });
                }
            });
        }

        // 2. Data Manager Content across offline apps
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('db_')) {
                try {
                    const raw = localStorage.getItem(key);
                    const parsed = JSON.parse(raw);
                    let contentStr = '';
                    if (typeof parsed.value === 'string') contentStr = parsed.value;
                    else if (typeof parsed.value === 'object') contentStr = JSON.stringify(parsed.value);
                    else contentStr = String(parsed.value);

                    if (contentStr.toLowerCase().includes(q)) {
                        const parts = key.split('_');
                        const appType = parts[1] || 'Data';
                        let preview = contentStr.substring(0, 100).replace(/<\/?[^>]+(>|$)/g, ""); // strip html

                        // Avoid duplicates if app already found, but data is distinct
                        matches.push({
                            title: `Match in ${appType}`,
                            meta: preview,
                            icon: 'fas fa-database',
                            path: '#' // Deep-link to app state not yet implemented trivially
                        });
                    }
                } catch (e) { }
            }
        }

        if (matches.length === 0) {
            spotlightResults.innerHTML = '<div class="spotlight-item"><span class="spotlight-item-title">No results found for "' + query + '"</span></div>';
        } else {
            spotlightResults.innerHTML = matches.map(m => `
                <div class="spotlight-item" onclick="${m.path !== '#' ? `window.location.href='${m.path}'` : ''}">
                    <div class="spotlight-item-icon"><i class="${m.icon}"></i></div>
                    <div class="spotlight-item-details">
                        <span class="spotlight-item-title">${m.title}</span>
                        <span class="spotlight-item-meta">${m.meta.substring(0, 80)}...</span>
                    </div>
                </div>
            `).join('');
        }

        spotlightResults.style.display = 'block';
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.dataset.filter || 'all';
            renderAppIcons();
        });
    });

    // Wait for appClassifier to be ready
    function waitForAppClassifier(attempt = 0) {
        if (window.appClassifier) {
            renderAppIcons();
        } else if (attempt < 10) { // Try for up to 2 seconds (200ms * 10)
            setTimeout(() => waitForAppClassifier(attempt + 1), 200);
        } else {
            console.error('Failed to load app classifier');
        }
    }

    // Start the check
    waitForAppClassifier();

    // Wire up logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.logout) window.logout();
        });
    }

    // Request Notification Permissions for P2P Transfers
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
});

window.startWidgetTimer = function () {
    const display = document.getElementById('widget-timer');
    if (display) {
        let time = 25 * 60;
        const interval = setInterval(() => {
            const mins = Math.floor(time / 60);
            const secs = time % 60;
            display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            time--;
            if (time < 0) {
                clearInterval(interval);
                display.textContent = 'Time up!';
            }
        }, 1000);
    }
};

// --- News Panel Logic ---
// --- News Panel Logic & Live Intelligence ---
window.currentNewsItems = [];

async function fetchDesktopFeedRaw(feedUrl) {
    try {
        const directRes = await fetch(feedUrl, { headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, */*' } });
        if (directRes.ok) {
            const text = await directRes.text();
            if (text && (text.includes('<rss') || text.includes('<feed') || text.includes('<xml'))) return text;
        }
    } catch (e) { }

    try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const data = await res.json();
            if (data && data.contents) return data.contents;
        }
    } catch (e) { }

    try {
        const codeTabUrl = `https://api.codetab.org/v1/proxy?quest=${encodeURIComponent(feedUrl)}`;
        const res = await fetch(codeTabUrl);
        if (res.ok) {
            const text = await res.text();
            if (text && text.length > 20) return text;
        }
    } catch (e) { }

    throw new Error(`Could not fetch RSS feed from ${feedUrl}`);
}

function parseDesktopXmlFeed(xmlString, feedUrl) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, 'text/xml');
    
    let feedTitle = '';
    const channelTitle = xml.querySelector('channel > title, feed > title');
    if (channelTitle) feedTitle = channelTitle.textContent.trim();
    if (!feedTitle) {
        try { feedTitle = new URL(feedUrl).hostname.replace('www.', ''); } catch(e) { feedTitle = 'News Source'; }
    }

    const articles = [];

    // RSS 2.0
    const items = xml.querySelectorAll('item');
    if (items && items.length > 0) {
        items.forEach(item => {
            const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
            const link = item.querySelector('link')?.textContent?.trim() || '#';
            let description = item.querySelector('description')?.textContent || item.querySelector('content\\:encoded')?.textContent || '';
            
            let imageUrl = item.querySelector('media\\:content, content')?.getAttribute('url') ||
                           item.querySelector('enclosure[type^="image"]')?.getAttribute('url') || null;

            if (!imageUrl && description) {
                const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch) imageUrl = imgMatch[1];
            }

            const cleanSnippet = description.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
            const snippet = cleanSnippet.length > 140 ? cleanSnippet.substring(0, 140) + '...' : cleanSnippet;
            const rawDate = item.querySelector('pubDate')?.textContent || item.querySelector('dc\\:date')?.textContent || '';
            const pubDate = rawDate ? new Date(rawDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today';

            articles.push({
                title,
                link,
                snippet,
                imageUrl,
                sourceTitle: feedTitle,
                pubDate,
                timestamp: rawDate ? new Date(rawDate).getTime() : Date.now()
            });
        });
        return articles;
    }

    // Atom
    const entries = xml.querySelectorAll('entry');
    if (entries && entries.length > 0) {
        entries.forEach(entry => {
            const title = entry.querySelector('title')?.textContent?.trim() || 'Untitled';
            let link = entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || entry.querySelector('link')?.getAttribute('href') || '#';
            let description = entry.querySelector('summary')?.textContent || entry.querySelector('content')?.textContent || '';
            let imageUrl = entry.querySelector('media\\:content')?.getAttribute('url') || null;

            if (!imageUrl && description) {
                const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch) imageUrl = imgMatch[1];
            }

            const cleanSnippet = description.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
            const snippet = cleanSnippet.length > 140 ? cleanSnippet.substring(0, 140) + '...' : cleanSnippet;
            const rawDate = entry.querySelector('published')?.textContent || entry.querySelector('updated')?.textContent || '';
            const pubDate = rawDate ? new Date(rawDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today';

            articles.push({
                title,
                link,
                snippet,
                imageUrl,
                sourceTitle: feedTitle,
                pubDate,
                timestamp: rawDate ? new Date(rawDate).getTime() : Date.now()
            });
        });
    }

    return articles;
}

window.fetchNews = async function () {
    const categorySelect = document.getElementById('news-category-select');
    const countrySelect = document.getElementById('news-country-select');
    if (!categorySelect) return;

    const category = categorySelect.value;
    const country = countrySelect ? countrySelect.value : 'US';
    const container = document.getElementById('news-feed-container');
    container.innerHTML = '<div class="loading-state" style="padding:10px;"><i class="fas fa-circle-notch fa-spin"></i> Aggregating live RSS headlines & NLP sentiment...</div>';

    try {
        let urls = [];
        if (window.RSS_SOURCES && window.RSS_SOURCES[country] && window.RSS_SOURCES[country][category]) {
            urls = window.RSS_SOURCES[country][category];
        }

        if (urls.length === 0) {
            container.innerHTML = '<div class="empty-state">No feed sources found for this selection.</div>';
            return;
        }

        const fetchPromises = urls.map(async (url) => {
            try {
                const rawXml = await fetchDesktopFeedRaw(url);
                return parseDesktopXmlFeed(rawXml, url);
            } catch (e) {
                return [];
            }
        });

        const results = await Promise.allSettled(fetchPromises);
        let aggregated = [];

        results.forEach(res => {
            if (res.status === 'fulfilled' && Array.isArray(res.value)) {
                aggregated.push(...res.value);
            }
        });

        if (aggregated.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding:10px;">Failed to load live RSS items. Feeds may be temporarily offline.</div>';
            return;
        }

        // Deduplicate & sort
        const seen = new Set();
        const unique = aggregated.filter(item => {
            const k = item.title.toLowerCase().trim();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });

        unique.sort((a, b) => b.timestamp - a.timestamp);

        // Run Client-Side NLP Analysis
        window.currentNewsItems = unique.map(item => {
            if (window.NewsNLP) {
                return window.NewsNLP.analyzeArticle(item);
            }
            return item;
        });

        renderBreakingTicker();
        window.filterNews();
    } catch (e) {
        console.error('Desktop news fetch error:', e);
        container.innerHTML = '<div class="empty-state" style="padding:10px;">Error aggregating news feed.</div>';
    }
};

function renderBreakingTicker() {
    const track = document.getElementById('ticker-content-track');
    if (!track || !window.currentNewsItems || window.currentNewsItems.length === 0) return;

    const breakingItems = window.currentNewsItems.slice(0, 8);
    track.innerHTML = breakingItems.map(item => {
        const sentBadge = item.sentiment ? ` <span class="sentiment-badge ${item.sentiment.label.toLowerCase()}"><i class="fas ${item.sentiment.icon}"></i> ${item.sentiment.label}</span>` : '';
        const invokeLink = `if(window.__TAURI__) { window.__TAURI__.event.emit('open-new-tab', '${item.link}') } else { window.open('${item.link}','_blank') }`;
        return `<span class="ticker-item" onclick="${invokeLink}">${item.title}${sentBadge}</span>`;
    }).join(' • ');
}

window.filterNews = function () {
    const searchInput = document.getElementById('desktop-news-search');
    const sentimentSelect = document.getElementById('news-sentiment-select');
    const container = document.getElementById('news-feed-container');
    if (!container) return;

    if (!window.currentNewsItems || window.currentNewsItems.length === 0) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const targetSentiment = sentimentSelect ? sentimentSelect.value : 'ALL';

    const filtered = window.currentNewsItems.filter(item => {
        // Sentiment filter
        if (targetSentiment !== 'ALL' && item.sentiment && item.sentiment.label !== targetSentiment) {
            return false;
        }

        // Search query filter (matches title, snippet, entity text, or source)
        if (query) {
            const matchTitle = item.title.toLowerCase().includes(query);
            const matchSnippet = item.snippet && item.snippet.toLowerCase().includes(query);
            const matchSource = item.sourceTitle && item.sourceTitle.toLowerCase().includes(query);
            const matchEntity = item.entities && item.entities.some(e => e.text.toLowerCase().includes(query));
            return matchTitle || matchSnippet || matchSource || matchEntity;
        }

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:20px; grid-column:1/-1;">No headlines match your search filter.</div>';
        return;
    }

    const page = window.newsPage || 0;
    const pageSize = 9;
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    if (page >= totalPages) window.newsPage = totalPages - 1;

    const paginated = filtered.slice((window.newsPage || 0) * pageSize, ((window.newsPage || 0) + 1) * pageSize);

    container.innerHTML = paginated.map(item => {
        const sentBadge = item.sentiment ? `<span class="sentiment-badge ${item.sentiment.label.toLowerCase()}"><i class="fas ${item.sentiment.icon}"></i> ${item.sentiment.label}</span>` : '';
        
        let entityChips = '';
        if (item.entities && item.entities.length > 0) {
            entityChips = item.entities.slice(0, 3).map(e => `
                <span class="entity-chip" onclick="event.stopPropagation(); filterByEntityChip('${e.text.replace(/'/g, "\\'")}')">${e.text}</span>
            `).join('');
        }

        const invokeLink = `if(window.__TAURI__) { window.__TAURI__.event.emit('open-new-tab', '${item.link}') } else { window.open('${item.link}','_blank') }`;

        return `
            <div class="news-item">
                ${item.imageUrl ? `<img src="${item.imageUrl}" onerror="this.style.display='none'">` : ''}
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    ${sentBadge}
                    <span style="font-size:11px; color:#94a3b8;">${item.pubDate}</span>
                </div>
                <a href="javascript:void(0)" onclick="${invokeLink}">${item.title}</a>
                ${item.snippet ? `<p style="font-size:12px; color:#94a3b8; line-height:1.4; margin:0;">${item.snippet}</p>` : ''}
                ${entityChips ? `<div style="margin-top:4px;">${entityChips}</div>` : ''}
                <div class="source">${item.sourceTitle}</div>
            </div>
        `;
    }).join('');

    const indicator = document.getElementById('news-page-indicator');
    if (indicator) indicator.textContent = `${(window.newsPage || 0) + 1} / ${totalPages}`;
};

window.filterByEntityChip = function(entityText) {
    const searchInput = document.getElementById('desktop-news-search');
    if (searchInput) {
        searchInput.value = entityText;
        window.newsPage = 0;
        window.filterNews();
    }
};

window.fetchNextNews = function () {
    window.newsPage = (window.newsPage || 0) + 1;
    window.filterNews();
};

window.fetchPreviousNews = function () {
    if ((window.newsPage || 0) > 0) {
        window.newsPage--;
        window.filterNews();
    }
};

// --- Favourites Panel Logic ---
const defaultFavs = [
    { name: "Google", url: "https://www.google.com", icon: "fab fa-google" },
    { name: "YouTube", url: "https://www.youtube.com", icon: "fab fa-youtube" },
    { name: "Flipkart", url: "https://www.flipkart.com", icon: "fas fa-shopping-cart" },
    { name: "Wikipedia", url: "https://www.wikipedia.org", icon: "fab fa-wikipedia-w" }
];

window.loadFavourites = function () {
    let favs = JSON.parse(localStorage.getItem('favourite_websites'));
    if (!favs || !Array.isArray(favs) || favs.length === 0) {
        favs = defaultFavs;
        localStorage.setItem('favourite_websites', JSON.stringify(favs));
    }

    const container = document.getElementById('favourites-grid');
    if (!container) return;

    container.innerHTML = favs.map((fav, index) => {
        const invokeTemplate = `if(window.__TAURI__) { window.__TAURI__.event.emit('open-new-tab', '${fav.url}') } else { window.open('${fav.url}','_blank') }`;
        return `
        <a href="javascript:void(0)" onclick="${invokeTemplate}" class="fav-card">
            <i class="${fav.icon || 'fas fa-globe'} icon"></i>
            <div class="fav-card-details">
                <span class="fav-card-title">${fav.name}</span>
                <span class="fav-card-url">${fav.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
            </div>
            <div class="fav-remove" onclick="event.stopPropagation(); window.removeFavourite(${index})"><i class="fas fa-times"></i></div>
        </a>
    `;
    }).join('');
};

window.addFavouritePrompt = function () {
    const modal = document.getElementById('add-fav-modal');
    if (modal) modal.style.display = 'block';
};

window.saveNewFavourite = function () {
    const name = document.getElementById('fav-name-input').value.trim();
    const url = document.getElementById('fav-url-input').value.trim();
    let icon = document.getElementById('fav-icon-input').value.trim() || 'fas fa-globe';

    if (!name || !url) {
        alert("Name and URL are required.");
        return;
    }

    let favs = JSON.parse(localStorage.getItem('favourite_websites')) || defaultFavs;
    favs.push({ name, url, icon });
    localStorage.setItem('favourite_websites', JSON.stringify(favs));

    // Clear inputs and close modal
    document.getElementById('fav-name-input').value = '';
    document.getElementById('fav-url-input').value = '';
    document.getElementById('fav-icon-input').value = '';
    document.getElementById('add-fav-modal').style.display = 'none';

    window.loadFavourites();
};

window.removeFavourite = function (index) {
    if (confirm("Remove this favourite website?")) {
        let favs = JSON.parse(localStorage.getItem('favourite_websites')) || [];
        favs.splice(index, 1);
        localStorage.setItem('favourite_websites', JSON.stringify(favs));
        window.loadFavourites();
    }
};
function openSystemModal() {
    const modal = document.getElementById('system-modal');
    if (modal) {
        modal.style.display = 'block';
        const defaultTab = document.querySelector('.tab-content.active') || document.querySelector('.tab-content');
        if (defaultTab) defaultTab.classList.add('active');
        if (window.renderAppStore) window.renderAppStore();
    }
}

// App Store Management
window.renderAppStore = function() {
    const offlineContainer = document.getElementById('offline-apps-list');
    const onlineContainer = document.getElementById('online-apps-list');
    if (!offlineContainer || !onlineContainer || !window.appClassifier) return;

    offlineContainer.innerHTML = '';
    onlineContainer.innerHTML = '';

    const registry = window.appClassifier.appRegistry;
    const savedEnabledApps = localStorage.getItem('enabled_apps');
    let enabledAppIds = savedEnabledApps ? JSON.parse(savedEnabledApps) : [];

    Array.from(registry.values()).forEach(app => {
        // Exclude system desktop app from being disabled
        if (app.id === 'desktop') return;

        const isEnabled = enabledAppIds.includes(app.id);
        const toggleDiv = document.createElement('div');
        toggleDiv.style.display = 'flex';
        toggleDiv.style.justifyContent = 'space-between';
        toggleDiv.style.alignItems = 'center';
        toggleDiv.style.padding = '10px';
        toggleDiv.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        toggleDiv.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <i class="${app.icon}" style="font-size:18px; color:#94a3b8;"></i>
                <div>
                    <div style="font-weight:600; font-size:13px;">${app.name}</div>
                    <div style="font-size:11px; color:#64748b;">${app.description || ''}</div>
                </div>
            </div>
            <label style="cursor:pointer; font-size:12px; display:flex; align-items:center; gap:5px;">
                <input type="checkbox" value="${app.id}" ${isEnabled ? 'checked' : ''} onchange="window.toggleAppRegistration('${app.id}', this.checked)">
                ${isEnabled ? 'Enabled' : 'Disabled'}
            </label>
        `;

        if (app.type === 'offline') offlineContainer.appendChild(toggleDiv);
        else onlineContainer.appendChild(toggleDiv);
    });
};

window.toggleAppRegistration = function(appId, isEnabled) {
    const savedEnabledApps = localStorage.getItem('enabled_apps');
    let enabledAppIds = savedEnabledApps ? JSON.parse(savedEnabledApps) : [];
    if (isEnabled) {
        if (!enabledAppIds.includes(appId)) enabledAppIds.push(appId);
    } else {
        enabledAppIds = enabledAppIds.filter(id => id !== appId);
    }
    localStorage.setItem('enabled_apps', JSON.stringify(enabledAppIds));
    
    if (window.renderAppStore) window.renderAppStore();
    // Simulate a change event on the category select to re-render the icons on desktop
    const categorySelect = document.getElementById('app-category-select');
    if (categorySelect) categorySelect.dispatchEvent(new Event('change'));
};

function closeSystemModal() {
    const modal = document.getElementById('system-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside content
window.addEventListener('click', (e) => {
    const modal = document.getElementById('system-modal');
    if (e.target === modal) {
        closeSystemModal();
    }
});

// Tab switching
function openTab(tabName) {
    // Hide all tab contents
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }

    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }

    // Show the current tab and mark its button as active
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Find the button manually and make active
    const btns = Array.from(document.getElementsByClassName('tab-btn'));
    const targetBtn = btns.find(b => b.getAttribute('onclick').includes(tabName));
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
}

// Theme Management
function setTheme(themeName) {
    const root = document.documentElement;
    if (themeName === 'default') {
        root.style.setProperty('--bg-color', '#0f172a');
        root.style.setProperty('--bg-image', 'radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)');
    } else if (themeName === 'light') {
        root.style.setProperty('--bg-color', '#f8fafc');
        root.style.setProperty('--bg-image', 'none');
    } else if (themeName === 'dark-grey') {
        root.style.setProperty('--bg-color', '#1e293b');
        root.style.setProperty('--bg-image', 'none');
    } else if (themeName === 'nature') {
        root.style.setProperty('--bg-color', '#14532d');
        root.style.setProperty('--bg-image', 'radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)');
    }
    localStorage.setItem('desktop_theme', themeName);
    const themeMenu = document.getElementById('theme-menu');
    if (themeMenu) themeMenu.style.display = 'none';
}

function setCustomBg() {
    const url = document.getElementById('custom-bg-input').value;
    if (url) {
        const root = document.documentElement;
        root.style.setProperty('--bg-image', `url('${url}')`);
        root.style.setProperty('--bg-color', '#0f172a'); // fallback
        localStorage.setItem('desktop_theme', 'custom');
        localStorage.setItem('custom_bg_url', url);
    }
    const themeMenu = document.getElementById('theme-menu');
    if (themeMenu) themeMenu.style.display = 'none';
}

// Load saved theme on startup
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('desktop_theme');
    if (savedTheme === 'custom') {
        const customUrl = localStorage.getItem('custom_bg_url');
        if (customUrl) {
            document.documentElement.style.setProperty('--bg-image', `url('${customUrl}')`);
        }
    } else if (savedTheme) {
        setTheme(savedTheme);
    }
});

// --- Privacy-Friendly Video Fetching ---
window.fetchVideos = async function () {
    const topic = document.getElementById('video-topic-select')?.value || 'technology';
    const container = document.getElementById('video-feed-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-state">Fetching privacy-friendly videos via Invidious API...</div>';

    // Using known public Invidious instances as a privacy-safe proxy for Youtube videos
    const instances = [
        'https://inv.tux.pizza',
        'https://invidious.jing.rocks',
        'https://invidious.nerdvpn.de',
        'https://vid.puffyan.us'
    ];

    let success = false;
    for (const instance of instances) {
        try {
            const res = await fetch(`${instance} /api/v1 / search ? q = ${topic}& type=video`);
            if (!res.ok) continue;
            const data = await res.json();

            if (data && data.length > 0) {
                container.innerHTML = data.slice(0, 10).map(vid => `
            < a href = "https://www.youtube.com/watch?v=${vid.videoId}" target = "_blank" class="video-card" >
                        <div class="video-thumb">
                            <img src="${instance}/vi/${vid.videoId}/mqdefault.jpg" onerror="this.src='../src/vendor/fontawesome/svgs/solid/video.svg'">
                            <i class="fas fa-play-circle play-icon"></i>
                        </div>
                        <div class="video-info">
                            <div class="video-title" title="${vid.title.replace(/"/g, '&quot;')}">${vid.title}</div>
                            <div class="video-meta">${vid.author} • ${vid.viewCountText}</div>
                        </div >
                    </a >
            `).join('');
                success = true;
                break;
            }
        } catch (e) {
            console.warn(`Failed to fetch from ${instance} `, e);
        }
    }

    if (!success) {
        container.innerHTML = '<div class="empty-state">Unable to fetch videos at this time. Network restrictions or privacy instances may be rate-limited.</div>';
    }
};
