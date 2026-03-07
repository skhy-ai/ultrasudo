/**
 * VPN — Server selection, connection simulation, and stats
 * The actual VPN tunneling requires Tauri backend (WireGuard/OpenVPN).
 * This UI layer is ready for integration via window.__TAURI__.core.invoke().
 */

const VPN_SERVERS = [
    { id: 'us-ny',    flag: '🇺🇸', country: 'United States', city: 'New York',   ping: 45,  load: 35 },
    { id: 'us-la',    flag: '🇺🇸', country: 'United States', city: 'Los Angeles', ping: 62,  load: 55 },
    { id: 'uk-lon',   flag: '🇬🇧', country: 'United Kingdom', city: 'London',    ping: 38,  load: 42 },
    { id: 'de-fra',   flag: '🇩🇪', country: 'Germany',       city: 'Frankfurt',  ping: 32,  load: 28 },
    { id: 'jp-tok',   flag: '🇯🇵', country: 'Japan',         city: 'Tokyo',      ping: 85,  load: 40 },
    { id: 'sg-sg',    flag: '🇸🇬', country: 'Singapore',     city: 'Singapore',  ping: 22,  load: 30 },
    { id: 'in-mum',   flag: '🇮🇳', country: 'India',         city: 'Mumbai',     ping: 18,  load: 60 },
    { id: 'au-syd',   flag: '🇦🇺', country: 'Australia',     city: 'Sydney',     ping: 110, load: 25 },
    { id: 'br-sao',   flag: '🇧🇷', country: 'Brazil',        city: 'São Paulo',  ping: 140, load: 45 },
    { id: 'nl-ams',   flag: '🇳🇱', country: 'Netherlands',   city: 'Amsterdam',  ping: 30,  load: 38 },
    { id: 'ca-tor',   flag: '🇨🇦', country: 'Canada',        city: 'Toronto',    ping: 52,  load: 32 },
    { id: 'ch-zur',   flag: '🇨🇭', country: 'Switzerland',   city: 'Zürich',     ping: 35,  load: 20 },
    { id: 'kr-sel',   flag: '🇰🇷', country: 'South Korea',   city: 'Seoul',      ping: 78,  load: 50 },
    { id: 'my-kl',    flag: '🇲🇾', country: 'Malaysia',      city: 'Kuala Lumpur', ping: 15, load: 22 },
    { id: 'th-bkk',   flag: '🇹🇭', country: 'Thailand',      city: 'Bangkok',    ping: 20,  load: 35 }
];

let selectedServer = VPN_SERVERS[0];
let isConnected = false;
let isConnecting = false;
let connectionTimer = null;
let connectionSeconds = 0;
let statsInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    renderServers();
    loadSettings();

    document.getElementById('btn-connect').addEventListener('click', toggleConnection);
    document.getElementById('server-search').addEventListener('input', filterServers);

    // Save settings on change
    ['auto-connect', 'kill-switch', 'dns-protection', 'vpn-protocol'].forEach(id => {
        document.getElementById(id).addEventListener('change', saveSettings);
    });
});

