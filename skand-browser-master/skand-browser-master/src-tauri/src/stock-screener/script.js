(function(){
  const $ = (id) => document.getElementById(id);
  document.addEventListener('DOMContentLoaded', () => {
    if (window.AppShell) {
      
    }

    // Prefill some symbols for markets
    const market = $('market');
    const symbols = $('symbols');
    const conditionsEl = $('conditions');
    const addConditionBtn = $('add-condition');
    const strategySelect = $('strategy-select');
    const saveStrategyBtn = $('save-default-strategy');
    const deleteStrategyBtn = $('delete-strategy');
    market.addEventListener('change', () => {
      if (market.value === 'US' && !symbols.value) symbols.value = 'AAPL, MSFT, NVDA, AMZN, GOOGL';
      if (market.value === 'IN' && !symbols.value) symbols.value = 'RELIANCE.BSE, TCS.BSE, HDFCBANK.BSE';
    });

    $('run').addEventListener('click', runScreen);

    function setStatus(msg){ $('status').textContent = msg || ''; }

    // Built-in default strategies
    const builtinStrategies = [
      {
        id: 'rsi_oversold',
        name: 'RSI Oversold (< 30)',
        conditions: [ { indicator: 'RSI', op: '<=', value: 30 } ]
      },
      {
        id: 'value_pick',
        name: 'Value Pick (P/E < 15)',
        conditions: [ { indicator: 'PE', op: '<=', value: 15 } ]
      },
      {
        id: 'momentum_value_combo',
        name: 'RSI < 40 AND P/E < 20',
        conditions: [ { indicator: 'RSI', op: '<=', value: 40 }, { indicator: 'PE', op: '<=', value: 20 } ]
      },
      {
        id: 'price_above_sma20',
        name: 'Price > SMA20 (Uptrend)',
        conditions: [ { indicator: 'PRICE_MINUS_SMA20', op: '>=', value: 0 } ]
      },
      {
        id: 'macd_positive_rsi_under_60',
        name: 'MACD > 0 AND RSI < 60',
        conditions: [ { indicator: 'MACD', op: '>', value: 0 }, { indicator: 'RSI', op: '<', value: 60 } ]
      },
      {
        id: 'bollinger_bounce',
        name: 'Price < BBANDS Lower (20)',
        conditions: [ { indicator: 'PRICE_MINUS_BBANDS_LOWER20', op: '<', value: 0 } ]
      },
      {
        id: 'near_52w_low',
        name: 'Price within 10% of 52W Low',
        conditions: [ { indicator: 'PCT_FROM_52W_LOW', op: '<=', value: 10 } ]
      },
      {
        id: 'near_52w_high',
        name: 'Price within 10% of 52W High',
        conditions: [ { indicator: 'PCT_BELOW_52W_HIGH', op: '<=', value: 10 } ]
      }
    ];

    function getUserStrategies(){
      try { return (window.getAppData?.('stock_screener_strategies', []) || []); } catch { return []; }
    }
    function setUserStrategies(list){
      try { window.setAppData?.('stock_screener_strategies', list, 'stock-screener'); } catch {}
    }
    function hydrateStrategySelect(){
      strategySelect.innerHTML = '';
      const optGroupBuiltin = document.createElement('optgroup');
      optGroupBuiltin.label = 'Built-in';
      builtinStrategies.forEach(s => {
        const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; opt.dataset.source = 'builtin';
        optGroupBuiltin.appendChild(opt);
      });
      const optGroupUser = document.createElement('optgroup');
      optGroupUser.label = 'My Strategies';
      getUserStrategies().forEach(s => {
        const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; opt.dataset.source = 'user';
        optGroupUser.appendChild(opt);
      });
      strategySelect.appendChild(optGroupBuiltin);
      strategySelect.appendChild(optGroupUser);
      // Select first by default
      if (strategySelect.options.length > 0) strategySelect.selectedIndex = 0;
      applyStrategyToBuilder(getSelectedStrategy());
    }

    function getSelectedStrategy(){
      const sel = strategySelect.value;
      return builtinStrategies.find(s => s.id === sel) || getUserStrategies().find(s => s.id === sel) || builtinStrategies[0];
    }

    function serializeBuilder(){
      const rows = conditionsEl.querySelectorAll('.cond-row');
      const conditions = [];
      rows.forEach(row => {
        const indicator = row.querySelector('.cond-indicator').value;
        const op = row.querySelector('.cond-op').value;
        const v1 = parseFloat(row.querySelector('.cond-v1').value);
        const v2El = row.querySelector('.cond-v2');
        const value = (op === 'between') ? [v1, parseFloat(v2El.value)] : v1;
        conditions.push({ indicator, op, value });
      });
      return { conditions };
    }

    function applyStrategyToBuilder(strategy){
      conditionsEl.innerHTML = '';
      (strategy?.conditions || []).forEach(c => addConditionRow(c));
      if ((strategy?.conditions || []).length === 0) {
        addConditionRow({ indicator: 'RSI', op: '<=', value: 30 });
      }
    }

    function addConditionRow(cond = { indicator: 'RSI', op: '<=', value: 30 }){
      const row = document.createElement('div');
      row.className = 'cond-row';
      row.innerHTML = `
        <select class="cond-indicator">
          <option value="RSI">RSI</option>
          <option value="PE">P/E</option>
          <option value="PRICE">Price</option>
          <option value="SMA20">SMA20</option>
          <option value="EMA20">EMA20</option>
          <option value="MACD">MACD (12,26,9)</option>
          <option value="BBANDS_UPPER20">BBANDS Upper (20)</option>
          <option value="BBANDS_LOWER20">BBANDS Lower (20)</option>
          <option value="HIGH_52W">52W High</option>
          <option value="LOW_52W">52W Low</option>
          <option value="PRICE_MINUS_SMA20">Price - SMA20</option>
          <option value="PRICE_MINUS_BBANDS_LOWER20">Price - BBANDS Lower</option>
          <option value="PCT_FROM_52W_LOW">% from 52W Low</option>
          <option value="PCT_BELOW_52W_HIGH">% below 52W High</option>
        </select>
        <select class="cond-op">
          <option value="<="><=</option>
          <option value=">=">>=</option>
          <option value="<"><</option>
          <option value=">">></option>
          <option value="between">between</option>
        </select>
        <input class="cond-v1" type="number" step="any" value="${Array.isArray(cond.value) ? cond.value[0] : cond.value}" />
        <input class="cond-v2" type="number" step="any" style="display:none;" />
        <button class="cond-remove" title="Remove">×</button>
      `;
      conditionsEl.appendChild(row);
      const indSel = row.querySelector('.cond-indicator');
      const opSel = row.querySelector('.cond-op');
      const v1 = row.querySelector('.cond-v1');
      const v2 = row.querySelector('.cond-v2');
      const removeBtn = row.querySelector('.cond-remove');
      indSel.value = cond.indicator || 'RSI';
      opSel.value = cond.op || '<=';
      if (cond.op === 'between' && Array.isArray(cond.value)) {
        v2.style.display = '';
        v2.value = cond.value[1];
      }
      indSel.addEventListener('change', () => {/* placeholder if dynamic UI changes needed */});
      opSel.addEventListener('change', () => { v2.style.display = (opSel.value === 'between') ? '' : 'none'; });
      removeBtn.addEventListener('click', () => row.remove());
    }

    addConditionBtn?.addEventListener('click', () => addConditionRow());
    strategySelect?.addEventListener('change', () => applyStrategyToBuilder(getSelectedStrategy()));
    saveStrategyBtn?.addEventListener('click', () => {
      const name = prompt('Strategy name');
      if (!name) return;
      const s = serializeBuilder();
      const list = getUserStrategies();
      const id = 'user_' + name.toLowerCase().replace(/\s+/g,'_') + '_' + Date.now();
      list.push({ id, name, ...s });
      setUserStrategies(list);
      hydrateStrategySelect();
      alert('Strategy saved.');
    });
    deleteStrategyBtn?.addEventListener('click', () => {
      const sel = strategySelect.value;
      const list = getUserStrategies();
      const idx = list.findIndex(s => s.id === sel);
      if (idx >= 0){ list.splice(idx,1); setUserStrategies(list); hydrateStrategySelect(); }
    });
    // Initialize builder/select
    hydrateStrategySelect();

    async function runScreen(){
      const userSyms = (symbols.value || '').split(',').map(s => s.trim()).filter(Boolean);
      const useUniverse = userSyms.length === 0 && market.value !== 'CUSTOM';
      let sectorMap = {};
      if (useUniverse) {
        setStatus('Loading universe by sector...');
        sectorMap = await fetchUniverseLocal(market.value);
      } else {
        sectorMap = { 'Custom': userSyms };
      }
      const period = parseInt($('rsi-period').value || '14', 10);
      const selectedStrategy = { ...getSelectedStrategy(), ...serializeBuilder() };

      const container = document.getElementById('results-container');
      container.innerHTML = '';

      const sectorNames = Object.keys(sectorMap);
      for (let s = 0; s < sectorNames.length; s++){
        const sector = sectorNames[s];
        const syms = sectorMap[sector] || [];
        const { tbody } = createSectorTable(container, sector);
        for (let i = 0; i < syms.length; i++){
          const sym = syms[i];
          try {
            const needed = getNeededIndicators(selectedStrategy.conditions);
            // Fetch overview (for PRICE display and PE/52W values)
            const overview = await fetchOverviewLocal(sym);
            const facts = { PRICE: parseFloat(overview?.price) };
            if (!Number.isNaN(parseFloat(overview?.PERatio))) facts.PE = parseFloat(overview?.PERatio);
            if (!Number.isNaN(parseFloat(overview?.['52WeekHigh']))) facts.HIGH_52W = parseFloat(overview?.['52WeekHigh']);
            if (!Number.isNaN(parseFloat(overview?.['52WeekLow']))) facts.LOW_52W = parseFloat(overview?.['52WeekLow']);

            // Fetch indicators in one call when needed
            const indList = [];
            if (needed.has('RSI')) indList.push('RSI');
            if (needed.has('SMA20')) indList.push('SMA20');
            if (needed.has('EMA20')) indList.push('EMA20');
            if (needed.has('MACD')) indList.push('MACD');
            if (needed.has('BBANDS_UPPER20') || needed.has('BBANDS_LOWER20')) indList.push('BBANDS20');
            let indData = {};
            if (indList.length > 0) {
              indData = await fetchIndicatorsLocal(sym, indList);
              if (indData) {
                if ('RSI' in indData) facts.RSI = indData.RSI;
                if ('SMA20' in indData) facts.SMA20 = indData.SMA20;
                if ('EMA20' in indData) facts.EMA20 = indData.EMA20;
                if ('MACD' in indData) facts.MACD = indData.MACD;
                if ('BBANDS_UPPER20' in indData) facts.BBANDS_UPPER20 = indData.BBANDS_UPPER20;
                if ('BBANDS_LOWER20' in indData) facts.BBANDS_LOWER20 = indData.BBANDS_LOWER20;
              }
            }

            // Derived facts
            if (facts.PRICE != null && facts.SMA20 != null) facts.PRICE_MINUS_SMA20 = facts.PRICE - facts.SMA20;
            if (facts.PRICE != null && facts.BBANDS_LOWER20 != null) facts.PRICE_MINUS_BBANDS_LOWER20 = facts.PRICE - facts.BBANDS_LOWER20;
            if (facts.PRICE != null && facts.LOW_52W != null && facts.LOW_52W > 0) facts.PCT_FROM_52W_LOW = ((facts.PRICE - facts.LOW_52W) / facts.LOW_52W) * 100;
            if (facts.PRICE != null && facts.HIGH_52W != null && facts.HIGH_52W > 0) facts.PCT_BELOW_52W_HIGH = ((facts.HIGH_52W - facts.PRICE) / facts.HIGH_52W) * 100;
            const pass = evaluateConditions(selectedStrategy.conditions, facts);
            const rsiForRow = facts.RSI ?? '—';
            const peForRow = isFinite(facts.PE) ? facts.PE : '—';
            if (!overview && Object.keys(facts).length <= 1) {
              appendRowToTbody(tbody, sym, '—', '—', '—', '—');
            } else if (pass) {
              appendRowToTbody(tbody, sym, rsiForRow, peForRow, overview?.price ?? '—', overview?.updated ?? '—');
            }
          } catch (e){
            appendRowToTbody(tbody, sym, 'ERR', '—', '—', '—');
          }
          // Small delay to keep UI responsive
          if (i < syms.length - 1) await delay(100);
        }
      }
      setStatus('Done.');
    }

    function appendRowToTbody(tbody, sym, rsi, pe, price, updated){
      const tr = document.createElement('tr');
      const rsiClass = typeof rsi === 'number' ? (rsi <= 30 ? 'rsi-good' : (rsi >= 70 ? 'rsi-bad' : '')) : '';
      const peStr = typeof pe === 'number' ? pe.toFixed(2) : pe;
      tr.innerHTML = `<td>${escapeHtml(sym)}</td><td class="${rsiClass}">${typeof rsi === 'number' ? rsi.toFixed(2) : rsi}</td><td>${peStr}</td><td>${price}</td><td>${updated}</td>`;
      tbody.appendChild(tr);
    }

    function createSectorTable(container, sector){
      const wrap = document.createElement('div');
      wrap.className = 'sector-block';
      wrap.innerHTML = `<h3>${escapeHtml(sector)}</h3>
        <table class="sector-table"><thead><tr>
          <th>Symbol</th><th>RSI</th><th>P/E</th><th>Price</th><th>Updated</th>
        </tr></thead><tbody></tbody></table>`;
      container.appendChild(wrap);
      return { table: wrap.querySelector('table'), tbody: wrap.querySelector('tbody') };
    }

    async function fetchOverviewLocal(symbol){
      const url = `http://127.0.0.1:5005/overview/${encodeURIComponent(symbol)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    }

    async function fetchIndicatorsLocal(symbol, indicatorList){
      const unique = Array.from(new Set(indicatorList));
      const url = `http://127.0.0.1:5005/indicators/${encodeURIComponent(symbol)}?ind=${encodeURIComponent(unique.join(','))}`;
      const res = await fetch(url);
      if (!res.ok) return {};
      return await res.json();
    }

    async function fetchUniverseLocal(market){
      const url = `http://127.0.0.1:5005/universe/${encodeURIComponent(market || 'US')}`;
      const res = await fetch(url);
      if (!res.ok) return {};
      return await res.json();
    }

    function getNeededIndicators(conditions){
      const set = new Set();
      (conditions || []).forEach(c => { if (c?.indicator) set.add(c.indicator); });
      // Expand derived indicators to their dependencies
      if (set.has('PRICE_MINUS_SMA20')) set.add('SMA20');
      if (set.has('PRICE_MINUS_BBANDS_LOWER20')) set.add('BBANDS_LOWER20');
      if (set.has('PCT_FROM_52W_LOW') || set.has('PCT_BELOW_52W_HIGH')) {
        set.add('HIGH_52W'); set.add('LOW_52W');
      }
      return set;
    }

    function evaluateConditions(conditions, facts){
      if (!conditions || conditions.length === 0) return true;
      return conditions.every(c => {
        const v = facts[c.indicator];
        if (v == null || Number.isNaN(v)) return false;
        const op = c.op;
        if (op === 'between' && Array.isArray(c.value)){
          const [a,b] = c.value;
          return v >= Math.min(a,b) && v <= Math.max(a,b);
        }
        const target = Array.isArray(c.value) ? c.value[0] : c.value;
        switch(op){
          case '<=': return v <= target;
          case '>=': return v >= target;
          case '<': return v < target;
          case '>': return v > target;
          default: return false;
        }
      });
    }

    async function sequentialFetch(tasks){
      const results = [];
      for (const t of tasks){
        // space slightly to avoid bursting
        const r = await t();
        results.push(r);
        await delay(1000);
      }
      return results;
    }

    function delay(ms){ return new Promise(r => setTimeout(r, ms)); }
    function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
  });
})();
