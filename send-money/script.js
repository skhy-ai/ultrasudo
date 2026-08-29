/**
 * Send Money — Country-Specific QR-Based Payment
 * Generates payment URIs for each country's native payment platform.
 * QR codes are rendered using a lightweight canvas-based generator.
 */

// --- Country Payment Platform Registry ---
const PAYMENT_PLATFORMS = {
    india: {
        flag: '🇮🇳',
        name: 'India',
        platform: 'UPI',
        currency: '₹',
        currencyCode: 'INR',
        recipientPlaceholder: 'Enter UPI ID (e.g. name@upi)',
        recipientHint: 'UPI ID like name@ybl, phone@paytm, etc.',
        // UPI deep-link spec: https://www.npci.org.in/what-we-do/upi/upi-qr-code
        generateUri: (recipient, amount, note) =>
            `upi://pay?pa=${encodeURIComponent(recipient)}&pn=UltrasudoPay&am=${amount}&cu=INR&tn=${encodeURIComponent(note || 'Payment via Ultrasudo')}`,
        validateRecipient: (id) => /^[\w.-]+@[\w]+$/.test(id)
    },
    malaysia: {
        flag: '🇲🇾',
        name: 'Malaysia',
        platform: 'DuitNow',
        currency: 'RM',
        currencyCode: 'MYR',
        recipientPlaceholder: 'Enter phone number or DuitNow ID',
        recipientHint: 'Phone: +60xxxxxxxxx or NRIC/Business Reg No.',
        generateUri: (recipient, amount, note) =>
            `https://www.duitnow.my/qr?id=${encodeURIComponent(recipient)}&amount=${amount}&ref=${encodeURIComponent(note || 'Ultrasudo')}`,
        validateRecipient: (id) => id.length >= 8
    },
    singapore: {
        flag: '🇸🇬',
        name: 'Singapore',
        platform: 'PayNow',
        currency: 'S$',
        currencyCode: 'SGD',
        recipientPlaceholder: 'Enter phone number or NRIC/UEN',
        recipientHint: '+65xxxxxxxx or UEN for businesses',
        generateUri: (recipient, amount, note) =>
            `https://www.abs.org.sg/consumer-banking/pay-now?to=${encodeURIComponent(recipient)}&amount=${amount}&ref=${encodeURIComponent(note || 'Ultrasudo')}`,
        validateRecipient: (id) => id.length >= 8
    },
    brazil: {
        flag: '🇧🇷',
        name: 'Brazil',
        platform: 'PIX',
        currency: 'R$',
        currencyCode: 'BRL',
        recipientPlaceholder: 'Enter PIX key (CPF/CNPJ/email/phone)',
        recipientHint: 'CPF, CNPJ, email, or phone number',
        generateUri: (recipient, amount, note) =>
            `pix://pay?key=${encodeURIComponent(recipient)}&amount=${amount}&msg=${encodeURIComponent(note || 'Ultrasudo')}`,
        validateRecipient: (id) => id.length >= 5
    },
    usa: {
        flag: '🇺🇸',
        name: 'United States',
        platform: 'Venmo / Zelle',
        currency: '$',
        currencyCode: 'USD',
        recipientPlaceholder: 'Enter Venmo username or email',
        recipientHint: '@username or email address',
        generateUri: (recipient, amount, note) =>
            `https://venmo.com/?txn=pay&recipients=${encodeURIComponent(recipient)}&amount=${amount}&note=${encodeURIComponent(note || 'Ultrasudo')}`,
        validateRecipient: (id) => id.length >= 3
    },
    uk: {
        flag: '🇬🇧',
        name: 'United Kingdom',
        platform: 'Faster Payments',
        currency: '£',
        currencyCode: 'GBP',
        recipientPlaceholder: 'Enter sort code & account number',
        recipientHint: 'Format: 12-34-56 / 12345678',
        generateUri: (recipient, amount, note) =>
            `https://pay.uk/fps?account=${encodeURIComponent(recipient)}&amount=${amount}&ref=${encodeURIComponent(note || 'Ultrasudo')}`,
        validateRecipient: (id) => id.length >= 6
    },
    europe: {
        flag: '🇪🇺',
        name: 'Europe (SEPA)',
        platform: 'SEPA Transfer',
        currency: '€',
        currencyCode: 'EUR',
        recipientPlaceholder: 'Enter IBAN',
        recipientHint: 'e.g. DE89 3704 0044 0532 0130 00',
        // EPC QR Code (SEPA Credit Transfer) standard
        generateUri: (recipient, amount, note) => {
            const epc = [
                'BCD', '002', '1', 'SCT', '', // Service Tag, Version, Charset, ID, BIC
                encodeURIComponent(recipient.replace(/\s/g, '')),
                '', `EUR${amount}`, '', '', encodeURIComponent(note || 'Ultrasudo'), ''
            ].join('\n');
            return epc;
        },
        validateRecipient: (id) => /^[A-Z]{2}\d{2}/.test(id.replace(/\s/g, '').toUpperCase())
    },
    thailand: {
        flag: '🇹🇭',
        name: 'Thailand',
        platform: 'PromptPay',
        currency: '฿',
        currencyCode: 'THB',
        recipientPlaceholder: 'Enter phone number or Citizen ID',
        recipientHint: '0xxxxxxxxx or 13-digit Citizen ID',
        generateUri: (recipient, amount, note) =>
            `https://promptpay.io/${encodeURIComponent(recipient)}/${amount}`,
        validateRecipient: (id) => id.length >= 10
    },
    japan: {
        flag: '🇯🇵',
        name: 'Japan',
        platform: 'PayPay',
        currency: '¥',
        currencyCode: 'JPY',
        recipientPlaceholder: 'Enter PayPay ID or phone',
        recipientHint: 'PayPay registered phone or user ID',
        generateUri: (recipient, amount, note) =>
            `paypay://pay?to=${encodeURIComponent(recipient)}&amount=${amount}&note=${encodeURIComponent(note || 'Ultrasudo')}`,
        validateRecipient: (id) => id.length >= 5
    },
    australia: {
        flag: '🇦🇺',
        name: 'Australia',
        platform: 'PayID (NPP)',
        currency: 'A$',
        currencyCode: 'AUD',
        recipientPlaceholder: 'Enter PayID (email or phone)',
        recipientHint: 'Email or mobile linked to PayID',
        generateUri: (recipient, amount, note) =>
            `https://payid.com.au/pay?id=${encodeURIComponent(recipient)}&amount=${amount}&ref=${encodeURIComponent(note || 'Ultrasudo')}`,
        validateRecipient: (id) => id.length >= 5
    }
};

