document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    let myId = 'guest';
    if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) myId = session.user.id;
    }

    const classInput = document.getElementById('asset-class');
    const symbolInput = document.getElementById('asset-symbol');
    const amountInput = document.getElementById('asset-amount');
    const investedInput = document.getElementById('asset-invested');
    const addBtn = document.getElementById('add-asset-btn');
    const listEl = document.getElementById('portfolio-list');

    const STORAGE_KEY = `portfolio_assets_${myId}`;

    let allocationChart = null;

    // Mock price generator based on symbol length + char codes to be deterministic-ish
    function getMockPrice(sym) {
        let hash = 0;
        for (let i = 0; i < sym.length; i++) hash += sym.charCodeAt(i);
        return (hash * 13.5 + 50).toFixed(2);
    }

    // Beautiful palette for chart
    const COLORS = ['#58a6ff', '#3fb950', '#f85149', '#a371f7', '#d29922', '#e34c26', '#1f6feb'];

    function getAssets() {
        let saved = localStorage.getItem(STORAGE_KEY);
        if (window.getAppData) {
            saved = window.getAppData(STORAGE_KEY, saved);
        }
        return saved ? JSON.parse(saved) : [];
    }

    function saveAssets(assets) {
        const json = JSON.stringify(assets);
        localStorage.setItem(STORAGE_KEY, json);
        if (window.setAppData) {
            window.setAppData(STORAGE_KEY, json, 'portfolio-manager');
        }
    }

    function renderAssets() {
        listEl.innerHTML = '';
        const assets = getAssets();

        let labels = [];
        let data = [];

        assets.forEach((a, idx) => {
            const price = getMockPrice(a.symbol);
            const val = (a.amount * price);
            const invested = parseFloat(a.invested) || val; // Fallback to val if legacy data
            const yoyRaw = invested > 0 ? ((val - invested) / invested) * 100 : 0;
            const yoyStr = yoyRaw >= 0 ? '+' + yoyRaw.toFixed(2) + '%' : yoyRaw.toFixed(2) + '%';
            const yoyClass = yoyRaw >= 0 ? 'color: #3fb950; font-weight: 500;' : 'color: #f85149; font-weight: 500;';

            labels.push(a.symbol);
            data.push(val);

            const tr = document.createElement('tr');

            const tdClass = document.createElement('td');
            tdClass.textContent = a.class ? a.class.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Stocks';

            const tdSym = document.createElement('td');
            tdSym.className = 'sym-col';
            tdSym.textContent = a.symbol;

            const tdAmt = document.createElement('td');
            tdAmt.textContent = a.amount;

            const tdInv = document.createElement('td');
            tdInv.textContent = '$' + invested.toFixed(2);

            const tdVal = document.createElement('td');
            tdVal.className = 'val-col';
            tdVal.textContent = '$' + val.toFixed(2);

            const tdYoy = document.createElement('td');
            tdYoy.textContent = yoyStr;
            tdYoy.style.cssText = yoyClass;

            const tdAct = document.createElement('td');
            const delBtn = document.createElement('button');
            delBtn.className = 'del-btn';
            delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            delBtn.onclick = () => {
                assets.splice(idx, 1);
                saveAssets(assets);
                renderAssets();
            };
            tdAct.appendChild(delBtn);

            tr.appendChild(tdClass);
            tr.appendChild(tdSym);
            tr.appendChild(tdAmt);
            tr.appendChild(tdInv);
            tr.appendChild(tdVal);
            tr.appendChild(tdYoy);
            tr.appendChild(tdAct);
            listEl.appendChild(tr);
        });

        // If no assets
        if (assets.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="7" style="text-align:center; color: var(--text-muted); padding: 32px 0;">No assets in portfolio. Add some above!</td>`;
            listEl.appendChild(tr);
        }

        updateChart(labels, data);
    }

    function updateChart(labels, data) {
        const ctx = document.getElementById('allocation-chart');
        if (allocationChart) {
            allocationChart.destroy();
        }

        if (data.length === 0) {
            // Emptystate chart
            allocationChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Empty'],
                    datasets: [{ data: [1], backgroundColor: ['#30363d'], borderWidth: 0 }]
                },
                options: { cutout: '75%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
            });
            return;
        }

        allocationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: COLORS.slice(0, data.length),
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#c9d1d9', padding: 20, font: { family: 'Outfit', size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    addBtn.addEventListener('click', () => {
        const cls = classInput ? classInput.value : 'stocks';
        const sym = symbolInput.value.trim().toUpperCase();
        const amt = parseFloat(amountInput.value);
        const inv = parseFloat(investedInput ? investedInput.value : 0) || (amt * parseFloat(getMockPrice(sym)));

        if (sym && !isNaN(amt) && amt > 0) {
            const assets = getAssets();
            // check if exists (same class and symbol)
            const existing = assets.find(a => a.symbol === sym && a.class === cls);
            if (existing) {
                existing.amount += amt; // Add to existing
                existing.invested = (parseFloat(existing.invested) || 0) + inv;
            } else {
                assets.push({ class: cls, symbol: sym, amount: amt, invested: inv });
            }
            saveAssets(assets);
            renderAssets();
            symbolInput.value = '';
            amountInput.value = '';
            if (investedInput) investedInput.value = '';
            symbolInput.focus();
        }
    });

    symbolInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') amountInput.focus();
    });
    amountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addBtn.click();
    });

    window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'DATA_CHANGE' && e.data.key === STORAGE_KEY) {
            renderAssets();
        }
    });

    renderAssets();
});
