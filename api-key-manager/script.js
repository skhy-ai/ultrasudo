(function () {
  'use strict';

  const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1';
  let cachedOpenRouterModels = [];
  let currentModalityFilter = 'all';

  document.addEventListener('DOMContentLoaded', () => {
    const keys = (window.getAllApiKeys && window.getAllApiKeys()) || {};
    const $ = (id) => document.getElementById(id);

    // ── Populate saved values ───────────────────────────────────────────────
    if (keys.openrouter) {
      $('openrouter-key').value = keys.openrouter.apiKey || '';
      $('openrouter-model').value = keys.openrouter.model || 'google/gemini-2.0-flash-exp:free';
    }
    if (keys.gemini) {
      $('gemini-key').value = keys.gemini.apiKey || '';
      $('gemini-model').value = keys.gemini.model || 'gemini-2.0-flash';
    }
    if (keys.openai) {
      $('openai-key').value = keys.openai.apiKey || '';
      $('openai-model').value = keys.openai.model || 'gpt-4o-mini';
      $('openai-base').value = keys.openai.baseUrl || 'https://api.openai.com/v1';
    }
    if (keys.lmstudio) {
      $('lmstudio-base').value = keys.lmstudio.baseUrl || 'http://localhost:1234';
      $('lmstudio-model').value = keys.lmstudio.model || '';
    }
    if (keys.alphavantage) {
      $('av-key').value = keys.alphavantage.apiKey || '';
    }

    updateQuotaBadges();

    // ── Eye toggle (show/hide password fields) ───────────────────────────────
    document.querySelectorAll('.btn-eye').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = $(btn.dataset.target);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
      });
    });

    // ── Save handlers ────────────────────────────────────────────────────────
    $('save-openrouter').onclick = () => {
      const key = $('openrouter-key').value.trim();
      window.setApiKey('openrouter', {
        apiKey: key,
        model: $('openrouter-model').value.trim() || 'google/gemini-2.0-flash-exp:free',
        baseUrl: OPENROUTER_ENDPOINT
      }, 'api-key-manager');
      if (key) localStorage.setItem('ultrasudo_openrouter_key', key);
      toast($('openrouter-status'), '✅ OpenRouter key saved!', 'success');
      updateQuotaBadges();
    };

    $('save-gemini').onclick = () => {
      const key = $('gemini-key').value.trim();
      window.setApiKey('gemini', {
        apiKey: key,
        model: $('gemini-model').value.trim() || 'gemini-2.0-flash',
        baseUrl: 'https://generativelanguage.googleapis.com'
      }, 'api-key-manager');
      if (key) {
        localStorage.setItem('ultrasudo_gemini_key', key);
        localStorage.setItem('gemini_api_key', key);
      }
      toast($('gemini-status'), '✅ Gemini key saved!', 'success');
      updateQuotaBadges();
    };

    $('save-openai').onclick = () => {
      const key = $('openai-key').value.trim();
      window.setApiKey('openai', {
        apiKey: key,
        model: $('openai-model').value.trim() || 'gpt-4o-mini',
        baseUrl: $('openai-base').value.trim() || 'https://api.openai.com/v1'
      }, 'api-key-manager');
      if (key) localStorage.setItem('ultrasudo_api_key', key);
      toast($('openai-status'), '✅ OpenAI key saved!', 'success');
      updateQuotaBadges();
    };

    $('save-lmstudio').onclick = () => {
      window.setApiKey('lmstudio', {
        baseUrl: $('lmstudio-base').value.trim() || 'http://localhost:1234',
        model: $('lmstudio-model').value.trim()
      }, 'api-key-manager');
      toast($('lmstudio-status'), '✅ LM Studio settings saved!', 'success');
      updateQuotaBadges();
    };

    $('save-av').onclick = () => {
      const key = $('av-key').value.trim();
      window.setApiKey('alphavantage', { apiKey: key }, 'api-key-manager');
      if (key) localStorage.setItem('alphavantage_api_key', key);
      toast($('av-status'), '✅ Alpha Vantage key saved!', 'success');
    };

    // ── Test handlers ─────────────────────────────────────────────────────────
    $('test-openrouter').onclick = async () => {
      const cfg = window.getApiKey('openrouter') || {};
      toast($('openrouter-status'), '⏳ Testing OpenRouter connection...', 'info');
      const ok = await testOpenRouter(cfg);
      toast($('openrouter-status'), ok ? '✅ OpenRouter connected successfully!' : '❌ Test failed — check your key', ok ? 'success' : 'error');
    };

    $('test-gemini').onclick = async () => {
      const cfg = window.getApiKey('gemini') || {};
      toast($('gemini-status'), '⏳ Testing Gemini...', 'info');
      const ok = await testGemini(cfg);
      toast($('gemini-status'), ok ? '✅ Gemini connected successfully!' : '❌ Test failed — check your key', ok ? 'success' : 'error');
    };

    $('test-openai').onclick = async () => {
      const cfg = window.getApiKey('openai') || {};
      toast($('openai-status'), '⏳ Testing OpenAI...', 'info');
      const ok = await testOpenAI(cfg);
      toast($('openai-status'), ok ? '✅ OpenAI connected successfully!' : '❌ Test failed — check key or billing', ok ? 'success' : 'error');
    };

    $('test-lmstudio').onclick = async () => {
      const cfg = window.getApiKey('lmstudio') || { baseUrl: 'http://localhost:1234' };
      toast($('lmstudio-status'), '⏳ Testing local LM Studio server...', 'info');
      const ok = await testLMStudio(cfg);
      toast($('lmstudio-status'), ok ? '✅ LM Studio server reachable!' : '❌ Cannot reach LM Studio — check server status', ok ? 'success' : 'error');
    };

    $('test-av').onclick = async () => {
      const cfg = window.getApiKey('alphavantage') || {};
      toast($('av-status'), '⏳ Testing Alpha Vantage...', 'info');
      const ok = await testAlphaVantage(cfg);
      toast($('av-status'), ok ? '✅ Alpha Vantage connected!' : '❌ Test failed — check your key', ok ? 'success' : 'error');
    };

    // ── Fetch OpenRouter Models Button ──
    const fetchBtn = $('btn-fetch-openrouter-models');
    if (fetchBtn) {
      fetchBtn.onclick = () => fetchOpenRouterModels(currentModalityFilter);
    }

    // Listen for global quota exhaustion events
    window.addEventListener('aiQuotaExhausted', () => {
      updateQuotaBadges();
    });
  });

  // ── OpenRouter Dynamic Models Explorer ────────────────────────────────────
  window.fetchOpenRouterModels = async function (modality = 'all') {
    const listEl = document.getElementById('openrouter-model-list');
    if (!listEl) return;

    listEl.innerHTML = '<div style="font-size:12px; color:#818cf8; text-align:center; padding:15px;"><i class="fas fa-circle-notch fa-spin"></i> Fetching live models from OpenRouter API...</div>';

    let url = `${OPENROUTER_ENDPOINT}/models`;
    if (modality && modality !== 'all') {
      url += `?output_modalities=${encodeURIComponent(modality)}`;
    }

    try {
      const keyObj = window.getApiKey('openrouter') || {};
      const headers = { 'HTTP-Referer': window.location.origin, 'X-Title': 'Ultrasudo' };
      if (keyObj.apiKey) headers['Authorization'] = `Bearer ${keyObj.apiKey}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && Array.isArray(data.data)) {
        cachedOpenRouterModels = data.data;
        renderOpenRouterModelList(cachedOpenRouterModels);
      } else {
        listEl.innerHTML = '<div style="font-size:12px; color:#f87171; text-align:center; padding:15px;">Failed to parse OpenRouter models.</div>';
      }
    } catch (e) {
      listEl.innerHTML = `<div style="font-size:12px; color:#f87171; text-align:center; padding:15px;">Error fetching OpenRouter models: ${e.message}</div>`;
    }
  };

  window.filterOpenRouterModality = function (modality, tabBtn) {
    currentModalityFilter = modality;
    document.querySelectorAll('.modality-tab').forEach(b => b.classList.remove('active'));
    if (tabBtn) tabBtn.classList.add('active');

    window.fetchOpenRouterModels(modality);
  };

  function renderOpenRouterModelList(models) {
    const listEl = document.getElementById('openrouter-model-list');
    const selectedModel = document.getElementById('openrouter-model')?.value || '';

    if (!models || models.length === 0) {
      listEl.innerHTML = '<div style="font-size:12px; color:#64748b; text-align:center; padding:15px;">No models found for this modality.</div>';
      return;
    }

    let html = '';
    models.slice(0, 50).forEach(m => {
      const isFree = m.id.endsWith(':free') || (m.pricing && m.pricing.prompt === '0' && m.pricing.completion === '0');
      const isSelected = m.id === selectedModel;
      
      html += `
        <div class="model-explorer-item ${isSelected ? 'selected' : ''}" onclick="selectOpenRouterModel('${m.id.replace(/'/g, "\\'")}')">
          <div>
            <div class="model-explorer-name">${m.name || m.id} ${isFree ? '<span class="badge free">FREE</span>' : ''}</div>
            <div class="model-explorer-id">${m.id}</div>
          </div>
          <button class="btn-test" style="padding:3px 8px; font-size:11px;">Select</button>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  window.selectOpenRouterModel = function (modelId) {
    const input = document.getElementById('openrouter-model');
    if (input) {
      input.value = modelId;
      toast(document.getElementById('openrouter-status'), `Selected model: ${modelId}. Click Save to persist.`, 'info');
      renderOpenRouterModelList(cachedOpenRouterModels);
    }
  };

  // ── Quota Badges & Resets ──────────────────────────────────────────────────
  function updateQuotaBadges() {
    const quotaMap = (window.aiProviderEngine && window.aiProviderEngine.loadQuotaStatus()) || {};
    const allKeys = (window.getAllApiKeys && window.getAllApiKeys()) || {};

    const providers = ['openrouter', 'gemini', 'openai', 'lmstudio'];

    providers.forEach(p => {
      const badge = document.getElementById(`${p}-quota-badge`);
      if (!badge) return;

      const config = allKeys[p] || {};
      const hasKey = p === 'lmstudio' ? true : !!config.apiKey;

      if (!hasKey) {
        badge.className = 'quota-badge unconfigured';
        badge.innerHTML = '⚪ Key Missing';
      } else if (quotaMap[p] && quotaMap[p].status === 'quota_exhausted') {
        const remainingMins = Math.ceil((quotaMap[p].cooldownUntil - Date.now()) / 60000);
        badge.className = 'quota-badge exhausted';
        badge.innerHTML = `⚠️ Quota Exhausted (${remainingMins > 0 ? remainingMins + 'm' : 'Cooldown'})`;
      } else {
        badge.className = 'quota-badge active';
        badge.innerHTML = '🟢 Active';
      }
    });
  }

  window.resetQuota = function (providerKey) {
    if (window.aiProviderEngine) {
      window.aiProviderEngine.resetQuotaStatus(providerKey);
      updateQuotaBadges();
      toast(document.getElementById(`${providerKey}-status`), `✅ Quota status reset for ${providerKey}`, 'success');
    }
  };

  // ── Toast helper ──────────────────────────────────────────────────────────
  function toast(el, msg, type = 'info') {
    if (!el) return;
    el.textContent = msg;
    el.className = `status-msg ${type}`;
    setTimeout(() => { el.textContent = ''; el.className = 'status-msg'; }, 5000);
  }

  // ── Test functions ────────────────────────────────────────────────────────
  async function testOpenRouter({ apiKey }) {
    if (!apiKey) return false;
    try {
      const res = await fetch(`${OPENROUTER_ENDPOINT}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Ultrasudo'
        }
      });
      return res.ok;
    } catch { return false; }
  }

  async function testGemini({ apiKey }) {
    if (!apiKey) return false;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      return res.ok;
    } catch { return false; }
  }

  async function testOpenAI({ apiKey, baseUrl }) {
    if (!apiKey) return false;
    try {
      const url = (baseUrl || 'https://api.openai.com/v1') + '/models';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return res.ok;
    } catch { return false; }
  }

  async function testLMStudio({ baseUrl }) {
    try {
      const url = (baseUrl || 'http://localhost:1234') + '/v1/models';
      const res = await fetch(url);
      return res.ok;
    } catch { return false; }
  }

  async function testAlphaVantage({ apiKey }) {
    if (!apiKey) return false;
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      if (!res.ok) return false;
      const data = await res.json();
      return !!data['Global Quote'];
    } catch { return false; }
  }

})();