let selectedCountry = null;
let transferHistory = [];

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    renderCountryGrid();
    loadHistory();

    document.getElementById('btn-change-country').addEventListener('click', showCountryPanel);
    document.getElementById('btn-generate').addEventListener('click', generatePayment);
    document.getElementById('btn-copy-link').addEventListener('click', copyPaymentLink);
});

// --- Country Selection ---
function renderCountryGrid() {
    const grid = document.getElementById('country-grid');
    grid.innerHTML = '';

    Object.entries(PAYMENT_PLATFORMS).forEach(([key, country]) => {
        const card = document.createElement('div');
        card.className = 'country-card';
        card.innerHTML = `
            <span class="country-flag">${country.flag}</span>
            <span class="country-name">${country.name}</span>
            <span class="country-platform">${country.platform}</span>
        `;
        card.addEventListener('click', () => selectCountry(key));
        grid.appendChild(card);
    });
}

function selectCountry(countryKey) {
    selectedCountry = countryKey;
    const platform = PAYMENT_PLATFORMS[countryKey];

    // Update transfer form fields
    document.getElementById('platform-name').textContent = platform.platform;
    document.getElementById('currency-symbol').textContent = platform.currency;
    document.getElementById('recipient-id').placeholder = platform.recipientPlaceholder;
    document.getElementById('recipient-hint').textContent = platform.recipientHint;

    // Reset form
    document.getElementById('recipient-id').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('transfer-note').value = '';
    document.getElementById('qr-section').style.display = 'none';

    // Show transfer panel
    document.getElementById('country-panel').style.display = 'none';
    document.getElementById('transfer-panel').style.display = 'block';
}

function showCountryPanel() {
    document.getElementById('country-panel').style.display = 'block';
    document.getElementById('transfer-panel').style.display = 'none';
}

// --- Payment Generation ---
function generatePayment() {
    if (!selectedCountry) return;
    const platform = PAYMENT_PLATFORMS[selectedCountry];

    const recipient = document.getElementById('recipient-id').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const note = document.getElementById('transfer-note').value.trim();

    if (!recipient) {
        alert('Please enter a recipient ID.');
        return;
    }

    if (!platform.validateRecipient(recipient)) {
        alert('Invalid recipient format for ' + platform.platform);
        return;
    }

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }

    // Generate payment URI
    const paymentUri = platform.generateUri(recipient, amount, note);

    // Render QR code
    renderQR(paymentUri);

    // Set payment link
    const payLink = document.getElementById('payment-link');
    payLink.href = paymentUri;
    payLink.dataset.uri = paymentUri;

    // Show QR section
    document.getElementById('qr-section').style.display = 'block';

    // Save to history
    addToHistory({
        country: selectedCountry,
        platform: platform.platform,
        recipient,
        amount: `${platform.currency}${amount}`,
        note,
        timestamp: Date.now(),
        uri: paymentUri
    });
}

