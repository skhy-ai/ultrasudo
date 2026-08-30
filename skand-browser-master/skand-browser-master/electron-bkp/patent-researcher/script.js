(function(){
  const $ = (id) => document.getElementById(id);

  document.addEventListener('DOMContentLoaded', () => {
    if (window.AppShell) {
      
    }
    $('test-api').addEventListener('click', testApi);
    $('search').addEventListener('click', onSearch);
    syncModelFromKeys();
    $('provider').addEventListener('change', syncModelFromKeys);
  });

  function syncModelFromKeys(){
    const p = $('provider').value;
    const cfg = window.getApiKey ? window.getApiKey(p) : null;
    $('model').placeholder = cfg?.model || '';
  }

  function setApiMsg(msg){ $('api-status').textContent = msg; setTimeout(()=> $('api-status').textContent = '', 5000); }

  async function testApi(){
    const p = $('provider').value;
    const cfg = window.getApiKey ? window.getApiKey(p) : {};
    let ok = false;
    try {
      if (p === 'openai') {
        ok = await fetch((cfg.baseUrl||'https://api.openai.com/v1') + '/models', { headers: { Authorization: `Bearer ${cfg.apiKey||''}` }}).then(r=>r.ok);
      } else if (p === 'gemini') {
        const url = (cfg.baseUrl||'https://generativelanguage.googleapis.com') + '/v1beta/models?key=' + encodeURIComponent(cfg.apiKey||'');
        ok = await fetch(url).then(r=>r.ok);
      }
    } catch {}
    setApiMsg(ok ? 'API OK' : 'API test failed');
  }

  async function onSearch(){
    const synopsis = ($('synopsis').value||'').trim();
    if (!synopsis){ alert('Enter a synopsis.'); return; }
    setResults('<div class="hint">Crafting search strategy with LLM...</div>');
    try {
      const plan = await callLLM(`You are a patent research assistant. Given the following synopsis, produce a JSON object with fields: keywords (array of 6-12 keyword phrases), boolean_query (string), and tips (array of 3-6 short tips). Avoid any harmful or personal data. Respond with ONLY JSON.\n\nSynopsis:\n${synopsis}`);
      const parsed = safeJson(plan) || {};
      renderResults(parsed, synopsis);
    } catch (e){
      console.error(e);
      setResults('<div class="err">Failed to generate search strategy. Check API settings.</div>');
    }
  }

  function renderResults(strategy, synopsis){
    const kw = Array.isArray(strategy.keywords) ? strategy.keywords : [];
    const bq = (strategy.boolean_query || '').trim();
    const tips = Array.isArray(strategy.tips) ? strategy.tips : [];

    const blocks = [];
    if (kw.length){
      blocks.push(`<div class="block"><h3>Suggested Keywords</h3><ul>${kw.map(k=>`<li>${escapeHtml(k)}</li>`).join('')}</ul></div>`);
    }
    if (bq){
      blocks.push(`<div class="block"><h3>Boolean Query</h3><pre>${escapeHtml(bq)}</pre></div>`);
    }

    // Build search links
    const q = encodeURIComponent(bq || (kw.join(' ')) || synopsis.slice(0,200));
    const links = [
      { name: 'Google Patents', url: `https://patents.google.com/?q=${q}` },
      { name: 'Espacenet', url: `https://worldwide.espacenet.com/patent/search?q=${q}` },
      { name: 'USPTO Patent Full-Text', url: `https://ppubs.uspto.gov/pubwebapp/static/pages/ppubsbasic.html#result?searchTerm=${q}` }
    ];
    blocks.push(`<div class="block"><h3>Search Links</h3><ul>${links.map(l=>`<li><a href="${l.url}" target="_blank" rel="noopener">${l.name}</a></li>`).join('')}</ul></div>`);

    if (tips.length){
      blocks.push(`<div class="block"><h3>Research Tips</h3><ul>${tips.map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ul></div>`);
    }

    setResults(blocks.join(''));
  }

  async function callLLM(userContent){
    const provider = $('provider').value;
    const cfg = window.getApiKey ? (window.getApiKey(provider) || {}) : {};
    const model = ($('model').value || cfg.model || '').trim();
    if (provider === 'openai'){
      const res = await fetch((cfg.baseUrl||'https://api.openai.com/v1') + '/chat/completions', {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${cfg.apiKey||''}` },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', messages:[{role:'system', content:'You are a helpful assistant.'},{role:'user', content:userContent}], temperature:0.2 })
      });
      if (!res.ok) throw new Error('OpenAI error');
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } else { // gemini
      const url = (cfg.baseUrl||'https://generativelanguage.googleapis.com') + `/v1beta/models/${encodeURIComponent(model || 'gemini-1.5-flash')}:generateContent?key=${encodeURIComponent(cfg.apiKey||'')}`;
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents: [{ role:'user', parts:[{text:userContent}] }] }) });
      if (!res.ok) throw new Error('Gemini error');
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n') || '';
    }
  }

  function setResults(html){ $('results').innerHTML = html; }
  function safeJson(text){ try { return JSON.parse(text); } catch { return null; } }
  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
})();
