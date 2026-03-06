document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    let myId = 'guest';
    if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) myId = session.user.id;
    }

    const tickerInput = document.getElementById('ticker-input');
    const addBtn = document.getElementById('add-ticker-btn');
    const gridEl = document.getElementById('watchlist-grid');

    const STORAGE_KEY = `investment_watch_${myId}`;
    const STRATEGY_KEY = `investment_strategy_${myId}`;

    const riskInput = document.getElementById('risk-factors');
    const stratInput = document.getElementById('inv-strategy');
    const growthInput = document.getElementById('market-growth');

    // Load Strategy Texts
    function loadStrategy() {
        let saved = localStorage.getItem(STRATEGY_KEY);
        if (window.getAppData) saved = window.getAppData(STRATEGY_KEY, saved);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (riskInput) riskInput.value = data.risk || '';
                if (stratInput) stratInput.value = data.strategy || '';
                if (growthInput) growthInput.value = data.growth || '';
            } catch (e) { }
        }
    }

    // Save Strategy Texts
    function saveStrategy() {
        const data = {
            risk: riskInput ? riskInput.value : '',
            strategy: stratInput ? stratInput.value : '',
            growth: growthInput ? growthInput.value : ''
        };
        const json = JSON.stringify(data);
        localStorage.setItem(STRATEGY_KEY, json);
        if (window.setAppData) window.setAppData(STRATEGY_KEY, json, 'investment-board');
    }

    [riskInput, stratInput, growthInput].forEach(el => {
        if (el) el.addEventListener('input', saveStrategy);
    });

    let chartInstances = {};

    function getWatchlist() {
        let saved = localStorage.getItem(STORAGE_KEY);
        if (window.getAppData) {
            saved = window.getAppData(STORAGE_KEY, saved);
        }
        return saved ? JSON.parse(saved) : ['AAPL', 'MSFT', 'TSLA']; // default mocks
    }

    function saveWatchlist(list) {
        const json = JSON.stringify(list);
        localStorage.setItem(STORAGE_KEY, json);
        if (window.setAppData) {
            window.setAppData(STORAGE_KEY, json, 'investment-board');
        }
    }

    // Mock generator
    function generateMockData(sym) {
        let hash = 0;
        for (let i = 0; i < sym.length; i++) hash += sym.charCodeAt(i);

        let basePrice = (hash * 2.5) % 800 + 50;
        let series = [];
        let current = basePrice;

        // Generate 20 data points
        for (let i = 0; i < 20; i++) {
            // Random walk biased by hash
            let change = (Math.random() - 0.45) * (basePrice * 0.05);
            current += change;
            series.push(parseFloat(current.toFixed(2)));
        }

        const open = series[0];
        const close = series[series.length - 1];
        const pctChange = ((close - open) / open * 100);

        // Generate synthetic Yahoo Finance metrics based on the hash
        const peRatio = ((hash % 40) + 5).toFixed(2);
        const marketCap = ((hash * basePrice) % 3000 + 10).toFixed(1) + 'B';
        const volume = ((hash * 1337) % 50 + 1).toFixed(1) + 'M';

        return {
            price: close.toFixed(2),
            change: (close - open).toFixed(2),
            pct: pctChange.toFixed(2),
            isUp: pctChange >= 0,
            series: series,
            pe: peRatio,
            cap: marketCap,
            vol: volume
        };
    }

    function renderWatchlist() {
        const list = getWatchlist();
        gridEl.innerHTML = '';

        // Clean up old charts
        Object.values(chartInstances).forEach(c => c.destroy());
        chartInstances = {};

        if (list.length === 0) {
            gridEl.innerHTML = `<div style="color: var(--text-muted); grid-column: 1/-1;">Watchlist is empty.</div>`;
            return;
        }

        list.forEach(sym => {
            const data = generateMockData(sym);

            const card = document.createElement('div');
            card.className = 'ticker-card';

            card.innerHTML = `
                <div class="card-header">
                    <span class="ticker-symbol">${sym}</span>
                    <button class="del-ticker" data-sym="${sym}"><i class="fa-solid fa-times"></i></button>
                </div>
                <div class="price-row">
                    <span class="current-price">$${data.price}</span>
                    <span class="price-change ${data.isUp ? 'change-up' : 'change-down'}">
                        ${data.isUp ? '+' : ''}${data.change} (${data.isUp ? '+' : ''}${data.pct}%)
                    </span>
                </div>
                <div class="metrics-row" style="display: flex; gap: 12px; margin-top: 8px; font-size: 12px; color: var(--text-muted);">
                    <span><strong>Vol:</strong> ${data.vol}</span>
                    <span><strong>P/E:</strong> ${data.pe}</span>
                    <span><strong>Cap:</strong> ${data.cap}</span>
                </div>
                <div class="chart-box" id="chart-${sym}"></div>
            `;

            gridEl.appendChild(card);

            // Render sparkline
            const color = data.isUp ? '#3fb950' : '#f85149';
            const options = {
                series: [{ data: data.series }],
                chart: { type: 'line', width: '100%', height: 60, sparkline: { enabled: true } },
                stroke: { curve: 'smooth', width: 2 },
                colors: [color],
                tooltip: {
                    fixed: { enabled: false },
                    x: { show: false },
                    y: { title: { formatter: function (seriesName) { return '' } } },
                    marker: { show: false }
                }
            };

            const chart = new ApexCharts(document.querySelector(`#chart-${sym}`), options);
            chart.render();
            chartInstances[sym] = chart;
        });

        // Bind deletes
        document.querySelectorAll('.del-ticker').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const s = e.currentTarget.getAttribute('data-sym');
                const newList = list.filter(item => item !== s);
                saveWatchlist(newList);
                renderWatchlist();
            });
        });
    }

    addBtn.addEventListener('click', () => {
        const sym = tickerInput.value.trim().toUpperCase();
        if (sym) {
            const list = getWatchlist();
            if (!list.includes(sym)) {
                list.push(sym);
                saveWatchlist(list);
                renderWatchlist();
            }
            tickerInput.value = '';
            tickerInput.focus();
        }
    });

    tickerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addBtn.click();
    });

    window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'DATA_CHANGE') {
            if (e.data.key === STORAGE_KEY) renderWatchlist();
            if (e.data.key === STRATEGY_KEY) loadStrategy();
        }
    });

    loadStrategy();
    renderWatchlist();

    // Auto update mock data every 5 seconds for visual effect
    setInterval(renderWatchlist, 5000);
});
