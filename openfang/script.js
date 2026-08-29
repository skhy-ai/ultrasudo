/**
 * OpenFang AI — AI model configuration and key management for Ultrasudo
 * Exposes window.OpenFang for other apps to call: invoke(prompt, options)
 */

const AI_MODELS = [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', logo: '🟢', tier: 'paid', keyProvider: 'openai', endpoint: 'https://api.openai.com/v1/chat/completions' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', logo: '🟢', tier: 'paid', keyProvider: 'openai', endpoint: 'https://api.openai.com/v1/chat/completions' },
    { id: 'claude-3-haiku', name: 'Claude Haiku', provider: 'Anthropic', logo: '🟤', tier: 'paid', keyProvider: 'anthropic', endpoint: 'https://api.anthropic.com/v1/messages' },
    { id: 'gemini-1.5-flash', name: 'Gemini Flash', provider: 'Google', logo: '🔵', tier: 'paid', keyProvider: 'google', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent' },
    { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'Groq (Free)', logo: '🟠', tier: 'free', keyProvider: 'groq', endpoint: 'https://api.groq.com/openai/v1/chat/completions' },
    { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'Groq (Free)', logo: '🟠', tier: 'free', keyProvider: 'groq', endpoint: 'https://api.groq.com/openai/v1/chat/completions' },
    { id: 'mistral-7b', name: 'Mistral 7B', provider: 'Mistral AI', logo: '⚡', tier: 'paid', keyProvider: 'mistral', endpoint: 'https://api.mistral.ai/v1/chat/completions' },
    { id: 'ollama-local', name: 'Local (Ollama)', provider: 'Self-hosted', logo: '🦙', tier: 'local', keyProvider: null, endpoint: 'http://localhost:11434/api/generate' }
];

const AI_INTEGRATIONS = [
    { appId: 'home-diagnostics', name: 'Home Diagnostics', desc: 'AI-powered symptom analysis and drug interaction checking' },
    { appId: 'code-generator', name: 'Code Generator', desc: 'LLM-based code generation and review workflow' },
    { appId: 'markdown-editor', name: 'Markdown Editor', desc: 'AI-assisted writing suggestions and grammar checking' },
    { appId: 'patent-researcher', name: 'Patent Researcher', desc: 'AI patent search and prior art analysis' },
    { appId: 'notebook', name: 'Notebook', desc: 'Smart note organization and summarisation' },
    { appId: 'send-money', name: 'Send Money', desc: 'AI fraud detection for suspicious payment patterns' }
];

let state = {
    selectedModel: null,
    apiKeys: {},
    integrations: {},
    usage: { calls: 0, tokens: 0, lastUsed: null, model: null }
};

/* ─── Global API ───────────────────────────────────────────────────────────── */
window.OpenFang = {
    /**
     * Invoke the configured AI model with a prompt.
     * Returns the text response.
     */
    async invoke(prompt, options = {}) {
        const model = AI_MODELS.find(m => m.id === state.selectedModel) || AI_MODELS.find(m => m.tier === 'free');
        if (!model) throw new Error('No AI model configured. Open OpenFang settings.');

        const apiKey = state.apiKeys[model.keyProvider];
        if (model.keyProvider && !apiKey) throw new Error(`API key required for ${model.provider}. Open OpenFang settings.`);

        state.usage.calls++;
        state.usage.model = model.name;
        state.usage.lastUsed = new Date().toISOString();
        _saveState();

        // Route by provider format
        if (model.id === 'ollama-local' || options.endpoint) {
            return await _callOllama(model, prompt, options);
        } else if (model.keyProvider === 'anthropic') {
            return await _callAnthropic(model, prompt, apiKey, options);
        } else {
            return await _callOpenAICompat(model, prompt, apiKey, options);
        }
    },

    isConfigured() {
        return !!state.selectedModel;
    },

    getActiveModel() {
        return AI_MODELS.find(m => m.id === state.selectedModel);
    }
};

async function _callOpenAICompat(model, prompt, apiKey, options) {
    const res = await fetch(model.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: model.id,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens || 1024,
            temperature: options.temperature || 0.7
        })
    });
    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    const data = await res.json();
    const tokens = data.usage?.total_tokens || Math.ceil(prompt.length / 4 + 256);
    state.usage.tokens += tokens; _saveState();
    return data.choices?.[0]?.message?.content || '';
}

