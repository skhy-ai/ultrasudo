// App Shell: Shared top bar for all apps
// Usage: include this file and call AppShell.init({ appId: 'timer', title: 'Timer', showOpen: true, showSave: true })

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
  }

  function injectStyles() {
    if (document.getElementById('app-shell-styles')) return;
    const style = document.createElement('style');
    style.id = 'app-shell-styles';
    style.textContent = `
      .app-shell-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 10000; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(0,0,0,.8); color: #fff; backdrop-filter: blur(8px); }
      .app-shell-title { font-weight: 600; margin-right: auto; }
      .app-shell-btn { cursor: pointer; padding: 6px 10px; border-radius: 6px; background: rgba(255,255,255,.15); color: #fff; border: 0; }
      .app-shell-btn:hover { background: rgba(255,255,255,.25); }
      .app-shell-sep { width: 1px; height: 20px; background: rgba(255,255,255,.2); margin: 0 6px; }
      .app-shell-status { display:flex; align-items:center; gap:6px; font-size: 12px; opacity: .9 }
      .app-shell-dot { width:8px; height:8px; border-radius:50%; background:#51cf66 }
      .app-shell-dot.offline { background:#ff6b6b }
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
    homeBtn.onclick = () => { window.location.href = '../desktop/desktop.html'; };

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

  function newSep(){ const s = document.createElement('div'); s.className='app-shell-sep'; return s; }

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
  function onSave(handler){ const b = document.getElementById('app-shell-save'); if (b) b.onclick = handler; }
  function onOpen(handler){ const b = document.getElementById('app-shell-open'); if (b) b.onclick = handler; }

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
