document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const tickerInput = document.getElementById('ticker-input');
    const addTickerBtn = document.getElementById('add-ticker-btn');
    const tickersGrid = document.getElementById('tickers-grid');

    // Prefer centralized DataManager API key if present
    let apiKey = (window.getApiKey?.('alphavantage')?.apiKey || localStorage.getItem('alphaVantageApiKey') || '');
    apiKeyInput.value = apiKey;
    let tickers = JSON.parse(localStorage.getItem('stockTickers')) || ['AAPL', 'GOOGL', 'MSFT'];

    saveApiKeyBtn.addEventListener('click', () => {
        apiKey = apiKeyInput.value;
        localStorage.setItem('alphaVantageApiKey', apiKey);
        // Save to DataManager too for cross-app reuse
        try { window.setApiKey?.('alphavantage', { apiKey }, 'stock-ticker'); } catch {}
        alert('API Key saved!');
        refreshAllTickers();
    });

    addTickerBtn.addEventListener('click', () => {
        const newTicker = tickerInput.value.toUpperCase();
        if (newTicker && !tickers.includes(newTicker)) {
            tickers.push(newTicker);
            saveAndRefresh();
            // Prefetch history in background
            prefetchHistory(newTicker).catch(()=>{});
        }
        tickerInput.value = '';
    });

    const fetchQuote = async (ticker) => {
        if (!apiKey) {
            console.error('API key is not set.');
            return { error: 'API key not set. Please add and save your Alpha Vantage API key.' };
        }
        
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data['Note'] || data['Information']) {
                return { 
                    error: data['Note'] || data['Information'] || 'API rate limit reached. Please try again later.'
                };
            }
            
            if (!data['Global Quote'] || !data['Global Quote']['01. symbol']) {
                return { error: 'No data available for this symbol.' };
            }
            
            return data['Global Quote'];
            
        } catch (error) {
            console.error(`Could not fetch quote for ${ticker}:`, error);
            return { 
                error: error.message || 'Failed to fetch data. Please check your connection and try again.'
            };
        }
    };

    const renderTicker = (ticker, quote) => {
        const card = document.createElement('div');
        card.className = 'ticker-card';
        card.id = `ticker-${ticker}`;

        // Show loading state
        if (quote === undefined) {
            card.innerHTML = `
                <div class="ticker-loading">
                    <div class="spinner"></div>
                    <h3>${ticker}</h3>
                    <p>Loading...</p>
                </div>
                <button class="remove-btn" data-ticker="${ticker}">&times;</button>
            `;
            return card;
        }

        // Show error state
        if (quote && quote.error) {
            card.innerHTML = `
                <h3>${ticker}</h3>
                <p class="error-message">${quote.error}</p>
                <button class="remove-btn" data-ticker="${ticker}">&times;</button>
            `;
            return card;
        }

        // Show success state
        if (quote && quote['01. symbol']) {
            const price = parseFloat(quote['05. price']).toFixed(2);
            const change = parseFloat(quote['09. change']).toFixed(2);
            const changePercent = parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2);
            const isPositive = change >= 0;
            const volume = parseInt(quote['06. volume']).toLocaleString();
            const lastUpdated = new Date(quote['07. latest trading day']).toLocaleDateString();

            card.innerHTML = `
                <div class="ticker-header">
                    <h3>${quote['01. symbol']}</h3>
                    <span class="ticker-name">${quote['01. symbol']}</span>
                    <button class="remove-btn" data-ticker="${ticker}" aria-label="Remove ${ticker}">&times;</button>
                </div>
                <div class="ticker-details">
                    <div class="price">$${price}</div>
                    <div class="change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : ''}${change} (${isPositive ? '+' : ''}${changePercent}%)
                    </div>
                </div>
                <div class="ticker-meta">
                    <span>Vol: ${volume}</span>
                    <span>Updated: ${lastUpdated}</span>
                </div>
                <div class="ticker-chart-wrap">
                  <button class="show-chart-btn" data-ticker="${ticker}">Show History</button>
                  <canvas id="chart-${ticker}" height="120" style="display:none;"></canvas>
                </div>
            `;
        } else {
            card.innerHTML = `
                <h3>${ticker}</h3>
                <p class="error-message">No data available for this symbol.</p>
                <button class="remove-btn" data-ticker="${ticker}">&times;</button>
            `;
        }
        tickersGrid.appendChild(card);

        card.querySelector('.remove-btn').addEventListener('click', (e) => {
            const tickerToRemove = e.target.dataset.ticker;
            tickers = tickers.filter(t => t !== tickerToRemove);
            saveAndRefresh();
        });

        const showBtn = card.querySelector('.show-chart-btn');
        if (showBtn) {
            showBtn.addEventListener('click', async () => {
                const canvas = document.getElementById(`chart-${ticker}`);
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                showBtn.disabled = true;
                showBtn.textContent = 'Loading...';
                try {
                    const series = await getHistoricalSeries(ticker);
                    if (!series || series.length === 0) {
                        showBtn.textContent = 'No history';
                        return;
                    }
                    canvas.style.display = '';
                    const labels = series.map(p => p.date);
                    const prices = series.map(p => p.close);
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [{ label: `${ticker} Close`, data: prices, borderColor: '#3e95cd', fill: false, pointRadius: 0 }]
                        },
                        options: { responsive: true, plugins: { legend: { display: true } }, scales: { x: { display: false } } }
                    });
                    showBtn.textContent = 'Hide History';
                    showBtn.onclick = () => { canvas.style.display = 'none'; showBtn.textContent = 'Show History'; };
                } catch (err) {
                    console.error('history error', err);
                    showBtn.textContent = 'Error';
                } finally {
                    showBtn.disabled = false;
                }
            });
        }
    };

    const refreshAllTickers = async () => {
        tickersGrid.innerHTML = 'Loading...';
        const quotePromises = tickers.map(ticker => fetchQuote(ticker));
        const quotes = await Promise.all(quotePromises);
        tickersGrid.innerHTML = '';
        tickers.forEach((ticker, index) => {
            renderTicker(ticker, quotes[index]);
            // Background warm-cache of history
            prefetchHistory(ticker).catch(()=>{});
        });
    };

    const saveAndRefresh = () => {
        localStorage.setItem('stockTickers', JSON.stringify(tickers));
        refreshAllTickers();
    };

    refreshAllTickers();
});

