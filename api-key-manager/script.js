(function () {
  'use strict';

  const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1';

  document.addEventListener('DOMContentLoaded', () => {
    if (window.AppShell) AppShell.init({ appId: 'api-key-manager', title: 'API Key Manager' });

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
      // Also store with flat key for notebook/ai-panel.js compatibility
      if (key) localStorage.setItem('ultrasudo_openrouter_key', key);
      toast($('openrouter-status'), '✅ OpenRouter key saved!', 'success');
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
    };

    $('save-lmstudio').onclick = () => {
      window.setApiKey('lmstudio', {
        baseUrl: $('lmstudio-base').value.trim() || 'http://localhost:1234',
        model: $('lmstudio-model').value.trim()
      }, 'api-key-manager');
      toast($('lmstudio-status'), '✅ LM Studio settings saved!', 'success');
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
      toast($('openrouter-status'), '⏳ Testing...', 'info');
      const ok = await testOpenRouter(cfg);
      toast($('openrouter-status'), ok ? '✅ OpenRouter connected successfully!' : '❌ Test failed — check your key', ok ? 'success' : 'error');
    };

    $('test-gemini').onclick = async () => {
      const cfg = window.getApiKey('gemini') || {};
      toast($('gemini-status'), '⏳ Testing...', 'info');
      const ok = await testGemini(cfg);
      toast($('gemini-status'), ok ? '✅ Gemini connected successfully!' : '❌ Test failed — check your key', ok ? 'success' : 'error');
    };

    $('test-openai').onclick = async () => {
      const cfg = window.getApiKey('openai') || {};
      toast($('openai-status'), '⏳ Testing...', 'info');
      const ok = await testOpenAI(cfg);
      toast($('openai-status'), ok ? '✅ OpenAI connected successfully!' : '❌ Test failed — check your key or billing', ok ? 'success' : 'error');
    };

    $('test-lmstudio').onclick = async () => {
      const cfg = window.getApiKey('lmstudio') || { baseUrl: 'http://localhost:1234' };
      toast($('lmstudio-status'), '⏳ Testing local server...', 'info');
      const ok = await testLMStudio(cfg);
      toast($('lmstudio-status'), ok ? '✅ LM Studio server reachable!' : '❌ Cannot reach LM Studio — make sure the server is running', ok ? 'success' : 'error');
    };

    $('test-av').onclick = async () => {
      const cfg = window.getApiKey('alphavantage') || {};
      toast($('av-status'), '⏳ Testing...', 'info');
      const ok = await testAlphaVantage(cfg);
      toast($('av-status'), ok ? '✅ Alpha Vantage connected!' : '❌ Test failed — check your key', ok ? 'success' : 'error');
    };

    // ── Toast helper ──────────────────────────────────────────────────────────
    function toast(el, msg, type = 'info') {
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
  });
})();
