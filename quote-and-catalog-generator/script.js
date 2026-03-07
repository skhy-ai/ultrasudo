/**
 * Quote & Catalog Generator — Business quote builder
 * Features: Line items with math, catalog, save/load, print preview
 */

let lineItems = [];
let catalog = [];
let savedQuotes = [];
let nextItemId = 1;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadData();
    document.getElementById('quote-date').valueAsDate = new Date();
    document.getElementById('quote-number').value = 'QT-' + String(savedQuotes.length + 1).padStart(3, '0');

    addLineItem(); // Start with one empty line

    document.getElementById('btn-add-item').addEventListener('click', addLineItem);
    document.getElementById('tax-rate').addEventListener('input', recalculate);
    document.getElementById('btn-preview-quote').addEventListener('click', previewQuote);
    document.getElementById('btn-save-quote').addEventListener('click', saveQuote);
    document.getElementById('btn-print-quote').addEventListener('click', printQuote);
    document.getElementById('btn-add-catalog').addEventListener('click', addCatalogItem);
    document.getElementById('btn-close-preview').addEventListener('click', () => {
        document.getElementById('preview-modal').style.display = 'none';
    });
});

// --- Tabs ---
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });
}

// --- Line Items ---
function addLineItem(presetData = null) {
    const id = nextItemId++;
    const item = {
        id, name: presetData?.name || '', price: presetData?.price || 0, qty: presetData?.qty || 1
    };
    lineItems.push(item);
    renderLineItems();
}

