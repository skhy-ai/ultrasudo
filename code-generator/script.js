(() => {
  const $ = (id) => document.getElementById(id);
  const providerSel = $('provider');
  const modelInput = $('model');
  const apiStatus = $('api-status');
  const promptInput = $('prompt-input');
  const testsContainer = $('tests-container');
  const genTestsBtn = $('gen-tests');
  const acceptTestsBtn = $('accept-tests');
  const regenTestsBtn = $('regen-tests');
  const filenameInput = $('filename');
  const generateBtn = $('generate-btn');
  const outputEl = $('response-output');

  document.addEventListener('DOMContentLoaded', () => {
    $('test-api').addEventListener('click', testApi);
    genTestsBtn.addEventListener('click', onGenerateTests);
    acceptTestsBtn.addEventListener('click', onAcceptTests);
    regenTestsBtn.addEventListener('click', onGenerateTests);
    generateBtn.addEventListener('click', onGenerateFile);
    // Prefill model based on provider stored config
    syncModelFromKeys();
    providerSel.addEventListener('change', syncModelFromKeys);
  });

  function syncModelFromKeys() {
    try {
      const p = providerSel.value;
      const cfg = window.getApiKey ? window.getApiKey(p) : null;
      modelInput.placeholder = cfg?.model || (p === 'lmstudio' ? '(server default)' : '');
    } catch { }
  }

  function setApiMsg(msg) { apiStatus.textContent = msg; setTimeout(() => apiStatus.textContent = '', 5000); }

  async function testApi() {
    const p = providerSel.value;
    const cfg = window.getApiKey ? window.getApiKey(p) : {};
    let ok = false;
    try {
      if (p === 'openai') {
        ok = await fetch((cfg.baseUrl || 'https://api.openai.com/v1') + '/models', { headers: { Authorization: `Bearer ${cfg.apiKey || ''}` } }).then(r => r.ok);
      } else if (p === 'gemini') {
        const url = (cfg.baseUrl || 'https://generativelanguage.googleapis.com') + '/v1beta/models?key=' + encodeURIComponent(cfg.apiKey || '');
        ok = await fetch(url).then(r => r.ok);
      } else if (p === 'lmstudio') {
        ok = await fetch((cfg.baseUrl || 'http://localhost:1234') + '/v1/models').then(r => r.ok);
      }
    } catch { }
    setApiMsg(ok ? 'API OK' : 'API test failed');
  }

  // State
  let generatedBlueprint = "";

  async function onGenerateTests() {
    const prompt = (promptInput.value || '').trim();
    if (!prompt) { alert('Enter a prompt first.'); return; }
    setTestsLoading(true);
    document.getElementById('stage-2').style.display = 'block';
    setTimeout(() => document.getElementById('stage-2').style.opacity = '1', 10);

    try {
      const systemPrompt = `You are an expert software architect. Given the following app description, generate a comprehensive blueprint. The blueprint MUST include these sections:
      1. Testcases
      2. README.md (project overview)
      3. Architecture.md (design decisions)
      4. Task-to-do list
      5. Implementation Plan
      
      Respond only with cleanly formatted Markdown. Do not include introductory text.
      `;
      generatedBlueprint = await callLLM(`${systemPrompt}\n\nApp Description:\n${prompt}`);
      testsContainer.innerHTML = `<pre><code>${escapeHtml(generatedBlueprint)}</code></pre>`;
    } catch (e) {
      testsContainer.innerHTML = '<div class="err">Failed to generate artifacts. Please try again.</div>';
      console.error(e);
    } finally { setTestsLoading(false); }
  }

  function setTestsLoading(loading) { testsContainer.innerHTML = loading ? '<div class="loading">Generating Blueprint Artifacts...</div>' : testsContainer.innerHTML; }

  async function onAcceptTests() {
    if (!generatedBlueprint) { alert('Please generate a blueprint first.'); return; }

    const approveBtn = $('accept-tests');
    const cliOutput = $('cli-output');
    const outLog = $('response-output');

    approveBtn.disabled = true;
    approveBtn.textContent = 'Executing Opencode...';
    cliOutput.style.display = 'block';
    outLog.textContent = 'Initializing workspace with Opencode-AI...\n';

    try {
      if (window.__TAURI__) {
        // Write the blueprint to a temporary file locally or pass it directly. Pass directly.
        await window.__TAURI__.core.invoke('execute_cli', {
          command: 'npx.cmd', // Windows standard
          args: ['opencode-ai', 'run', generatedBlueprint]
        });
        outLog.textContent += '\n\nOpencode triggered successfully in the background.';
      } else {
        outLog.textContent += '\n\nWeb Environment Detected. Native execution bypassed.\n' + generatedBlueprint;
      }
    } catch (e) {
      outLog.textContent += '\n\nError executing CLI: ' + e;
    } finally {
      approveBtn.textContent = 'Approved & Running';
    }
  }

  async function callLLM(userContent) {
    const provider = providerSel.value;
    const cfg = window.getApiKey ? (window.getApiKey(provider) || {}) : {};
    const model = (modelInput.value || cfg.model || '').trim();
    if (provider === 'openai') {
      const res = await fetch((cfg.baseUrl || 'https://api.openai.com/v1') + '/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey || ''}` },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a helpful coding assistant.' }, { role: 'user', content: userContent }], temperature: 0.2 })
      });
      if (!res.ok) throw new Error('OpenAI error');
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } else if (provider === 'gemini') {
      const url = (cfg.baseUrl || 'https://generativelanguage.googleapis.com') + `/v1beta/models/${encodeURIComponent(model || 'gemini-1.5-flash')}:generateContent?key=${encodeURIComponent(cfg.apiKey || '')}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: userContent }] }] }) });
      if (!res.ok) throw new Error('Gemini error');
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
    } else { // lmstudio
      const res = await fetch((cfg.baseUrl || 'http://localhost:1234') + '/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: 'You are a helpful coding assistant.' }, { role: 'user', content: userContent }], temperature: 0.2, stream: false, max_tokens: -1 })
      });
      if (!res.ok) throw new Error('LMStudio error');
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  }

  function safeJson(text) {
    try { return JSON.parse(text); } catch { return []; }
  }
  function escapeHtml(s) { return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c])); }
})();