// Company search functionality (uses saved API key)
let searchTimeout;
const searchInput = document.getElementById('company-search');
const searchResults = document.getElementById('search-results');

function getSavedApiKey() {
    return (window.getApiKey?.('alphavantage')?.apiKey || localStorage.getItem('alphaVantageApiKey') || '');
}

if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length < 2) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }
        searchTimeout = setTimeout(async () => {
            const key = getSavedApiKey();
            if (!key) {
                searchResults.innerHTML = '<div class="search-result">Enter and save your API key first.</div>';
                searchResults.style.display = 'block';
                return;
            }
            try {
                const response = await fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${encodeURIComponent(key)}`);
                const data = await response.json();
                displaySearchResults(data.bestMatches || []);
            } catch (error) {
                console.error('Error searching for companies:', error);
                searchResults.innerHTML = '<div class="search-result">Error loading results</div>';
                searchResults.style.display = 'block';
            }
        }, 400);
    });
}

function displaySearchResults(companies) {
    searchResults.innerHTML = '';
    if (!companies || companies.length === 0) {
        searchResults.innerHTML = '<div class="search-result">No companies found</div>';
        searchResults.style.display = 'block';
        return;
    }
    companies.forEach(company => {
        const div = document.createElement('div');
        div.className = 'search-result';
        const symbol = company['1. symbol'];
        const name = company['2. name'];
        div.textContent = `${symbol} - ${name}`;
        div.onclick = () => {
            const input = document.getElementById('ticker-input');
            if (input) input.value = symbol;
            // Optionally auto-add
            const addBtn = document.getElementById('add-ticker-btn');
            addBtn?.click();
            searchResults.style.display = 'none';
        };
        searchResults.appendChild(div);
    });
    searchResults.style.display = 'block';
}

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!searchResults) return;
    if (e.target !== searchInput && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// --- Historical data and caching (local service only) ---
const HISTORY_CACHE_HOURS = 12;

function getCache(key) {
    try { return window.getAppData?.(key) ?? null; } catch { return null; }
}
function setCache(key, value) {
    try { window.setAppData?.(key, value, 'stock-ticker'); } catch {}
}

async function prefetchHistory(ticker) {
    try { await getHistoricalSeries(ticker, true); } catch {}
}

async function getHistoricalSeries(ticker, background = false) {
    const cacheKey = `history_${ticker}`;
    const cached = getCache(cacheKey);
    if (cached && cached.expires > Date.now()) {
        return cached.series;
    }
    // Use local Python yfinance service for history
    try {
        const py = await fetch(`http://127.0.0.1:5005/history/${encodeURIComponent(ticker)}`);
        if (py.ok) {
            const json = await py.json();
            const series = (json || []).map(r => ({ date: r.date, close: r.close }));
            setCache(cacheKey, { series, expires: Date.now() + HISTORY_CACHE_HOURS*3600*1000 });
            return series;
        }
    } catch {}
    if (!background) {
        console.warn('Local history service not available at http://127.0.0.1:5005. Run install.py --start to enable yfinance history.');
    }
    return [];
}