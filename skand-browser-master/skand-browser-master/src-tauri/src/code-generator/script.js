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
    if (window.AppShell) {
      AppShell.init({ appId: 'code-generator', title: 'Code Generator' });
    }
    $('test-api').addEventListener('click', testApi);
    genTestsBtn.addEventListener('click', onGenerateTests);
    acceptTestsBtn.addEventListener('click', onAcceptTests);
    regenTestsBtn.addEventListener('click', onGenerateTests);
    generateBtn.addEventListener('click', onGenerateFile);
    // Prefill model based on provider stored config
    syncModelFromKeys();
    providerSel.addEventListener('change', syncModelFromKeys);
  });

  function syncModelFromKeys(){
    try {
      const p = providerSel.value;
      const cfg = window.getApiKey ? window.getApiKey(p) : null;
      modelInput.placeholder = cfg?.model || (p==='lmstudio'?'(server default)':'' );
    } catch {}
  }

  function setApiMsg(msg){ apiStatus.textContent = msg; setTimeout(()=> apiStatus.textContent='', 5000); }

  async function testApi(){
    const p = providerSel.value;
    const cfg = window.getApiKey ? window.getApiKey(p) : {};
    let ok = false;
    try {
      if (p === 'openai') {
        ok = await fetch((cfg.baseUrl||'https://api.openai.com/v1') + '/models', { headers: { Authorization: `Bearer ${cfg.apiKey||''}` }}).then(r=>r.ok);
      } else if (p === 'gemini') {
        const url = (cfg.baseUrl||'https://generativelanguage.googleapis.com') + '/v1beta/models?key=' + encodeURIComponent(cfg.apiKey||'');
        ok = await fetch(url).then(r=>r.ok);
      } else if (p === 'lmstudio') {
        ok = await fetch((cfg.baseUrl||'http://localhost:1234') + '/v1/models').then(r=>r.ok);
      }
    } catch {}
    setApiMsg(ok ? 'API OK' : 'API test failed');
  }

  // State
  let acceptedTests = [];

  async function onGenerateTests(){
    const prompt = (promptInput.value||'').trim();
    if (!prompt){ alert('Enter a prompt first.'); return; }
    setTestsLoading(true);
    try {
      const content = await callLLM(`You are a senior QA engineer. Given the following app description, propose 6-10 concise end-to-end test cases as a JSON array of objects with fields id, title, steps (array of strings), and expected (string). Respond with ONLY valid JSON.\n\nDescription:\n${prompt}`);
      const json = safeJson(content);
      renderTests(json);
    } catch (e){
      testsContainer.innerHTML = '<div class="err">Failed to generate tests. Please try again.</div>';
      console.error(e);
    } finally { setTestsLoading(false); }
  }

  function renderTests(tests){
    if (!Array.isArray(tests)) { testsContainer.textContent = 'Invalid response format.'; return; }
    testsContainer.innerHTML = '';
    for (const t of tests){
      const div = document.createElement('div');
      div.className = 'test-item';
      div.innerHTML = `<label><input type="checkbox" class="tcb" checked data-id="${escapeHtml(t.id||'')}"/> <b>${escapeHtml(t.title||'')}</b></label><pre>${escapeHtml(JSON.stringify({steps:t.steps, expected:t.expected}, null, 2))}</pre>`;
      testsContainer.appendChild(div);
    }
  }

  function setTestsLoading(loading){ testsContainer.innerHTML = loading ? '<div class="loading">Generating testcases...</div>' : testsContainer.innerHTML; }

  function onAcceptTests(){
    const checks = testsContainer.querySelectorAll('.tcb');
    acceptedTests = [];
    checks.forEach(cb => { if (cb.checked) acceptedTests.push(cb.getAttribute('data-id')); });
    if (acceptedTests.length === 0){ alert('Select at least one testcase.'); return; }
    alert(`Accepted ${acceptedTests.length} testcases. Now specify a filename and Generate.`);
  }

  async function onGenerateFile(){
    const prompt = (promptInput.value||'').trim();
    const filename = (filenameInput.value||'').trim();
    if (!prompt){ alert('Enter a prompt.'); return; }
    if (!filename){ alert('Enter a filename to generate.'); return; }
    if (!acceptedTests || acceptedTests.length === 0){ alert('Accept testcases first.'); return; }

    generateBtn.disabled = true;
    outputEl.textContent = 'Generating...';
    try {
      const content = await callLLM(`You are an expert software engineer. Build the file: ${filename}.\n\nApplication description:\n${prompt}\n\nFollow these selected test case IDs strictly: ${acceptedTests.join(', ')}. Implement the code to satisfy them. Respond with ONLY the raw file content, no explanations, no markdown.`);
      outputEl.textContent = content;
    } catch (e){
      outputEl.textContent = 'Generation failed. Check API configuration.';
    } finally { generateBtn.disabled = false; }
  }

  async function callLLM(userContent){
    const provider = providerSel.value;
    const cfg = window.getApiKey ? (window.getApiKey(provider) || {}) : {};
    const model = (modelInput.value || cfg.model || '').trim();
    if (provider === 'openai'){
      const res = await fetch((cfg.baseUrl||'https://api.openai.com/v1') + '/chat/completions', {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${cfg.apiKey||''}` },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', messages:[{role:'system', content:'You are a helpful coding assistant.'},{role:'user', content:userContent}], temperature:0.2 })
      });
      if (!res.ok) throw new Error('OpenAI error');
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } else if (provider === 'gemini') {
      const url = (cfg.baseUrl||'https://generativelanguage.googleapis.com') + `/v1beta/models/${encodeURIComponent(model || 'gemini-1.5-flash')}:generateContent?key=${encodeURIComponent(cfg.apiKey||'')}`;
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents: [{ role:'user', parts:[{text:userContent}] }] }) });
      if (!res.ok) throw new Error('Gemini error');
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n') || '';
    } else { // lmstudio
      const res = await fetch((cfg.baseUrl||'http://localhost:1234') + '/v1/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages:[{role:'system', content:'You are a helpful coding assistant.'},{role:'user', content:userContent}], temperature:0.2, stream:false, max_tokens:-1 })
      });
      if (!res.ok) throw new Error('LMStudio error');
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  }

  function safeJson(text){
    try { return JSON.parse(text); } catch { return []; }
  }
  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
})();
