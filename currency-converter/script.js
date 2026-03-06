const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const resultDisplay = document.getElementById('converted-amount');
const resultText = document.getElementById('result-text');
const rateText = document.getElementById('rate-text');
const swapBtn = document.getElementById('swap-btn');
const errorDisplay = document.getElementById('error-message');

let rates = {};
let lastFetched = null;

const PRIORITY = ['USD', 'EUR', 'INR', 'CNY', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'SGD'];

async function init() {
    await fetchRates();
    loadPreferences();
    setupListeners();
}

function setupListeners() {
    [amountInput, fromSelect, toSelect].forEach(el => {
        el.addEventListener('input', calculate);
    });

    swapBtn.addEventListener('click', () => {
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        calculate();
        savePreferences();
    });

    fromSelect.addEventListener('change', savePreferences);
    toSelect.addEventListener('change', savePreferences);
}

async function fetchRates() {
    try {
        errorDisplay.style.display = 'none';
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!res.ok) throw new Error('API unreachable');

        const data = await res.json();
        rates = data.rates;
        lastFetched = Date.now();

        if (window.setAppData) {
            window.setAppData('currency_cache', { rates, timestamp: lastFetched }, 'currency-converter');
        }

        populateSelectors();
        calculate();
    } catch (err) {
        console.warn("API Error, checking cache...", err);
        loadCache();
    }
}

function loadCache() {
    if (window.getAppData) {
        const cached = window.getAppData('currency_cache');
        if (cached) {
            rates = cached.rates;
            lastFetched = cached.timestamp;
            populateSelectors();
            calculate();
            showError(`Using cached rates from ${new Date(lastFetched).toLocaleTimeString()}`);
        } else {
            showError("No offline data. Please check connection.");
        }
    }
}

function populateSelectors() {
    const allCurrencies = Object.keys(rates).sort();
    let html = '';

    PRIORITY.forEach(c => {
        if (rates[c]) html += `<option value="${c}">${c}</option>`;
    });
    html += '<option disabled>──────────</option>';
    allCurrencies.forEach(c => {
        if (!PRIORITY.includes(c)) html += `<option value="${c}">${c}</option>`;
    });

    fromSelect.innerHTML = html;
    toSelect.innerHTML = html;

    // Defaults if no preferences
    fromSelect.value = 'USD';
    toSelect.value = 'EUR';
}

function calculate() {
    if (!rates || Object.keys(rates).length === 0) return;

    const amount = parseFloat(amountInput.value) || 0;
    const from = fromSelect.value;
    const to = toSelect.value;

    const rate = rates[to] / rates[from];
    const converted = amount * rate;

    const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: to,
        maximumFractionDigits: 2
    });

    resultDisplay.value = converted.toFixed(2);
    resultText.textContent = formatter.format(converted);
    rateText.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
}

function savePreferences() {
    if (window.setAppData) {
        window.setAppData('currency_prefs', {
            from: fromSelect.value,
            to: toSelect.value
        }, 'currency-converter');
    }
}

function loadPreferences() {
    if (window.getAppData) {
        const prefs = window.getAppData('currency_prefs');
        if (prefs) {
            if (rates[prefs.from]) fromSelect.value = prefs.from;
            if (rates[prefs.to]) toSelect.value = prefs.to;
            calculate();
        }
    }
}

function showError(msg) {
    errorDisplay.textContent = msg;
    errorDisplay.style.display = 'block';
}

init();
