(function () {
  'use strict';

  let currentProviderId = 'anthropic';
  let cachedModels = {};
  let currentModalityFilter = 'all';

  document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    selectProvider(currentProviderId);
    setupEventListeners();
  });

  const $ = (id) => document.getElementById(id);

  function getAllStoredKeys() {
    return (window.dataManager && window.dataManager.getAllApiKeys && window.dataManager.getAllApiKeys()) || {};
  }

  function getProviderStoredData(providerId) {
    const keys = getAllStoredKeys();
    return keys[providerId] || {};
  }

  // ── Sidebar Provider List ──
  function initSidebar() {
    const listEl = $('provider-sidebar-list');
    if (!listEl) return;

    const providers = window.AI_PROVIDERS || {};
    const keys = getAllStoredKeys();

    const sortedList = Object.keys(providers).map(id => {
      const p = providers[id];
      const stored = keys[id] || {};
      const priority = typeof stored.priority === 'number' ? stored.priority : (stored.priority ? parseInt(stored.priority, 10) : 50);
      const isEnabled = stored.enabled !== false;
      const hasKey = id === 'lmstudio' || id === 'vidur' ? true : !!(stored.apiKey || (window.getApiKey && window.getApiKey(id)));
      return { id, config: p, stored, priority, isEnabled, hasKey };
    }).sort((a, b) => a.priority - b.priority);

    let html = '';
    sortedList.forEach(item => {
      const p = item.config;
      let statusClass = 'unconfigured';
      if (!item.isEnabled) statusClass = 'disabled';
      else if (item.hasKey) statusClass = 'active';

      html += `
        <div class="sidebar-provider-item ${item.id === currentProviderId ? 'active' : ''}" data-id="${item.id}" onclick="selectProvider('${item.id}')">
          <div class="provider-item-left">
            <div class="provider-item-icon" style="background:${getProviderGradient(item.id)};">
              <i class="${p.icon || 'fas fa-robot'}"></i>
            </div>
            <div>
              <div class="provider-item-name">${p.name}</div>
              <div class="provider-item-model">${item.stored.model || p.model || 'Default'}</div>
            </div>
          </div>
          <div class="provider-item-right">
            <span class="rank-badge">#${item.priority}</span>
            <span class="status-dot ${statusClass}" title="${statusClass.toUpperCase()}"></span>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  function getProviderGradient(id) {
    const map = {
      anthropic: 'linear-gradient(135deg, #d97706, #b45309)',
      gemini: 'linear-gradient(135deg, #4285f4, #0f9d58)',
      openai: 'linear-gradient(135deg, #10a37f, #0d8a6c)',
      openrouter: 'linear-gradient(135deg, #7c3aed, #6366f1)',
      nvidia: 'linear-gradient(135deg, #76b900, #4c7b00)',
      kimi: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      deepseek: 'linear-gradient(135deg, #0284c7, #0369a1)',
      groq: 'linear-gradient(135deg, #f97316, #c2410c)',
      mistral: 'linear-gradient(135deg, #f43f5e, #be123c)',
      lmstudio: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      vidur: 'linear-gradient(135deg, #64748b, #334155)',
      alphavantage: 'linear-gradient(135deg, #14b8a6, #0d9488)'
    };
    return map[id] || 'linear-gradient(135deg, #6366f1, #7c3aed)';
  }

  // ── Select Provider ──
  window.selectProvider = function (providerId) {
    currentProviderId = providerId;
    const p = (window.AI_PROVIDERS && window.AI_PROVIDERS[providerId]) || {};
    const stored = getProviderStoredData(providerId);

    // Update Top Bar
    $('selected-provider-title').textContent = p.name || providerId;
    $('selected-provider-desc').textContent = p.description || '';
    $('current-priority-badge').textContent = `#${stored.priority || 50}`;
    $('provider-enable-toggle').checked = stored.enabled !== false;
    $('toggle-state-text').textContent = stored.enabled !== false ? 'Enabled' : 'Disabled';

    // Update Form Inputs
    $('provider-key-input').value = stored.apiKey || (window.getApiKey && window.getApiKey(providerId)) || '';
    $('provider-model-input').value = stored.model || p.model || '';
    $('provider-baseurl-input').value = stored.baseUrl || p.endpoint || '';
    $('key-hint-text').textContent = p.keyPrefix ? `Prefix: ${p.keyPrefix}...` : '';

    const linkEl = $('get-key-link');
    if (linkEl) {
      const links = {
        anthropic: 'https://console.anthropic.com/',
        gemini: 'https://aistudio.google.com/apikey',
        openai: 'https://platform.openai.com/api-keys',
        openrouter: 'https://openrouter.ai/keys',
        nvidia: 'https://build.nvidia.com/',
        kimi: 'https://platform.moonshot.cn/',
        deepseek: 'https://platform.deepseek.com/',
        groq: 'https://console.groq.com/keys',
        mistral: 'https://console.mistral.ai/',
        lmstudio: 'https://lmstudio.ai/'
      };
      linkEl.href = links[providerId] || '#';
    }

    // Refresh Sidebar Highlights
    document.querySelectorAll('.sidebar-provider-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === providerId);
    });

    // Clear Discovery List
    renderDiscoveryList(cachedModels[providerId] || []);
  };

  // ── Event Listeners ──
  function setupEventListeners() {
    // Eye Toggle
    document.querySelectorAll('.btn-eye').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = $(btn.dataset.target);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
      });
    });

    // Search Filter
    const searchInput = $('provider-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('.sidebar-provider-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(q) ? 'flex' : 'none';
        });
      });
    }

    // Enabled Toggle Switch
    const toggle = $('provider-enable-toggle');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        $('toggle-state-text').textContent = enabled ? 'Enabled' : 'Disabled';
        saveCurrentProvider({ enabled });
      });
    }

    // Priority Rank Buttons
    $('btn-rank-up').onclick = () => changePriority(-1);
    $('btn-rank-down').onclick = () => changePriority(1);

    // Save Button
    $('btn-save-provider').onclick = () => {
      const apiKey = $('provider-key-input').value.trim();
      const model = $('provider-model-input').value.trim();
      const baseUrl = $('provider-baseurl-input').value.trim();
      saveCurrentProvider({ apiKey, model, baseUrl });
      toast('✅ Provider settings saved successfully!', 'success');
    };

    // Test Button
    $('btn-test-provider').onclick = async () => {
      toast('⏳ Testing connection to provider API...', 'info');
      const ok = await testCurrentProvider();
      toast(ok ? '✅ Provider API connection successful!' : '❌ Connection failed — check API key or endpoint', ok ? 'success' : 'error');
    };

    // Reset Quota Button
    $('btn-reset-quota').onclick = () => {
      if (window.aiProviderEngine && window.aiProviderEngine.resetQuotaStatus) {
        window.aiProviderEngine.resetQuotaStatus(currentProviderId);
      }
      initSidebar();
      toast(`✅ Quota status reset for ${currentProviderId}`, 'success');
    };

    // Discover Models Button
    $('btn-discover-models').onclick = () => discoverModelsForProvider(currentProviderId);

    // Modality Tabs
    document.querySelectorAll('.modality-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.modality-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentModalityFilter = tab.dataset.modality || 'all';
        renderDiscoveryList(cachedModels[currentProviderId] || []);
      });
    });
  }

  function changePriority(delta) {
    const stored = getProviderStoredData(currentProviderId);
    let currentPriority = typeof stored.priority === 'number' ? stored.priority : 50;
    let newPriority = Math.max(1, currentPriority + delta);
    saveCurrentProvider({ priority: newPriority });
    $('current-priority-badge').textContent = `#${newPriority}`;
  }

  function saveCurrentProvider(overrides = {}) {
    if (window.dataManager && window.dataManager.setApiKey) {
      const existing = getProviderStoredData(currentProviderId);
      const updated = { ...existing, ...overrides };
      window.dataManager.setApiKey(currentProviderId, updated, 'api-key-manager');
      if (updated.apiKey && window.setApiKey) {
        window.setApiKey(updated.apiKey, currentProviderId);
      }
    }
    initSidebar();
  }

  // ── Dynamic Model Discovery Engine ──
  async function discoverModelsForProvider(providerId) {
    const listEl = $('model-discovery-list');
    listEl.innerHTML = '<div style="text-align:center; padding:20px; color:#818cf8;"><i class="fas fa-circle-notch fa-spin"></i> Discovering live models from API...</div>';

    const p = (window.AI_PROVIDERS && window.AI_PROVIDERS[providerId]) || {};
    const stored = getProviderStoredData(providerId);
    const apiKey = $('provider-key-input').value.trim() || stored.apiKey;
    const baseUrl = $('provider-baseurl-input').value.trim() || stored.modelsEndpoint || stored.endpoint;

    try {
      let models = [];

      if (providerId === 'anthropic') {
        // Fallback Anthropic models list if CORS / direct fetch restricted
        models = [
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)', type: 'code' },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)', type: 'chat' },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Complex reasoning)', type: 'code' }
        ];
      } else if (providerId === 'gemini') {
        if (!apiKey) throw new Error('Gemini API key is required to fetch models');
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.models) {
          models = data.models.map(m => ({
            id: m.name.replace('models/', ''),
            name: m.displayName || m.name,
            type: m.supportedGenerationMethods?.includes('generateContent') ? 'chat' : 'all'
          }));
        }
      } else {
        // Standard OpenAI-compatible models endpoint (/v1/models)
        let endpoint = baseUrl.includes('/models') ? baseUrl : `${baseUrl.replace(/\/+$/, '').replace(/\/chat\/completions$/, '')}/models`;
        const headers = {};
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        if (providerId === 'openrouter') {
          headers['HTTP-Referer'] = window.location.origin;
          headers['X-Title'] = 'UltraSudo';
        }

        const res = await fetch(endpoint, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          models = data.data.map(m => ({
            id: m.id,
            name: m.name || m.id,
            type: m.id.includes('free') ? 'free' : (m.id.includes('code') || m.id.includes('r1') ? 'code' : 'chat')
          }));
        }
      }

      cachedModels[providerId] = models;
      renderDiscoveryList(models);

    } catch (e) {
      listEl.innerHTML = `<div style="text-align:center; padding:20px; color:#f87171;">Failed to discover models: ${e.message}</div>`;
    }
  }

  function renderDiscoveryList(models) {
    const listEl = $('model-discovery-list');
    if (!listEl) return;

    if (!models || models.length === 0) {
      listEl.innerHTML = `
        <div class="empty-explorer-state">
          <i class="fas fa-compass"></i>
          <p>Click <strong>"Discover Models"</strong> to query live models directly from this provider's API.</p>
        </div>
      `;
      return;
    }

    let filtered = models;
    if (currentModalityFilter !== 'all') {
      filtered = models.filter(m => m.type === currentModalityFilter || m.id.toLowerCase().includes(currentModalityFilter));
    }

    const activeModel = $('provider-model-input').value.trim();

    let html = '';
    filtered.slice(0, 40).forEach(m => {
      const isSelected = m.id === activeModel;
      html += `
        <div class="model-explorer-item ${isSelected ? 'selected' : ''}" onclick="selectDiscoveredModel('${m.id.replace(/'/g, "\\'")}')">
          <div>
            <div class="model-name">${m.name || m.id}</div>
            <div class="model-id">${m.id}</div>
          </div>
          <button class="btn-action btn-secondary" style="padding:4px 10px; font-size:11px;">
            ${isSelected ? 'Selected' : 'Use Model'}
          </button>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  window.selectDiscoveredModel = function (modelId) {
    $('provider-model-input').value = modelId;
    saveCurrentProvider({ model: modelId });
    renderDiscoveryList(cachedModels[currentProviderId] || []);
    toast(`Selected model: ${modelId}`, 'info');
  };

  // ── Connection Testing ──
  async function testCurrentProvider() {
    const key = $('provider-key-input').value.trim();
    const model = $('provider-model-input').value.trim();
    const url = $('provider-baseurl-input').value.trim();

    try {
      if (currentProviderId === 'anthropic') {
        if (!key) return false;
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-sonnet-20241022',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'hi' }]
          })
        });
        return res.ok || res.status === 400; // 400 means API key verified, request bad
      } else if (currentProviderId === 'gemini') {
        if (!key) return false;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        return res.ok;
      } else {
        const targetUrl = url.includes('/models') ? url : `${url.replace(/\/+$/, '').replace(/\/chat\/completions$/, '')}/models`;
        const headers = {};
        if (key) headers['Authorization'] = `Bearer ${key}`;
        const res = await fetch(targetUrl, { headers });
        return res.ok;
      }
    } catch {
      return false;
    }
  }

  // ── Toast Helper ──
  function toast(msg, type = 'info') {
    const el = $('provider-status-msg');
    if (!el) return;
    el.textContent = msg;
    el.className = `status-msg ${type}`;
    setTimeout(() => { el.textContent = ''; el.className = 'status-msg'; }, 4000);
  }

})();
