const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const convertedAmountInput = document.getElementById('converted-amount');
const resultText = document.getElementById('result-text');
const rateText = document.getElementById('rate-text');
const swapBtn = document.getElementById('swap-btn');
const errorMessage = document.getElementById('error-message');

let exchangeRates = {};

// Popular currencies to show at the top
const priorityCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD'];

async function fetchRates() {
    try {
        errorMessage.style.display = 'none';
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        exchangeRates = data.rates;

        // Cache for offline use if integrated with app-shell
        if (window.localStorage) {
            localStorage.setItem('currencyRatesCache', JSON.stringify({
                timestamp: Date.now(),
                rates: exchangeRates
            }));
        }

        populateSelectors();
        calculateConversion();
    } catch (error) {
        console.error('Error fetching exchange rates:', error);

        // Check cache
        const cachedStr = localStorage.getItem('currencyRatesCache');
        if (cachedStr) {
            try {
                const cached = JSON.parse(cachedStr);
                exchangeRates = cached.rates;
                populateSelectors();
                calculateConversion();
                errorMessage.textContent = `Using cached rates from ${new Date(cached.timestamp).toLocaleString()}`;
                errorMessage.style.display = 'block';
                return;
            } catch (e) { }
        }

        errorMessage.textContent = 'Unable to fetch exchange rates. Please check your internet connection.';
        errorMessage.style.display = 'block';
    }
}

function populateSelectors() {
    const currencies = Object.keys(exchangeRates).sort();

    // Create options array
    let optionsHtml = '';

    // Add priority currencies first
    priorityCurrencies.forEach(currency => {
        if (currencies.includes(currency)) {
            optionsHtml += `<option value="${currency}">${currency}</option>`;
        }
    });

    optionsHtml += `<option disabled>──────────</option>`;

    // Add the rest
    currencies.forEach(currency => {
        if (!priorityCurrencies.includes(currency)) {
            optionsHtml += `<option value="${currency}">${currency}</option>`;
        }
    });

    fromCurrencySelect.innerHTML = optionsHtml;
    toCurrencySelect.innerHTML = optionsHtml;

    // Set defaults
    fromCurrencySelect.value = 'USD';
    toCurrencySelect.value = 'EUR';
}

function calculateConversion() {
    if (Object.keys(exchangeRates).length === 0) return;

    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount < 0) {
        convertedAmountInput.value = '';
        resultText.textContent = '---';
        rateText.textContent = '';
        return;
    }

    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    // Convert via USD (base currency of the API)
    const rateFromUSD = exchangeRates[fromCurrency];
    const rateToUSD = exchangeRates[toCurrency];

    // amount in USD = amount / rateFromUSD
    // converted amount = amount in USD * rateToUSD
    const rate = rateToUSD / rateFromUSD;
    const convertedAmount = amount * rate;

    convertedAmountInput.value = convertedAmount.toFixed(2);
    resultText.textContent = `${convertedAmount.toFixed(2)} ${toCurrency}`;
    rateText.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
}

// Event Listeners
amountInput.addEventListener('input', calculateConversion);
fromCurrencySelect.addEventListener('change', calculateConversion);
toCurrencySelect.addEventListener('change', calculateConversion);

swapBtn.addEventListener('click', () => {
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;

    // Triggers conversion via element swap
    calculateConversion();
});

// Initial fetch
fetchRates();