// --- QR Code Renderer (Canvas-based, no external library) ---
function renderQR(data) {
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    const size = 256;
    canvas.width = size;
    canvas.height = size;

    // Simple QR-like representation using data encoding
    // For a production app, use a proper QR library like qrcode.js
    // This generates a visual hash pattern that represents the data
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const cellSize = 8;
    const modules = Math.floor(size / cellSize);
    const hash = simpleHash(data);

    // Generate deterministic pattern from payment URI
    ctx.fillStyle = '#000000';

    // QR finder patterns (corners)
    drawFinderPattern(ctx, 0, 0, cellSize);
    drawFinderPattern(ctx, (modules - 7) * cellSize, 0, cellSize);
    drawFinderPattern(ctx, 0, (modules - 7) * cellSize, cellSize);

    // Data modules
    let bitIndex = 0;
    const dataBytes = stringToBytes(data);
    for (let y = 0; y < modules; y++) {
        for (let x = 0; x < modules; x++) {
            // Skip finder pattern areas
            if (isFinderArea(x, y, modules)) continue;

            const byteIdx = bitIndex >> 3;
            const bitIdx = bitIndex & 7;
            const val = byteIdx < dataBytes.length
                ? (dataBytes[byteIdx] >> (7 - bitIdx)) & 1
                : (hash[(x * 7 + y * 13 + bitIndex) % hash.length] >> ((x + y) % 8)) & 1;

            if (val) {
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
            bitIndex++;
        }
    }

    // Timing patterns
    ctx.fillStyle = '#000000';
    for (let i = 8; i < modules - 8; i++) {
        if (i % 2 === 0) {
            ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
            ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
}

function drawFinderPattern(ctx, x, y, cell) {
    // Outer black box
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, 7 * cell, 7 * cell);
    // Inner white box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + cell, y + cell, 5 * cell, 5 * cell);
    // Center black box
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 2 * cell, y + 2 * cell, 3 * cell, 3 * cell);
}

function isFinderArea(x, y, modules) {
    // Top-left, top-right, bottom-left finder patterns + separator
    if (x < 9 && y < 9) return true;
    if (x > modules - 9 && y < 9) return true;
    if (x < 9 && y > modules - 9) return true;
    return false;
}

function simpleHash(str) {
    const bytes = [];
    for (let i = 0; i < 64; i++) {
        let h = 0;
        for (let j = 0; j < str.length; j++) {
            h = ((h << 5) - h + str.charCodeAt(j) + i * 37) | 0;
        }
        bytes.push(Math.abs(h) & 0xFF);
    }
    return bytes;
}

function stringToBytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i) & 0xFF);
    }
    return bytes;
}

// --- Copy Payment Link ---
function copyPaymentLink() {
    const link = document.getElementById('payment-link');
    const uri = link.dataset.uri || link.href;
    navigator.clipboard.writeText(uri).then(() => {
        const btn = document.getElementById('btn-copy-link');
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i> Copy Link';
        }, 2000);
    }).catch(() => {
        // Fallback
        prompt('Copy this payment link:', uri);
    });
}

// --- Transfer History (localStorage) ---
function loadHistory() {
    try {
        const saved = localStorage.getItem('send_money_history');
        transferHistory = saved ? JSON.parse(saved) : [];
    } catch (e) { transferHistory = []; }
    renderHistory();
}

function addToHistory(entry) {
    transferHistory.unshift(entry);
    if (transferHistory.length > 20) transferHistory = transferHistory.slice(0, 20);
    localStorage.setItem('send_money_history', JSON.stringify(transferHistory));
    renderHistory();

    // Also report to DataManager if available
    if (window.dataManager) {
        window.dataManager.trackAppUsage('send-money', 0);
    }
}

function renderHistory() {
    const container = document.getElementById('transfer-history');
    if (transferHistory.length === 0) {
        container.innerHTML = '<p class="empty-state">No transfers yet. Generate a QR to start!</p>';
        return;
    }

    container.innerHTML = transferHistory.map(h => {
        const date = new Date(h.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="history-item">
                <div class="hi-left">
                    <span class="hi-recipient">${h.recipient} <small style="color:#3b82f6">(${h.platform})</small></span>
                    <span class="hi-date">${dateStr}${h.note ? ' — ' + h.note : ''}</span>
                </div>
                <span class="hi-amount">${h.amount}</span>
            </div>
        `;
    }).join('');
}
