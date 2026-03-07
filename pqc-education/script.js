/**
 * PQC Explorer — Post-Quantum Cryptography education and settings
 * Tabs: Learn, Algorithms, Settings, Demo
 */

// --- NIST Approved Algorithms Data ---
const PQC_ALGORITHMS = [
    {
        name: 'ML-KEM (CRYSTALS-Kyber)',
        type: 'Key Encapsulation (KEM)',
        badge: 'KEM',
        standard: 'FIPS 203',
        description: 'Lattice-based key encapsulation mechanism. Primary choice for key exchange. Based on the hardness of Module Learning With Errors (MLWE) problem. Three security levels: ML-KEM-512, ML-KEM-768, ML-KEM-1024.'
    },
    {
        name: 'ML-DSA (CRYSTALS-Dilithium)',
        type: 'Digital Signature',
        badge: 'SIG',
        standard: 'FIPS 204',
        description: 'Lattice-based digital signature scheme. Primary signature algorithm. Also based on MLWE. Provides three security levels with compact signatures compared to other PQC signature schemes.'
    },
    {
        name: 'SLH-DSA (SPHINCS+)',
        type: 'Digital Signature',
        badge: 'SIG',
        standard: 'FIPS 205',
        description: 'Hash-based stateless digital signature. Backup option relying only on hash function security — the most conservative choice. Larger signatures but minimal cryptographic assumptions.'
    },
    {
        name: 'FN-DSA (FALCON)',
        type: 'Digital Signature',
        badge: 'SIG',
        standard: 'Draft FIPS 206',
        description: 'Lattice-based digital signature using NTRU lattices. Provides very compact signatures. Still in draft standard phase. Recommended when bandwidth is critical.'
    },
    {
        name: 'HQC',
        type: 'Key Encapsulation (KEM)',
        badge: 'KEM',
        standard: 'Round 4 Finalist',
        description: 'Code-based key encapsulation mechanism. Selected as backup KEM to ML-KEM. Based on quasi-cyclic codes rather than lattices, providing algorithm diversity.'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    renderAlgorithms();
    initSettings();
    initDemo();
});

// --- Tab Navigation ---
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const panel = document.getElementById('tab-' + btn.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });
}

// --- Algorithms ---
function renderAlgorithms() {
    const container = document.getElementById('algo-list');
    container.innerHTML = PQC_ALGORITHMS.map(algo => `
        <div class="algo-card">
            <div class="algo-badge ${algo.badge.toLowerCase()}">${algo.badge}</div>
            <div class="algo-info">
                <h4>${algo.name}</h4>
                <div class="algo-type">${algo.type} — ${algo.standard}</div>
                <p>${algo.description}</p>
            </div>
        </div>
    `).join('');
}

// --- Settings ---
function initSettings() {
    const pqcToggle = document.getElementById('enable-pqc');
    const cloudPqc = document.getElementById('enable-cloud-pqc');
    const keySection = document.getElementById('key-section');
    const keyDisplay = document.getElementById('device-key');

    // Load current state
    pqcToggle.checked = localStorage.getItem('enable_pqc') === 'true';
    cloudPqc.checked = localStorage.getItem('enable_cloud_pqc') === 'true';

    if (pqcToggle.checked) {
        keySection.style.display = 'block';
        const key = localStorage.getItem('pqc_device_key');
        keyDisplay.textContent = key || 'Not generated';
    }

    pqcToggle.addEventListener('change', () => {
        localStorage.setItem('enable_pqc', pqcToggle.checked ? 'true' : 'false');
        keySection.style.display = pqcToggle.checked ? 'block' : 'none';

        if (pqcToggle.checked && !localStorage.getItem('pqc_device_key')) {
            generateNewKey();
        } else {
            keyDisplay.textContent = localStorage.getItem('pqc_device_key') || 'Not generated';
        }
    });

    cloudPqc.addEventListener('change', () => {
        localStorage.setItem('enable_cloud_pqc', cloudPqc.checked ? 'true' : 'false');
    });

    document.getElementById('btn-generate-key').addEventListener('click', () => {
        if (confirm('Generating a new key will make previously encrypted data unrecoverable. Continue?')) {
            generateNewKey();
        }
    });

    document.getElementById('btn-copy-key').addEventListener('click', () => {
        const key = localStorage.getItem('pqc_device_key');
        if (key) {
            navigator.clipboard.writeText(key).then(() => {
                alert('Key copied to clipboard. Store it safely!');
            });
        }
    });
}

function generateNewKey() {
    const keyBytes = crypto.getRandomValues(new Uint8Array(32));
    const hexKey = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('pqc_device_key', hexKey);
    document.getElementById('device-key').textContent = hexKey;
}

// --- Demo ---
function initDemo() {
    document.getElementById('btn-encrypt-demo').addEventListener('click', encryptDemo);
    document.getElementById('btn-decrypt-demo').addEventListener('click', decryptDemo);
}

async function encryptDemo() {
    const plaintext = document.getElementById('demo-plaintext').value;
    if (!plaintext) { alert('Enter some text to encrypt.'); return; }

    try {
        const key = await getOrCreateDemoKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(plaintext);
        const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

        const cipherArr = new Uint8Array(cipher);
        const combined = new Uint8Array(iv.length + cipherArr.length);
        combined.set(iv);
        combined.set(cipherArr, iv.length);

        const b64 = btoa(String.fromCharCode(...combined));
        document.getElementById('demo-ciphertext').value = 'PQC:v1:' + b64;
        document.getElementById('demo-decrypted').value = '';
    } catch (e) {
        alert('Encryption failed: ' + e.message);
    }
}

async function decryptDemo() {
    const ciphertext = document.getElementById('demo-ciphertext').value;
    if (!ciphertext || !ciphertext.startsWith('PQC:v1:')) {
        alert('No valid ciphertext to decrypt.');
        return;
    }

    try {
        const key = await getOrCreateDemoKey();
        const raw = atob(ciphertext.substring(7));
        const combined = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) combined[i] = raw.charCodeAt(i);

        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        document.getElementById('demo-decrypted').value = new TextDecoder().decode(decrypted);
    } catch (e) {
        document.getElementById('demo-decrypted').value = '❌ Decryption failed — key mismatch or corrupted data.';
    }
}

async function getOrCreateDemoKey() {
    let hex = localStorage.getItem('pqc_device_key');
    if (!hex) {
        generateNewKey();
        hex = localStorage.getItem('pqc_device_key');
    }
    const raw = new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}