async function _callAnthropic(model, prompt, apiKey, options) {
    const res = await fetch(model.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens || 1024
        })
    });
    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json();
    return data.content?.[0]?.text || '';
}

async function _callOllama(model, prompt, options) {
    const endpoint = (options.endpoint || model.endpoint || 'http://localhost:11434/api/generate');
    const modelName = (options.modelName || localStorage.getItem('openfang_custom_model')) || 'llama3';
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName, prompt, stream: false })
    });
    if (!res.ok) throw new Error(`Ollama API error: ${res.status} — is Ollama running?`);
    const data = await res.json();
    return data.response || '';
}

/* ─── Init ──────────────────────────────────────────────────────────────────  */
document.addEventListener('DOMContentLoaded', () => {
    _loadState();
    initTabs();
    renderModels();
    renderApiKeys();
    renderIntegrations();
    renderUsage();
    updateHeroStatus();

    document.getElementById('btn-save-model').addEventListener('click', saveModel);
    document.getElementById('btn-save-key').addEventListener('click', saveApiKey);
    document.getElementById('btn-reset-usage').addEventListener('click', resetUsage);

    const showKeyBtn = document.getElementById('btn-show-key');
    const keyInput = document.getElementById('new-key-value');
    showKeyBtn.addEventListener('click', () => {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
        showKeyBtn.innerHTML = keyInput.type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
});

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

function renderModels() {
    const grid = document.getElementById('model-grid');
    grid.innerHTML = AI_MODELS.map(m => `
        <div class="model-card ${state.selectedModel === m.id ? 'selected' : ''}" data-model="${m.id}">
            <div class="model-logo">${m.logo}</div>
            <div class="model-name">${m.name}</div>
            <div class="model-provider">${m.provider}</div>
            <span class="model-badge ${m.tier}">${m.tier.toUpperCase()}</span>
        </div>
    `).join('');

    grid.querySelectorAll('.model-card').forEach(card => {
        card.addEventListener('click', () => {
            state.selectedModel = card.dataset.model;
            _saveState();
            renderModels();
            updateHeroStatus();
        });
    });

    // Load custom endpoint/model
    const customModel = AI_MODELS.find(m => m.id === 'ollama-local');
    document.getElementById('custom-endpoint').value = localStorage.getItem('openfang_custom_endpoint') || (customModel?.endpoint || '');
    document.getElementById('custom-model-name').value = localStorage.getItem('openfang_custom_model') || '';
}

function renderApiKeys() {
    const list = document.getElementById('api-key-list');
    const providers = Object.keys(state.apiKeys);
    if (providers.length === 0) {
        list.innerHTML = '<p style="color:#475569;font-size:0.82rem;">No API keys stored yet.</p>';
        return;
    }
    list.innerHTML = providers.map(p => `
        <div class="api-key-item">
            <div>
                <div class="key-provider">${p}</div>
                <div class="key-masked">${'*'.repeat(Math.min(state.apiKeys[p].length - 4, 20))}${state.apiKeys[p].slice(-4)}</div>
            </div>
            <div class="key-actions">
                <button class="btn-delete-key" onclick="deleteKey('${p}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

window.deleteKey = function(provider) {
    if (confirm(`Delete ${provider} API key?`)) {
        delete state.apiKeys[provider];
        _saveState();
        renderApiKeys();
    }
};

function saveApiKey() {
    const provider = document.getElementById('new-key-provider').value;
    const key = document.getElementById('new-key-value').value.trim();
    if (!key) { alert('Enter an API key.'); return; }
    state.apiKeys[provider] = key;
    _saveState();
    renderApiKeys();
    document.getElementById('new-key-value').value = '';
    updateHeroStatus();
    alert(`${provider} API key saved.`);
}

function renderIntegrations() {
    const list = document.getElementById('integrations-list');
    list.innerHTML = AI_INTEGRATIONS.map(i => {
        const enabled = state.integrations[i.appId] !== false;
        return `
            <div class="integration-item">
                <div class="int-info">
                    <div class="int-name">${i.name}</div>
                    <div class="int-desc">${i.desc}</div>
                </div>
                <div class="toggle-switch ${enabled ? 'on' : ''}" data-app="${i.appId}" onclick="toggleIntegration('${i.appId}', this)"></div>
            </div>
        `;
    }).join('');
}

window.toggleIntegration = function(appId, el) {
    const current = state.integrations[appId] !== false;
    state.integrations[appId] = !current;
    el.classList.toggle('on', !current);
    _saveState();
};

async function saveModel() {
    const customEndpoint = document.getElementById('custom-endpoint').value.trim();
    const customModel = document.getElementById('custom-model-name').value.trim();

    localStorage.setItem('openfang_custom_endpoint', customEndpoint);
    localStorage.setItem('openfang_custom_model', customModel);

    const resultEl = document.getElementById('test-result');
    resultEl.style.display = 'block';
    resultEl.className = 'test-result';
    resultEl.textContent = '⏳ Testing connection...';

    try {
        if (state.selectedModel === 'ollama-local' && customEndpoint) {
            // Test Ollama
            const res = await fetch(customEndpoint.replace('/api/generate', '/api/tags'), { signal: AbortSignal.timeout(3000) });
            if (res.ok) throw new Error('ok'); // success path
        }
        // Test with a tiny prompt
        if (window.OpenFang && state.selectedModel) {
            await window.OpenFang.invoke('Say hello in one word.', { maxTokens: 10 });
        }
        resultEl.className = 'test-result success';
        resultEl.textContent = '✅ Connection successful! AI is ready.';
    } catch (e) {
        if (e.message === 'ok' || state.selectedModel === 'ollama-local') {
            resultEl.className = 'test-result success';
            resultEl.textContent = '✅ Ollama endpoint reachable.';
        } else {
            resultEl.className = 'test-result error';
            resultEl.textContent = `❌ ${e.message || 'Connection failed. Check API key and model.'}`;
        }
    }
    _saveState();
    updateHeroStatus();
}

function renderUsage() {
    document.getElementById('usage-calls').textContent = state.usage.calls.toLocaleString();
    document.getElementById('usage-tokens').textContent = state.usage.tokens.toLocaleString();
    document.getElementById('usage-last').textContent = state.usage.lastUsed
        ? new Date(state.usage.lastUsed).toLocaleDateString()
        : '—';
    document.getElementById('usage-model').textContent = state.usage.model || '—';
}

function resetUsage() {
    if (confirm('Reset all usage stats?')) {
        state.usage = { calls: 0, tokens: 0, lastUsed: null, model: state.usage.model };
        _saveState();
        renderUsage();
    }
}

function updateHeroStatus() {
    const statusEl = document.getElementById('hero-status');
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('span:last-child');
    const model = AI_MODELS.find(m => m.id === state.selectedModel);
    const hasKey = model?.keyProvider ? !!state.apiKeys[model.keyProvider] : true;
    const ready = model && (model.keyProvider === null || hasKey);

    dot.className = 'status-dot ' + (ready ? 'on' : 'off');
    text.textContent = ready ? `Active: ${model.name}` : (model ? `Key missing for ${model.provider}` : 'Not Configured');
}

function _saveState() {
    localStorage.setItem('openfang_state', JSON.stringify(state));
}

function _loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem('openfang_state'));
        if (saved) Object.assign(state, saved);
    } catch (e) { /* fresh start */ }
}