function renderLineItems() {
    const container = document.getElementById('line-items');
    container.innerHTML = lineItems.map(item => `
        <div class="line-item" data-id="${item.id}">
            <input type="text" class="li-name" value="${item.name}" placeholder="Item description">
            <input type="number" class="li-price" value="${item.price}" min="0" step="0.01" placeholder="Price">
            <input type="number" class="li-qty" value="${item.qty}" min="1" placeholder="Qty">
            <span class="line-total">${formatCurrency(item.price * item.qty)}</span>
            <button class="btn-remove" onclick="removeLineItem(${item.id})" title="Remove"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    // Wire input events
    container.querySelectorAll('.line-item').forEach(row => {
        const id = parseInt(row.dataset.id);
        const item = lineItems.find(i => i.id === id);
        if (!item) return;

        row.querySelector('.li-name').addEventListener('input', e => { item.name = e.target.value; });
        row.querySelector('.li-price').addEventListener('input', e => {
            item.price = parseFloat(e.target.value) || 0;
            row.querySelector('.line-total').textContent = formatCurrency(item.price * item.qty);
            recalculate();
        });
        row.querySelector('.li-qty').addEventListener('input', e => {
            item.qty = parseInt(e.target.value) || 1;
            row.querySelector('.line-total').textContent = formatCurrency(item.price * item.qty);
            recalculate();
        });
    });

    recalculate();
}

function removeLineItem(id) {
    lineItems = lineItems.filter(i => i.id !== id);
    renderLineItems();
}

function recalculate() {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxRate = parseFloat(document.getElementById('tax-rate').value) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('grand-total').textContent = formatCurrency(total);
}

function formatCurrency(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// --- Catalog ---
function addCatalogItem() {
    const name = document.getElementById('cat-item-name').value.trim();
    const price = parseFloat(document.getElementById('cat-item-price').value) || 0;
    const desc = document.getElementById('cat-item-desc').value.trim();

    if (!name) { alert('Enter an item name.'); return; }

    catalog.push({ name, price, desc, id: Date.now() });
    saveData();
    renderCatalog();

    document.getElementById('cat-item-name').value = '';
    document.getElementById('cat-item-price').value = '';
    document.getElementById('cat-item-desc').value = '';
}

function renderCatalog() {
    const container = document.getElementById('catalog-list');
    if (catalog.length === 0) {
        container.innerHTML = '<p class="empty-state">No catalog items. Add products/services above.</p>';
        return;
    }

    container.innerHTML = catalog.map(item => `
        <div class="catalog-item">
            <div class="cat-info">
                <div class="cat-name">${item.name}</div>
                <div class="cat-desc">${item.desc}</div>
            </div>
            <span class="cat-price">${formatCurrency(item.price)}</span>
            <div class="cat-actions">
                <button class="btn-use" onclick="useCatalogItem(${item.id})"><i class="fas fa-plus"></i> Use</button>
                <button class="btn-del" onclick="removeCatalogItem(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

window.useCatalogItem = function(id) {
    const item = catalog.find(i => i.id === id);
    if (item) addLineItem({ name: item.name, price: item.price, qty: 1 });
    // Switch to quotes tab
    document.querySelector('.tab-btn[data-tab="quotes"]').click();
};

window.removeCatalogItem = function(id) {
    catalog = catalog.filter(i => i.id !== id);
    saveData();
    renderCatalog();
};

// --- Save / Load ---
function saveQuote() {
    const quote = {
        id: Date.now(),
        bizName: document.getElementById('biz-name').value,
        quoteNumber: document.getElementById('quote-number').value,
        clientName: document.getElementById('client-name').value,
        date: document.getElementById('quote-date').value,
        items: [...lineItems],
        taxRate: parseFloat(document.getElementById('tax-rate').value) || 0,
        notes: document.getElementById('quote-notes').value,
        total: document.getElementById('grand-total').textContent
    };

    savedQuotes.push(quote);
    saveData();
    renderSaved();

    // Increment quote number
    const num = parseInt(quote.quoteNumber.replace(/\D/g, '')) || savedQuotes.length;
    document.getElementById('quote-number').value = 'QT-' + String(num + 1).padStart(3, '0');

    alert('Quote saved!');
}

function renderSaved() {
    const container = document.getElementById('saved-quotes');
    if (savedQuotes.length === 0) {
        container.innerHTML = '<p class="empty-state">No saved quotes yet.</p>';
        return;
    }

    container.innerHTML = savedQuotes.map(q => `
        <div class="saved-item" onclick="loadQuote(${q.id})">
            <div class="saved-header">
                <span class="saved-title">${q.quoteNumber} — ${q.clientName || 'Unknown Client'}</span>
                <span class="saved-total">${q.total}</span>
            </div>
            <div class="saved-meta">${q.bizName || ''} • ${q.date} • ${q.items.length} items</div>
        </div>
    `).join('');
}

window.loadQuote = function(id) {
    const q = savedQuotes.find(s => s.id === id);
    if (!q) return;

    document.getElementById('biz-name').value = q.bizName || '';
    document.getElementById('quote-number').value = q.quoteNumber || '';
    document.getElementById('client-name').value = q.clientName || '';
    document.getElementById('quote-date').value = q.date || '';
    document.getElementById('tax-rate').value = q.taxRate || 0;
    document.getElementById('quote-notes').value = q.notes || '';

    lineItems = q.items.map((item, i) => ({ ...item, id: i + 1 }));
    nextItemId = lineItems.length + 1;
    renderLineItems();

    document.querySelector('.tab-btn[data-tab="quotes"]').click();
};

function saveData() {
    localStorage.setItem('quote_catalog', JSON.stringify(catalog));
    localStorage.setItem('quote_saved', JSON.stringify(savedQuotes));
}

function loadData() {
    try {
        catalog = JSON.parse(localStorage.getItem('quote_catalog')) || [];
        savedQuotes = JSON.parse(localStorage.getItem('quote_saved')) || [];
    } catch (e) {
        catalog = [];
        savedQuotes = [];
    }
    renderCatalog();
    renderSaved();
}

// --- Preview & Print ---
function previewQuote() {
    const body = generateQuoteHTML();
    document.getElementById('quote-preview-body').innerHTML = body;
    document.getElementById('preview-modal').style.display = 'flex';
}

function printQuote() {
    const body = generateQuoteHTML();
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Print Quote</title><style>
        body{font-family:'Segoe UI',sans-serif;padding:30px;color:#0f172a;}
        h1{font-size:1.5rem;margin-bottom:4px;} .meta{color:#64748b;font-size:0.85rem;margin-bottom:20px;}
        table{width:100%;border-collapse:collapse;margin:16px 0;}
        th{text-align:left;padding:8px;background:#f1f5f9;font-size:0.8rem;border-bottom:2px solid #e2e8f0;}
        td{padding:8px;border-bottom:1px solid #f1f5f9;font-size:0.85rem;}
        .totals{text-align:right;margin-top:16px;} .final{font-size:1.2rem;font-weight:700;color:#059669;}
        .notes{margin-top:20px;padding:12px;background:#f8fafc;border-radius:8px;font-size:0.85rem;}
    </style></head><body>${body}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
}

function generateQuoteHTML() {
    const biz = document.getElementById('biz-name').value || 'Business';
    const qn = document.getElementById('quote-number').value || 'QT-001';
    const client = document.getElementById('client-name').value || 'Client';
    const date = document.getElementById('quote-date').value;
    const taxRate = parseFloat(document.getElementById('tax-rate').value) || 0;
    const notes = document.getElementById('quote-notes').value;

    const subtotal = lineItems.reduce((s, i) => s + (i.price * i.qty), 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    let rows = lineItems.map(i => `<tr><td>${i.name}</td><td>${formatCurrency(i.price)}</td><td>${i.qty}</td><td>${formatCurrency(i.price * i.qty)}</td></tr>`).join('');

    return `
        <div class="quote-preview">
            <h1>${biz}</h1>
            <div class="meta">Quote #${qn} • ${date} • To: ${client}</div>
            <table><thead><tr><th>Description</th><th>Unit Price</th><th>Qty</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
            <div class="totals">
                <div>Subtotal: ${formatCurrency(subtotal)}</div>
                ${taxRate > 0 ? `<div>Tax (${taxRate}%): ${formatCurrency(tax)}</div>` : ''}
                <div class="final">Total: ${formatCurrency(total)}</div>
            </div>
            ${notes ? `<div class="notes"><strong>Notes:</strong> ${notes}</div>` : ''}
        </div>
    `;
}
