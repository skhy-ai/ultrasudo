(function () {
  let pyodide = null;
  let currentNotebookId = null;
  let autosaveTimer = null;

  const API_BASE = 'http://127.0.0.1:5007/api/python/notebooks';

  const elements = {
    notebookContainer: document.getElementById('notebook-container'),
    notebooksList: document.getElementById('notebooks-list'),
    pkgInstalledList: document.getElementById('installed-pkgs'),
    titleInput: document.getElementById('notebook-title'),
    newNotebookBtn: document.getElementById('new-notebook-btn'),
    runAllBtn: document.getElementById('run-all-btn'),
    addCellBtn: document.getElementById('add-cell-btn'),
    statusEl: document.getElementById('py-status'),
    // Package Search
    pkgSearchPanel: document.getElementById('pkg-search-panel'),
    togglePkgBtn: document.getElementById('toggle-pkg-search'),
    closePkgBtn: document.getElementById('close-pkg-panel'),
    pkgSearchInput: document.getElementById('pkg-search-input'),
    doSearchBtn: document.getElementById('do-pkg-search'),
    searchResults: document.getElementById('pkg-search-results')
  };

  // --- Backend Integration ---

  async function fetchNotebooks() {
    try {
      console.log('Fetching projects from', API_BASE);
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      renderNotebooksList(data);
    } catch (err) {
      console.error('Fetch failed:', err);
      elements.notebooksList.innerHTML = '<div class="error">Service Offline</div>';
    }
  }

  async function loadNotebook(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error('Failed to load project');
      const nb = await res.json();

      currentNotebookId = nb.id;
      elements.titleInput.value = nb.title;
      renderNotebook(nb.cells);

      updateActiveState();
    } catch (err) {
      console.error(err);
      alert('Error loading project');
    }
  }

  async function saveNotebook() {
    const cells = getCellsData();
    if (!elements.titleInput.value.trim() && cells.length === 0) return;

    console.log('Saving notebook...', currentNotebookId || 'New Project');

    const payload = {
      id: currentNotebookId,
      title: elements.titleInput.value || 'Untitled Project',
      cells: cells
    };

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();

      if (!currentNotebookId) {
        currentNotebookId = saved.id;
        fetchNotebooks();
      }
    } catch (err) {
      console.error('Save failed', err);
      elements.statusEl.textContent = 'Save Failed';
    }
  }

  async function deleteNotebook(id, e) {
    e.stopPropagation();
    if (!confirm('Delete this notebook?')) return;
    try {
      await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (currentNotebookId === id) createNewNotebook();
      fetchNotebooks();
    } catch (err) { console.error(err); }
  }

  // --- Notebook UI Logic ---

  function createNewNotebook() {
    console.log('Creating new project...');
    currentNotebookId = null;
    elements.titleInput.value = '';
    elements.notebookContainer.innerHTML = '';
    addCell();
    updateActiveState();
    elements.titleInput.focus();
  }

  function renderNotebook(cells) {
    elements.notebookContainer.innerHTML = '';
    if (cells && cells.length > 0) {
      cells.forEach(c => addCell(c.content, c.id, c.output));
    } else {
      addCell();
    }
  }

  function addCell(content = '', id = null, outputText = '') {
    // Remove welcome screen if present
    const welcome = elements.notebookContainer.querySelector('.welcome-screen');
    if (welcome) welcome.remove();

    const cellId = id || Math.random().toString(36).substr(2, 9);
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.id = cellId;

    cell.innerHTML = `
            <div class="cell-header">
                <span>[${cellId}]</span>
                <div class="cell-actions">
                    <button class="run-cell-btn" title="Run Cell"><i class="fas fa-play"></i></button>
                    <button class="delete-cell-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="cell-editor-wrap">
                <textarea class="cell-editor" placeholder="Write Python code here...">${content}</textarea>
            </div>
            <pre class="cell-output">${outputText}</pre>
        `;

    const textarea = cell.querySelector('.cell-editor');
    const output = cell.querySelector('.cell-output');
    const runBtn = cell.querySelector('.run-cell-btn');
    const delBtn = cell.querySelector('.delete-cell-btn');

    runBtn.onclick = () => runCell(textarea.value, output, runBtn);
    delBtn.onclick = () => { cell.remove(); triggerAutosave(); };
    textarea.oninput = triggerAutosave;

    elements.notebookContainer.appendChild(cell);
    if (!content) textarea.focus();
  }

  function getCellsData() {
    return Array.from(elements.notebookContainer.querySelectorAll('.cell')).map(c => ({
      id: c.dataset.id,
      cell_type: 'code',
      content: c.querySelector('.cell-editor').value,
      output: c.querySelector('.cell-output').textContent
    }));
  }

  function renderNotebooksList(notebooks) {
    elements.notebooksList.innerHTML = '';
    if (notebooks.length === 0) {
      elements.notebooksList.innerHTML = '<div class="empty-list">No projects found</div>';
      return;
    }
    notebooks.forEach(nb => {
      const div = document.createElement('div');
      div.className = `list-item ${nb.id === currentNotebookId ? 'active' : ''}`;
      div.dataset.id = nb.id;
      div.innerHTML = `
                <span>${nb.title || 'Untitled'}</span>
                <button class="delete-nb-btn">&times;</button>
            `;
      div.onclick = () => loadNotebook(nb.id);
      div.querySelector('.delete-nb-btn').onclick = (e) => deleteNotebook(nb.id, e);
      elements.notebooksList.appendChild(div);
    });
  }

  function updateActiveState() {
    document.querySelectorAll('.list-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === currentNotebookId);
    });
  }

  // --- Pyodide & Execution ---

  async function initPyodide() {
    try {
      elements.statusEl.textContent = 'Pyodide: Loading...';
      pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });
      await pyodide.loadPackage("micropip");

      await pyodide.runPythonAsync(`
import sys, io, traceback
def _run_captured(code):
    buf = io.StringIO()
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = buf, buf
    error = None
    try:
        exec(code, globals())
    except Exception:
        error = traceback.format_exc()
    sys.stdout, sys.stderr = old_out, old_err
    return (buf.getvalue(), error)
`);

      elements.statusEl.textContent = 'Pyodide: Ready';
      updateInstalledPackages();
    } catch (e) {
      elements.statusEl.textContent = 'Pyodide: Error';
      console.error(e);
    }
  }

  async function runCell(code, outputEl, btn) {
    if (!pyodide) return alert('Pyodide not ready');
    outputEl.textContent = 'Running...';
    outputEl.classList.add('running');
    btn.disabled = true;

    try {
      const pySafeCode = JSON.stringify(code);
      const py = `code_to_run = ${pySafeCode}\nout, err = _run_captured(code_to_run)\n[out, err]`;
      const result = await pyodide.runPythonAsync(py);
      const [stdout, error] = result.toJs ? result.toJs() : result;

      outputEl.textContent = (stdout || '') + (error || '');
      if (!stdout && !error) outputEl.textContent = '(no output)';
      triggerAutosave();
    } catch (e) {
      outputEl.textContent = String(e);
    } finally {
      outputEl.classList.remove('running');
      btn.disabled = false;
    }
  }

  async function runAll() {
    const cells = elements.notebookContainer.querySelectorAll('.cell');
    for (const cell of cells) {
      const btn = cell.querySelector('.run-cell-btn');
      const editor = cell.querySelector('.cell-editor');
      const output = cell.querySelector('.cell-output');
      await runCell(editor.value, output, btn);
    }
  }

  // --- Package Management ---

  async function updateInstalledPackages() {
    if (!pyodide) return;
    try {
      const py = `import json, micropip\njson.dumps([{"name": k, "version": v.version} for k, v in micropip.list().items()])`;
      const data = await pyodide.runPythonAsync(py);
      const pkgs = JSON.parse(data);

      elements.pkgInstalledList.innerHTML = pkgs.map(p => `
                <div class="list-item">
                    <span>${p.name}</span>
                    <small>${p.version}</small>
                </div>
            `).join('');
    } catch (e) { console.error(e); }
  }

  async function searchPackage() {
    const query = elements.pkgSearchInput.value.trim().toLowerCase();
    if (!query) return;
    elements.searchResults.innerHTML = '<div class="loading">Searching PyPI...</div>';
    try {
      const res = await fetch(`https://pypi.org/pypi/${query}/json`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      elements.searchResults.innerHTML = `
                <div class="pkg-card">
                    <strong>${data.info.name} ${data.info.version}</strong>
                    <p>${data.info.summary || ''}</p>
                    <button id="install-btn" class="primary-btn">Install Package</button>
                </div>
            `;
      document.getElementById('install-btn').onclick = () => installPackage(data.info.name);
    } catch (e) { elements.searchResults.innerHTML = 'Package not found'; }
  }

  async function installPackage(name) {
    const btn = document.getElementById('install-btn');
    if (!btn) return;
    btn.textContent = 'Installing...';
    btn.disabled = true;
    try {
      await pyodide.runPythonAsync(`
import micropip
async def _do_install():
    await micropip.install('${name}')
await _do_install()
`);
      btn.textContent = 'Installed';
      btn.style.background = '#22c55e';
      updateInstalledPackages();
      setTimeout(() => elements.pkgSearchPanel.classList.add('hidden'), 1500);
    } catch (e) {
      console.error('Installation failed', e);
      btn.textContent = 'Failed';
      btn.style.background = '#ef4444';
      alert(`Installation failed: ${e}\nCheck your internet connection and package name.`);
    } finally {
      setTimeout(() => { if (btn) btn.disabled = false; }, 3000);
    }
  }

  // --- Events & Init ---

  function triggerAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveNotebook, 2000);
  }

  elements.newNotebookBtn.onclick = createNewNotebook;
  elements.runAllBtn.onclick = runAll;
  elements.addCellBtn.onclick = () => addCell();
  elements.titleInput.oninput = triggerAutosave;

  elements.togglePkgBtn.onclick = () => elements.pkgSearchPanel.classList.remove('hidden');
  elements.closePkgBtn.onclick = () => elements.pkgSearchPanel.classList.add('hidden');
  elements.doSearchBtn.onclick = searchPackage;

  // Initialization
  initPyodide();
  fetchNotebooks();

  if (window.AppShell) {
    
  }
})();