// --- Server List ---
function renderServers(filter = '') {
    const list = document.getElementById('server-list');
    const filtered = VPN_SERVERS.filter(s =>
        s.country.toLowerCase().includes(filter) || s.city.toLowerCase().includes(filter)
    );

    list.innerHTML = filtered.map(s => {
        const loadColor = s.load < 40 ? '#10b981' : s.load < 70 ? '#f59e0b' : '#ef4444';
        return `
            <div class="server-item ${selectedServer.id === s.id ? 'selected' : ''}" data-id="${s.id}">
                <span class="server-flag">${s.flag}</span>
                <div class="server-info">
                    <div class="server-name">${s.country}</div>
                    <div class="server-city">${s.city}</div>
                </div>
                <span class="server-ping">${s.ping}ms</span>
                <div class="server-load">
                    <div class="server-load-bar" style="width:${s.load}%; background:${loadColor};"></div>
                </div>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.server-item').forEach(el => {
        el.addEventListener('click', () => {
            const server = VPN_SERVERS.find(s => s.id === el.dataset.id);
            if (server) { selectedServer = server; renderServers(filter); }
        });
    });
}

function filterServers() {
    const q = document.getElementById('server-search').value.toLowerCase();
    renderServers(q);
}

// --- Connection ---
async function toggleConnection() {
    if (isConnecting) return;

    if (isConnected) {
        disconnect();
    } else {
        await connect();
    }
}

async function connect() {
    const ring = document.getElementById('status-ring');
    const btn = document.getElementById('btn-connect');
    const status = document.getElementById('status-text');

    isConnecting = true;
    ring.className = 'status-ring connecting';
    status.textContent = 'Connecting...';
    btn.disabled = true;

    // Try Tauri backend first
    if (window.__TAURI__) {
        try {
            await window.__TAURI__.core.invoke('vpn_connect', {
                serverId: selectedServer.id,
                protocol: document.getElementById('vpn-protocol').value
            });
        } catch (e) {
            console.warn('Tauri VPN backend not available, running in demo mode:', e.message);
        }
    }

    // Simulate connection delay
    await sleep(1500 + Math.random() * 1000);

    isConnecting = false;
    isConnected = true;
    ring.className = 'status-ring connected';
    status.textContent = `Connected — ${selectedServer.city}`;
    btn.innerHTML = '<i class="fas fa-power-off"></i> <span>Disconnect</span>';
    btn.classList.add('connected');
    btn.disabled = false;

    // Show stats
    document.getElementById('stats-panel').style.display = 'block';
    document.getElementById('ip-address').textContent = generateFakeIP();

    // Start timers
    connectionSeconds = 0;
    connectionTimer = setInterval(() => {
        connectionSeconds++;
        const m = String(Math.floor(connectionSeconds / 60)).padStart(2, '0');
        const s = String(connectionSeconds % 60).padStart(2, '0');
        document.getElementById('stat-duration').textContent = `${m}:${s}`;
    }, 1000);

    statsInterval = setInterval(updateStats, 1500);
    updateStats();

    localStorage.setItem('vpn_last_server', selectedServer.id);
}

function disconnect() {
    const ring = document.getElementById('status-ring');
    const btn = document.getElementById('btn-connect');
    const status = document.getElementById('status-text');

    if (window.__TAURI__) {
        try { window.__TAURI__.core.invoke('vpn_disconnect'); } catch (e) {}
    }

    isConnected = false;
    ring.className = 'status-ring';
    status.textContent = 'Disconnected';
    btn.innerHTML = '<i class="fas fa-power-off"></i> <span>Connect</span>';
    btn.classList.remove('connected');

    document.getElementById('stats-panel').style.display = 'none';
    clearInterval(connectionTimer);
    clearInterval(statsInterval);
}

function updateStats() {
    if (!isConnected) return;
    document.getElementById('stat-download').textContent = (Math.random() * 5000 + 200).toFixed(0) + ' KB/s';
    document.getElementById('stat-upload').textContent = (Math.random() * 1000 + 50).toFixed(0) + ' KB/s';
    document.getElementById('stat-latency').textContent = (selectedServer.ping + Math.floor(Math.random() * 10 - 5)) + ' ms';
}

function generateFakeIP() {
    return `${10 + Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// --- Settings ---
function loadSettings() {
    const auto = localStorage.getItem('vpn_auto_connect') === 'true';
    const kill = localStorage.getItem('vpn_kill_switch') === 'true';
    const dns = localStorage.getItem('vpn_dns_protection') !== 'false';
    const protocol = localStorage.getItem('vpn_protocol') || 'wireguard';
    const lastServer = localStorage.getItem('vpn_last_server');

    document.getElementById('auto-connect').checked = auto;
    document.getElementById('kill-switch').checked = kill;
    document.getElementById('dns-protection').checked = dns;
    document.getElementById('vpn-protocol').value = protocol;

    if (lastServer) {
        const srv = VPN_SERVERS.find(s => s.id === lastServer);
        if (srv) { selectedServer = srv; renderServers(); }
    }
}

function saveSettings() {
    localStorage.setItem('vpn_auto_connect', document.getElementById('auto-connect').checked);
    localStorage.setItem('vpn_kill_switch', document.getElementById('kill-switch').checked);
    localStorage.setItem('vpn_dns_protection', document.getElementById('dns-protection').checked);
    localStorage.setItem('vpn_protocol', document.getElementById('vpn-protocol').value);
}
