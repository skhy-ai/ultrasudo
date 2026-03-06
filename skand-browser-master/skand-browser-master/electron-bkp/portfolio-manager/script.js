document.addEventListener('DOMContentLoaded', () => {
    const symbolInput = document.getElementById('asset-symbol');
    const amountInput = document.getElementById('asset-amount');
    const addBtn = document.getElementById('add-asset-btn');
    const listEl = document.getElementById('portfolio-list');

    const STORAGE_KEY = 'portfolio_assets';

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
        assets.forEach((a, idx) => {
            const li = document.createElement('li');
            li.textContent = `${a.symbol} - ${a.amount}`;
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Remove';
            delBtn.style.marginLeft = '10px';
            delBtn.onclick = () => {
                assets.splice(idx, 1);
                saveAssets(assets);
                renderAssets();
            };
            li.appendChild(delBtn);
            listEl.appendChild(li);
        });
    }

    addBtn.addEventListener('click', () => {
        const sym = symbolInput.value.trim().toUpperCase();
        const amt = parseFloat(amountInput.value);
        if (sym && !isNaN(amt)) {
            const assets = getAssets();
            assets.push({ symbol: sym, amount: amt });
            saveAssets(assets);
            renderAssets();
            symbolInput.value = '';
            amountInput.value = '';
        }
    });

    // Listen for cloud sync events
    window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'DATA_CHANGE' && e.data.key === STORAGE_KEY) {
            renderAssets();
        }
    });

    renderAssets();
});
