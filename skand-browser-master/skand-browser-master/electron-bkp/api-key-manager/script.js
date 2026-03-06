(function(){
  document.addEventListener('DOMContentLoaded', () => {
    if (window.AppShell) {
      AppShell.init({ appId: 'api-key-manager', title: 'API Key Manager' });
    }
    const keys = (window.getAllApiKeys && window.getAllApiKeys()) || {};

    // Populate
    const $ = (id) => document.getElementById(id);
    // OpenAI
    if (keys.openai){
      $('openai-key').value = keys.openai.apiKey || '';
      $('openai-model').value = keys.openai.model || 'gpt-4o-mini';
      $('openai-base').value = keys.openai.baseUrl || 'https://api.openai.com/v1';
    }
    // Gemini
    if (keys.gemini){
      $('gemini-key').value = keys.gemini.apiKey || '';
      $('gemini-model').value = keys.gemini.model || 'gemini-1.5-flash';
      $('gemini-base').value = keys.gemini.baseUrl || 'https://generativelanguage.googleapis.com';
    }
    // LMStudio
    if (keys.lmstudio){
      $('lmstudio-base').value = keys.lmstudio.baseUrl || 'http://localhost:1234';
      $('lmstudio-model').value = keys.lmstudio.model || '';
    }
    // Alpha Vantage
    if (keys.alphavantage){
      $('av-key').value = keys.alphavantage.apiKey || '';
    }

    // Save handlers
    $('save-openai').onclick = () => {
      window.setApiKey('openai', {
        apiKey: $('openai-key').value.trim(),
        model: $('openai-model').value.trim() || 'gpt-4o-mini',
        baseUrl: $('openai-base').value.trim() || 'https://api.openai.com/v1'
      }, 'api-key-manager');
      toast($('openai-status'), 'Saved OpenAI settings');
    };
    $('save-gemini').onclick = () => {
      window.setApiKey('gemini', {
        apiKey: $('gemini-key').value.trim(),
        model: $('gemini-model').value.trim() || 'gemini-1.5-flash',
        baseUrl: $('gemini-base').value.trim() || 'https://generativelanguage.googleapis.com'
      }, 'api-key-manager');
      toast($('gemini-status'), 'Saved Gemini settings');
    };
    $('save-lmstudio').onclick = () => {
      window.setApiKey('lmstudio', {
        baseUrl: $('lmstudio-base').value.trim() || 'http://localhost:1234',
        model: $('lmstudio-model').value.trim()
      }, 'api-key-manager');
      toast($('lmstudio-status'), 'Saved LMStudio settings');
    };
    $('save-av').onclick = () => {
      window.setApiKey('alphavantage', { apiKey: $('av-key').value.trim() }, 'api-key-manager');
      toast($('av-status'), 'Saved Alpha Vantage key');
    };

    // Test handlers
    $('test-openai').onclick = async () => {
      const cfg = window.getApiKey('openai') || {};
      const ok = await testOpenAI(cfg);
      toast($('openai-status'), ok ? 'OpenAI test OK' : 'OpenAI test failed');
    };
    $('test-gemini').onclick = async () => {
      const cfg = window.getApiKey('gemini') || {};
      const ok = await testGemini(cfg);
      toast($('gemini-status'), ok ? 'Gemini test OK' : 'Gemini test failed');
    };
    $('test-lmstudio').onclick = async () => {
      const cfg = window.getApiKey('lmstudio') || { baseUrl: 'http://localhost:1234' };
      const ok = await testLMStudio(cfg);
      toast($('lmstudio-status'), ok ? 'LMStudio test OK' : 'LMStudio test failed');
    };
    $('test-av').onclick = async () => {
      const cfg = window.getApiKey('alphavantage') || {};
      const ok = await testAlphaVantage(cfg);
      toast($('av-status'), ok ? 'Alpha Vantage test OK' : 'Alpha Vantage test failed');
    };

    function toast(el, msg){ el.textContent = msg; setTimeout(()=> el.textContent = '', 4000); }

    async function testOpenAI({ apiKey, baseUrl }){
      if (!apiKey) return false;
      try {
        const url = (baseUrl || 'https://api.openai.com/v1') + '/models';
        const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
        return res.ok;
      } catch { return false; }
    }
    async function testGemini({ apiKey, baseUrl, model }){
      if (!apiKey) return false;
      try {
        const url = (baseUrl || 'https://generativelanguage.googleapis.com') + `/v1beta/models`;
        const res = await fetch(url + `?key=${encodeURIComponent(apiKey)}`);
        return res.ok;
      } catch { return false; }
    }
    async function testLMStudio({ baseUrl }){
      try {
        const url = (baseUrl || 'http://localhost:1234') + '/v1/models';
        const res = await fetch(url);
        return res.ok;
      } catch { return false; }
    }
    async function testAlphaVantage({ apiKey }){
      if (!apiKey) return false;
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url);
        return res.ok;
      } catch { return false; }
    }
  });
})();
