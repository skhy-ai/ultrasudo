(function () {
  const editor = document.getElementById('editor');
  const titleInput = document.getElementById('document-title');
  const notesList = document.getElementById('notes-list');
  const newNoteBtn = document.getElementById('new-note-btn');
  const statsDisplay = document.getElementById('stats-display');

  const API_BASE = 'http://127.0.0.1:5006/api/notes';
  let currentNoteId = null;
  let autosaveTimer = null;

  // --- Backend Integration ---

  async function fetchNotes() {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch notes');
      const notes = await res.json();
      renderNotesList(notes);
    } catch (err) {
      console.error(err);
      notesList.innerHTML = '<div class="error">Error loading notes</div>';
    }
  }

  async function loadNote(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error('Failed to load note');
      const note = await res.json();

      currentNoteId = note.id;
      titleInput.value = note.title;
      editor.innerHTML = note.content;

      updateActiveState();
      updateStats();
    } catch (err) {
      console.error(err);
      alert('Error loading note');
    }
  }

  async function saveNote() {
    if (!titleInput.value.trim() && !editor.innerText.trim()) return;

    const payload = {
      id: currentNoteId,
      title: titleInput.value || 'Untitled Note',
      content: editor.innerHTML
    };

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save');
      const saved = await res.json();

      if (!currentNoteId) {
        currentNoteId = saved.id;
        fetchNotes(); // Refresh list to show new note
      } else {
        // Update timestamp in sidebar without full refresh if possible
        const item = document.querySelector(`[data-id="${currentNoteId}"] .note-item-date`);
        if (item) item.textContent = 'Just now';
      }
    } catch (err) {
      console.error('Save failed', err);
    }
  }

  async function deleteNote(id, event) {
    if (event) event.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      if (currentNoteId === id) {
        createNewNote();
      }
      fetchNotes();
    } catch (err) {
      console.error(err);
      alert('Error deleting note');
    }
  }

  // --- UI Logic ---

  function renderNotesList(notes) {
    notesList.innerHTML = '';
    if (notes.length === 0) {
      notesList.innerHTML = '<div class="empty-state">No notes yet</div>';
      return;
    }

    notes.forEach(note => {
      const div = document.createElement('div');
      div.className = `note-item ${note.id === currentNoteId ? 'active' : ''}`;
      div.dataset.id = note.id;
      div.onclick = () => loadNote(note.id);

      const date = new Date(note.last_modified).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      div.innerHTML = `
                <div class="note-item-title">${note.title || 'Untitled'}</div>
                <div class="note-item-date">${date}</div>
                <button class="delete-note-inline" title="Delete">&times;</button>
            `;

      div.querySelector('.delete-note-inline').onclick = (e) => deleteNote(note.id, e);
      notesList.appendChild(div);
    });
  }

  function createNewNote() {
    currentNoteId = null;
    titleInput.value = '';
    editor.innerHTML = '';
    updateActiveState();
    updateStats();
    titleInput.focus();
  }

  function updateActiveState() {
    document.querySelectorAll('.note-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === currentNoteId);
    });
  }

  function updateStats() {
    const text = editor.innerText || '';
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    statsDisplay.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  }

  // --- Formatting Logic ---

  function exec(command, value = null) {
    editor.focus();
    document.execCommand(command, false, value);
  }

  // Toolbar Event Listeners
  document.querySelectorAll('[data-command]').forEach(btn => {
    btn.addEventListener('click', () => exec(btn.dataset.command));
  });

  document.getElementById('format-block').addEventListener('change', (e) => {
    exec('formatBlock', e.target.value);
  });

  document.getElementById('font-color').addEventListener('input', (e) => {
    exec('foreColor', e.target.value);
  });

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'createLink') {
        const url = prompt('Enter URL:');
        if (url) exec('createLink', url);
      } else if (action === 'insertImageUpload') {
        document.getElementById('image-upload').click();
      } else if (action === 'insertTable') {
        const r = prompt('Rows?', '2');
        const c = prompt('Cols?', '2');
        if (r && c) insertTable(r, c);
      }
    });
  });

  function insertTable(rows, cols) {
    let html = '<table class="nb-table">';
    for (let i = 0; i < rows; i++) {
      html += '<tr>';
      for (let j = 0; j < cols; j++) html += '<td><br></td>';
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    exec('insertHTML', html);
  }

  document.getElementById('image-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => exec('insertImage', reader.result);
    reader.readAsDataURL(file);
  });

  // --- Autosave & Initialization ---

  function triggerAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveNote, 1500);
    updateStats();
  }

  editor.addEventListener('input', triggerAutosave);
  titleInput.addEventListener('input', triggerAutosave);
  newNoteBtn.addEventListener('click', createNewNote);

  // Export Logic
  document.getElementById('download-docx').onclick = () => {
    if (!window.htmlDocx) return alert('DOCX library not ready');
    const content = `<html><body>${editor.innerHTML}</body></html>`;
    const blob = window.htmlDocx.asBlob(content);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${titleInput.value || 'note'}.docx`;
    link.click();
  };

  document.getElementById('download-pdf').onclick = () => {
    if (typeof html2pdf !== 'function') return alert('PDF library not ready');
    html2pdf().from(editor).save(`${titleInput.value || 'note'}.pdf`);
  };

  // Init
  fetchNotes();
  if (window.AppShell) {
    AppShell.init({ appId: 'notebook', title: 'Notebook' });
  }

})();
