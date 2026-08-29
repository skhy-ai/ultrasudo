// App Shell: Shared top bar for all apps
// Usage: include this file and call AppShell.init({ appId: 'timer', title: 'Timer', showOpen: true, showSave: true })

if (!window.dataManager && !document.getElementById('data-manager-script')) {
  document.write('<script id="data-manager-script" src="../desktop/data-manager.js"></script>');
}

const AppShell = (() => {
  const state = { appId: '', title: document.title || 'App', showOpen: false, showSave: false };

  function init(options = {}) {
    state.appId = options.appId || state.appId;
    state.title = options.title || state.title;
    state.showOpen = !!options.showOpen;
    state.showSave = !!options.showSave;
    injectStyles();
    renderTopBar();
    wireNetworkStatus();

    // Fix padding so content doesn't hide behind the shell nav
    // We only apply this if there isn't already explicit styling handling it
    if (window.getComputedStyle(document.body).paddingTop === '0px') {
      document.body.style.paddingTop = '60px';
    }
  }

  function injectStyles() {
    if (document.getElementById('app-shell-styles')) return;
    const style = document.createElement('style');
    style.id = 'app-shell-styles';
    style.textContent = `
      .app-shell-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 10000; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(15, 23, 42, 0.85); color: #fff; backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
      .app-shell-title { font-weight: 600; margin-right: auto; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
      .app-shell-btn { cursor: pointer; padding: 6px 12px; border-radius: 8px; background: rgba(59, 130, 246, 0.2); color: #fff; border: 1px solid rgba(59, 130, 246, 0.3); transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
      .app-shell-btn:hover { background: rgba(59, 130, 246, 0.4); border-color: rgba(59, 130, 246, 0.6); transform: translateY(-1px); box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2); }
      .app-shell-sep { width: 1px; height: 20px; background: rgba(255,255,255,.1); margin: 0 6px; }
      .app-shell-status { display:flex; align-items:center; gap:6px; font-size: 12px; color: rgba(255,255,255,0.7); }
      .app-shell-dot { width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
      .app-shell-dot.offline { background:#ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.6); }
      
      /* Global Premium UI Styles injected by AppShell */
      button { 
        cursor: pointer; padding: 8px 16px; border-radius: 8px; 
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2)); 
        color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); 
        transition: all 0.2s ease; box-shadow: 0 4px 6px rgba(0,0,0,0.1); backdrop-filter: blur(4px); 
      }
      button:hover:not(:disabled) { 
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.4)); 
        border-color: rgba(255, 255, 255, 0.2); transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.2); 
      }
      button:active:not(:disabled) { transform: translateY(0); }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      
      select { 
        appearance: none; -webkit-appearance: none; width: 100%; 
        padding: 10px 14px; border-radius: 8px; 
        background: rgba(30, 41, 59, 0.7) url('data:image/svg+xml;utf8,<svg fill="%23ffffff" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>') no-repeat right 10px center; 
        color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.1); 
        transition: border-color 0.2s, box-shadow 0.2s; backdrop-filter: blur(8px); cursor: pointer;
      }
      select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); }
      select option { background: #1e293b; color: #fff; }
      
      ul, ol { padding-left: 20px; color: #e2e8f0; }
      li { margin-bottom: 8px; line-height: 1.5; transition: color 0.2s; }
      li:hover { color: #fff; }
    `;
    document.head.appendChild(style);
  }

  function renderTopBar() {
    const bar = document.createElement('div');
    bar.className = 'app-shell-bar';

    const homeBtn = document.createElement('button');
    homeBtn.className = 'app-shell-btn';
    homeBtn.innerHTML = '⌂ Desktop';
    homeBtn.title = 'Return to the main desktop view';
    homeBtn.onclick = () => { window.location.href = '/desktop'; };

    const title = document.createElement('div');
    title.className = 'app-shell-title';
    title.textContent = state.title;

    const status = document.createElement('div');
    status.className = 'app-shell-status';
    status.innerHTML = `<span class="app-shell-dot" id="as-dot"></span><span id="as-text">Online</span>`;
    status.title = 'Network status: Green indicates online, Red indicates offline. Based on browser connectivity.';

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.gap = '8px';
    if (state.showOpen) {
      const openBtn = document.createElement('button');
      openBtn.className = 'app-shell-btn';
      openBtn.textContent = 'Open';
      openBtn.title = 'Open a local file (handled by app)';
      openBtn.id = 'app-shell-open';
      right.append(openBtn);
    }
    if (state.showSave) {
      const saveBtn = document.createElement('button');
      saveBtn.className = 'app-shell-btn';
      saveBtn.textContent = 'Save';
      saveBtn.title = 'Save current file (handled by app)';
      saveBtn.id = 'app-shell-save';
      right.append(saveBtn);
    }

    if (right.children.length > 0) {
      bar.append(homeBtn, newSep(), title, status, newSep(), right);
    } else {
      bar.append(homeBtn, newSep(), title, status);
    }

    // Add help button
    const helpBtn = document.createElement('button');
    helpBtn.className = 'app-shell-btn';
    helpBtn.innerHTML = '❓ Help';
    helpBtn.title = 'View app help and documentation';
    helpBtn.onclick = showHelp;
    bar.append(helpBtn);

    document.body.prepend(bar);
  }

  function newSep() { const s = document.createElement('div'); s.className = 'app-shell-sep'; return s; }

  function wireNetworkStatus() {
    function update(online) {
      const dot = document.getElementById('as-dot');
      const text = document.getElementById('as-text');
      if (!dot || !text) return;
      if (online) { dot.classList.remove('offline'); text.textContent = 'Online'; }
      else { dot.classList.add('offline'); text.textContent = 'Offline'; }
    }

    update(navigator.onLine);
    window.addEventListener('online', () => update(true));
    window.addEventListener('offline', () => update(false));

    // If network-monitor is present, listen for its broadcast
    window.addEventListener('message', (e) => {
      if (e?.data?.type === 'NETWORK_STATUS_UPDATE') {
        update(!!e.data.online);
      }
    });
  }

  // Allow apps to hook Save/Open buttons
  function onSave(handler) { const b = document.getElementById('app-shell-save'); if (b) b.onclick = handler; }
  function onOpen(handler) { const b = document.getElementById('app-shell-open'); if (b) b.onclick = handler; }

  function showHelp() {
    // Try to load README.md from the current app directory
    const appPath = window.location.pathname.split('/').slice(0, -1).join('/') + '/README.md';
    fetch(appPath)
      .then(response => {
        if (response.ok) {
          return response.text();
        } else {
          throw new Error('README not found');
        }
      })
      .then(content => {
        // Display README in a modal or alert
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.background = 'rgba(0,0,0,0.8)';
        modal.style.zIndex = '10001';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.innerHTML = `
          <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: auto; position: relative;">
            <button onclick="this.closest('.modal').remove()" style="position: absolute; top: 10px; right: 10px; background: red; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">&times;</button>
            <pre>${content}</pre>
          </div>
        `;
        document.body.appendChild(modal);
      })
      .catch(error => {
        alert('Help documentation not available for this app.');
      });
  }

  return { init, onSave, onOpen, showHelp };
})();

window.AppShell = AppShell;
