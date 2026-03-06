(() => {
  // --- Helpers ---
  const $ = (sel) => document.querySelector(sel);
  const $id = (id) => document.getElementById(id);
  const boardId = 'default-board';
  const MY_ID_LS = 'kanban_my_id_' + boardId;
  const MY_NAME_LS = 'kanban_my_name_' + boardId;

  let myId = localStorage.getItem(MY_ID_LS);
  if (!myId) {
    myId = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    localStorage.setItem(MY_ID_LS, myId);
  }

  function uid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Uint8Array <-> base64
  function u8ToB64(u8) {
    let s = '';
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return btoa(s);
  }
  function b64ToU8(b64) {
    const s = atob(b64);
    const u8 = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    return u8;
  }

  // --- CRDT State ---
  let doc = Automerge.init();

  function initDoc() {
    if (!doc.lists) {
      doc = Automerge.change(doc, d => {
        d.board = { id: boardId, title: 'Kanban Board' };
        d.lists = [
          { id: 'todo', title: 'To Do', position: 0 },
          { id: 'doing', title: 'Doing', position: 1 },
          { id: 'done', title: 'Done', position: 2 },
        ];
        d.cards = [];
        d.members = [];
      });
    }
    // Ensure members array exists and self member is present
    if (!doc.members) {
      doc = Automerge.change(doc, d => { d.members = []; });
    }
    ensureSelfMember();
  }

  // Persistence (localStorage minimal)
  const LS_KEY = 'kanban_automerge_' + boardId;
  function persist() {
    try {
      const bin = Automerge.save(doc);
      const b64 = u8ToB64(bin);
      localStorage.setItem(LS_KEY, b64);
      if (window.setAppData) {
        window.setAppData(LS_KEY, b64, 'kanban-board');
      }
    } catch { }
  }
  function restore() {
    try {
      let b64 = localStorage.getItem(LS_KEY);
      if (window.getAppData) {
        b64 = window.getAppData(LS_KEY, b64);
      }
      if (b64) {
        const loaded = Automerge.load(b64ToU8(b64));
        doc = Automerge.merge(doc, loaded);
      }
    } catch { }
  }

  // Listen for cross-device sync changes from DataManager
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'DATA_CHANGE' && e.data.key === LS_KEY) {
      if (e.data.value) {
        try {
          const other = Automerge.load(b64ToU8(e.data.value));
          doc = Automerge.merge(doc, other);
          render();
        } catch (err) {
          console.error("Failed to merge cloud sync state:", err);
        }
      }
    }
  });

  // BroadcastChannel (same-device sync)
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('kanban:' + boardId) : null;
  bc?.addEventListener('message', (e) => {
    if (e?.data?.type === 'snapshot') {
      const other = Automerge.load(b64ToU8(e.data.payload));
      doc = Automerge.merge(doc, other);
      persist();
      render();
    }
  });
  function bcBroadcast() {
    try {
      const payload = u8ToB64(Automerge.save(doc));
      bc?.postMessage({ type: 'snapshot', payload });
    } catch { }
  }

  // --- WebRTC (manual signaling) ---
  let pc = null;
  let dc = null;
  let pendingOfferer = false;

  function setupPeer(isOfferer) {
    pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    if (isOfferer) {
      dc = pc.createDataChannel('kb');
      wireDataChannel(dc);
      pendingOfferer = true;
    } else {
      pc.ondatachannel = (ev) => { dc = ev.channel; wireDataChannel(dc); };
    }
    pc.onicecandidate = () => {
      // Intentionally no trickle; wait for complete localDescription
    };
  }

  async function createInvite() {
    setupPeer(true);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGathering(pc);
    const out = { type: 'offer', sdp: pc.localDescription, boardId };
    $id('offer-output').value = btoa(JSON.stringify(out));
  }

  async function acceptInvite() {
    const text = $id('signal-input').value.trim();
    if (!text) return;
    try {
      const obj = JSON.parse(atob(text));
      if (obj.type === 'offer') {
        // We are answerer
        setupPeer(false);
        await pc.setRemoteDescription(obj.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForIceGathering(pc);
        const out = { type: 'answer', sdp: pc.localDescription, boardId };
        // Put answer in the *offer* output box for easy copying
        $id('offer-output').value = btoa(JSON.stringify(out));
        $id('signal-input').value = ''; // Clear input
      } else if (obj.type === 'answer' && pendingOfferer) {
        // Complete inviter side
        await pc.setRemoteDescription(obj.sdp);
        pendingOfferer = false;
        $id('signal-input').value = ''; // Clear input
        alert('Connection established!');
      } else {
        alert('Unrecognized signal or wrong state');
      }
    } catch (e) {
      console.error(e);
      alert('Invalid signal payload');
    }
  }

  function wireDataChannel(channel) {
    channel.onopen = () => {
      alert('Peer connected!');
      // Send snapshot immediately
      try { channel.send(JSON.stringify({ t: 'snapshot', b64: u8ToB64(Automerge.save(doc)) })); } catch { }
    };
    channel.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.t === 'snapshot' && msg.b64) {
          const other = Automerge.load(b64ToU8(msg.b64));
          doc = Automerge.merge(doc, other);
          persist();
          render();
        }
      } catch { }
    };
  }

  function notifyPeers() {
    const payload = JSON.stringify({ t: 'snapshot', b64: u8ToB64(Automerge.save(doc)) });
    try { dc?.readyState === 'open' && dc.send(payload); } catch { }
    bcBroadcast();
  }

  function waitForIceGathering(pc) {
    if (pc.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise(res => {
      const check = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', check);
          res();
        }
      };
      pc.addEventListener('icegatheringstatechange', check);
    });
  }

  // --- Kanban UI ---
  function addCard(title, listId) {
    doc = Automerge.change(doc, d => {
      d.cards.push({ id: uid(), title, listId, position: Date.now(), assigneeId: null });
    });
    persist();
    render();
    notifyPeers();
  }

  function moveCard(cardId, newListId) {
    doc = Automerge.change(doc, d => {
      const c = d.cards.find(x => x.id === cardId);
      if (c) { c.listId = newListId; c.position = Date.now(); }
    });
    persist();
    render();
    notifyPeers();
  }

  function deleteCard(cardId) {
    doc = Automerge.change(doc, d => {
      const idx = d.cards.findIndex(x => x.id === cardId);
      if (idx >= 0) d.cards.splice(idx, 1);
    });
    persist();
    render();
    notifyPeers();
  }

  function render() {
    const boardEl = $id('board');
    boardEl.innerHTML = ''; // Clear board

    const lists = (doc.lists || []).slice().sort((a, b) => a.position - b.position);
    const cardsByList = (doc.cards || []).reduce((acc, card) => {
      if (!acc[card.listId]) acc[card.listId] = [];
      acc[card.listId].push(card);
      return acc;
    }, {});

    for (const list of lists) {
      // Create column
      const col = document.createElement('div');
      col.className = 'kb-column';
      col.dataset.list = list.id;

      // Create title
      const title = document.createElement('div');
      title.className = 'kb-col-title';
      title.textContent = list.title;
      col.appendChild(title);

      // Create cards container
      const cardsEl = document.createElement('div');
      cardsEl.className = 'kb-cards';
      cardsEl.id = `col-${list.id}`;

      const cards = (cardsByList[list.id] || []).slice().sort((a, b) => a.position - b.position);
      for (const c of cards) {
        const card = document.createElement('div');
        card.className = 'kb-card';
        card.draggable = true;
        card.dataset.id = c.id;

        // Title
        const titleDiv = document.createElement('div');
        titleDiv.textContent = c.title;
        card.appendChild(titleDiv);

        const del = document.createElement('button');
        del.textContent = '×';
        del.className = 'kb-del';
        del.onclick = (e) => { e.stopPropagation(); deleteCard(c.id); };
        card.appendChild(del);

        // Footer with assignee
        const footer = document.createElement('div');
        footer.className = 'card-footer';

        const assignee = getMemberById(c.assigneeId);
        const badge = document.createElement('span');
        badge.className = 'assignee-badge';
        badge.textContent = assignee ? `Assigned: ${displayName(assignee)}` : 'Unassigned';
        footer.appendChild(badge);

        const select = document.createElement('select');
        select.className = 'assign-select';
        const members = (doc.members || []).slice().sort((a, b) => displayName(a).localeCompare(displayName(b)));
        // Unassigned option
        const optNone = document.createElement('option');
        optNone.value = '';
        optNone.textContent = '— Unassigned —';
        select.appendChild(optNone);
        for (const m of members) {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = displayName(m);
          select.appendChild(opt);
        }
        select.value = c.assigneeId || '';
        select.onchange = () => setAssignee(c.id, select.value || null);
        footer.appendChild(select);

        card.appendChild(footer);

        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', c.id);
        });
        cardsEl.appendChild(card);
      }
      col.appendChild(cardsEl);

      // Add card button
      const addBtn = document.createElement('button');
      addBtn.className = 'add-card-btn';
      addBtn.textContent = '+ Add a card';
      addBtn.onclick = () => {
        const t = prompt('Card title');
        if (t) addCard(t, list.id);
      };
      col.appendChild(addBtn);

      boardEl.appendChild(col);
    }
    wireDnD(); // Re-wire drag and drop after every render
    renderMembersBar();
    renderTeamList();
  }

  function wireDnD() {
    const cols = document.querySelectorAll('.kb-column');
    cols.forEach(col => {
      col.addEventListener('dragover', e => e.preventDefault());
      col.addEventListener('drop', e => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const listId = col.getAttribute('data-list');
        moveCard(id, listId);
      });
    });
  }

  // --- Modal & Toolbar Actions ---
  function setupUI() {
    const modal = $id('invite-modal');
    $id('share-btn')?.addEventListener('click', () => { modal.style.display = 'flex'; });
    $id('modal-close-btn')?.addEventListener('click', () => { modal.style.display = 'none'; });
    $id('create-invite-btn')?.addEventListener('click', createInvite);
    $id('accept-invite-btn')?.addEventListener('click', acceptInvite);

    // Team modal
    const teamModal = $id('team-modal');
    $id('team-btn')?.addEventListener('click', () => { teamModal.style.display = 'flex'; renderTeamList(); });
    $id('team-modal-close')?.addEventListener('click', () => { teamModal.style.display = 'none'; });
    $id('save-my-name-btn')?.addEventListener('click', () => {
      const name = ($id('my-name-input')?.value || '').trim();
      if (name) {
        setMyName(name);
        renderMembersBar();
        renderTeamList();
        notifyPeers();
      }
    });
  }

  // Public API for AppShell
  const Kanban = {
    serialize() {
      return { b64: u8ToB64(Automerge.save(doc)) };
    },
    load(data) {
      if (data?.b64) {
        const other = Automerge.load(b64ToU8(data.b64));
        doc = Automerge.merge(doc, other);
        persist();
        render();
        notifyPeers();
      }
    }
  };
  window.Kanban = Kanban;

  // Boot
  initDoc();
  restore();
  // Seed with example cards if none present (first run UX)
  try {
    if (!doc.cards || doc.cards.length === 0) {
      doc = Automerge.change(doc, d => {
        d.cards.push({ id: uid(), title: 'Welcome to Kanban!', listId: 'todo', position: Date.now() - 3, assigneeId: null });
        d.cards.push({ id: uid(), title: 'Click + Add a card to create tasks', listId: 'todo', position: Date.now() - 2, assigneeId: null });
        d.cards.push({ id: uid(), title: 'Drag cards across columns', listId: 'doing', position: Date.now() - 1, assigneeId: null });
      });
      persist();
    }
  } catch { }
  render();
  setupUI();

  // --- Members & Assignment Logic ---
  function ensureSelfMember() {
    const existing = (doc.members || []).find(m => m.id === myId);
    if (!existing) {
      doc = Automerge.change(doc, d => {
        d.members.push({ id: myId, name: localStorage.getItem(MY_NAME_LS) || '', joinedAt: Date.now() });
      });
      persist();
    } else {
      // Bring name from localStorage if doc empty
      const lsName = localStorage.getItem(MY_NAME_LS) || '';
      if (lsName && existing.name !== lsName) {
        doc = Automerge.change(doc, d => {
          const m = d.members.find(x => x.id === myId);
          if (m) m.name = lsName;
        });
        persist();
      }
    }
  }

  function setMyName(name) {
    localStorage.setItem(MY_NAME_LS, name);
    doc = Automerge.change(doc, d => {
      const m = d.members.find(x => x.id === myId);
      if (m) m.name = name; else d.members.push({ id: myId, name, joinedAt: Date.now() });
    });
    persist();
  }

  function getMemberById(id) {
    if (!id) return null;
    return (doc.members || []).find(m => m.id === id) || null;
  }

  function displayName(member) {
    if (!member) return '';
    return member.name?.trim() || (member.id === myId ? 'Me' : member.id.slice(0, 6));
  }

  function renderMembersBar() {
    const bar = $id('members-bar');
    if (!bar) return;
    bar.innerHTML = '';
    const members = (doc.members || []).slice().sort((a, b) => displayName(a).localeCompare(displayName(b)));
    for (const m of members) {
      const pill = document.createElement('span');
      pill.className = 'member-pill';
      pill.textContent = displayName(m);
      bar.appendChild(pill);
    }
  }

  function renderTeamList() {
    const ul = $id('members-list');
    if (!ul) return;
    ul.innerHTML = '';
    const members = (doc.members || []).slice().sort((a, b) => displayName(a).localeCompare(displayName(b)));
    for (const m of members) {
      const li = document.createElement('li');
      li.textContent = `${displayName(m)}${m.id === myId ? ' (you)' : ''}`;
      ul.appendChild(li);
    }
    const myInput = $id('my-name-input');
    if (myInput) myInput.value = localStorage.getItem(MY_NAME_LS) || (getMemberById(myId)?.name || '');
  }

  function setAssignee(cardId, memberId) {
    doc = Automerge.change(doc, d => {
      const c = d.cards.find(x => x.id === cardId);
      if (c) c.assigneeId = memberId || null;
    });
    persist();
    render();
    notifyPeers();
  }
})();
