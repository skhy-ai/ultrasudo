document.addEventListener('DOMContentLoaded', async () => {
  // --- Helpers ---
  const $ = (sel) => document.querySelector(sel);
  const $id = (id) => document.getElementById(id);

  let boardId = 'default-board';
  let myId = '';
  let isAuthenticated = false;

  // Wait for auth resolution
  if (window.supabaseClient) {
    try {
      const { data } = await window.supabaseClient.auth.getSession();
      if (data && data.session) {
        isAuthenticated = true;
        myId = data.session.user.id;
      }
    } catch (e) {
      console.warn("Supabase auth check failed.", e);
    }
  }

  if (!myId) {
    const GUEST_ID_LS = 'kanban_guest_my_id';
    myId = localStorage.getItem(GUEST_ID_LS);
    if (!myId) {
      myId = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      localStorage.setItem(GUEST_ID_LS, myId);
    }
  }

  function getMyNameKey() { return `kanban_my_name_${myId}`; }
  function getBoardLsKey() { return `kanban_automerge_${boardId}`; }

  function uid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

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

  // --- Board Management ---
  const BOARDS_LIST_KEY = isAuthenticated ? `kanban_boards_${myId}` : null;
  let userBoards = [];

  function loadUserBoards() {
    if (!isAuthenticated) return;
    try {
      const saved = localStorage.getItem(BOARDS_LIST_KEY);
      if (saved) userBoards = JSON.parse(saved);
    } catch { }

    if (userBoards.length === 0) {
      userBoards.push({ id: 'default-board', title: 'Default Board' });
      saveUserBoards();
    }
    boardId = userBoards[0].id;
  }

  function saveUserBoards() {
    if (isAuthenticated) {
      localStorage.setItem(BOARDS_LIST_KEY, JSON.stringify(userBoards));
    }
  }

  function renderBoardSelector() {
    const select = $id('board-select');
    const btn = $id('new-board-btn');
    if (!isAuthenticated) return;

    select.style.display = 'inline-block';
    btn.style.display = 'inline-flex';

    select.innerHTML = '';
    userBoards.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.title;
      select.appendChild(opt);
    });
    select.value = boardId;
  }

  $id('board-select')?.addEventListener('change', (e) => switchBoard(e.target.value));

  $id('new-board-btn')?.addEventListener('click', () => {
    const title = prompt('New board title:');
    if (title) {
      const newId = 'board_' + uid();
      userBoards.push({ id: newId, title });
      saveUserBoards();
      switchBoard(newId);
    }
  });

  function switchBoard(newId) {
    boardId = newId;
    doc = Automerge.init();
    initDoc();
    restore();
    renderBoardSelector();
    render();
  }

  // --- CRDT State ---
  let doc = Automerge.init();

  function initDoc() {
    if (!doc.lists) {
      doc = Automerge.change(doc, d => {
        d.board = { id: boardId, title: 'Kanban Board' };
        d.lists = [
          { id: 'todo', title: 'To Do', position: 0 },
          { id: 'doing', title: 'In Progress', position: 1 },
          { id: 'done', title: 'Done', position: 2 },
        ];
        d.cards = [];
        d.members = [];
      });
    }
    if (!doc.members) {
      doc = Automerge.change(doc, d => { d.members = []; });
    }
    ensureSelfMember();
  }

  function persist() {
    try {
      const bin = Automerge.save(doc);
      const b64 = u8ToB64(bin);
      localStorage.setItem(getBoardLsKey(), b64);
      if (window.setAppData) {
        window.setAppData(getBoardLsKey(), b64, 'kanban-board');
      }

      const currentTitle = doc.board?.title || 'Kanban Board';
      const titleEl = $id('board-title');
      if (titleEl) titleEl.textContent = currentTitle;

      if (isAuthenticated) {
        const bd = userBoards.find(x => x.id === boardId);
        if (bd && bd.title !== currentTitle) {
          bd.title = currentTitle;
          saveUserBoards();
          renderBoardSelector();
        }
      }
    } catch { }
  }

  function restore() {
    try {
      let b64 = localStorage.getItem(getBoardLsKey());
      if (window.getAppData) {
        b64 = window.getAppData(getBoardLsKey(), b64);
      }
      if (b64) {
        const loaded = Automerge.load(b64ToU8(b64));
        doc = Automerge.merge(doc, loaded);
      }
    } catch { }
    const titleEl = $id('board-title');
    if (titleEl) titleEl.textContent = doc.board?.title || 'Kanban Board';
  }

  // Sync logic
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'DATA_CHANGE' && e.data.key === getBoardLsKey()) {
      if (e.data.value) {
        try {
          const other = Automerge.load(b64ToU8(e.data.value));
          doc = Automerge.merge(doc, other);
          render();
        } catch (err) { }
      }
    }
  });

  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('kanban:app') : null;
  bc?.addEventListener('message', (e) => {
    if (e?.data?.type === 'snapshot' && e.data.boardId === boardId) {
      try {
        const other = Automerge.load(b64ToU8(e.data.payload));
        doc = Automerge.merge(doc, other);
        persist();
        render();
      } catch { }
    }
  });
  function bcBroadcast() {
    try {
      const payload = u8ToB64(Automerge.save(doc));
      bc?.postMessage({ type: 'snapshot', payload, boardId });
    } catch { }
  }

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
    pc.onicecandidate = () => { };
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
        setupPeer(false);
        await pc.setRemoteDescription(obj.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForIceGathering(pc);
        const out = { type: 'answer', sdp: pc.localDescription, boardId };
        $id('offer-output').value = btoa(JSON.stringify(out));
        $id('signal-input').value = '';
      } else if (obj.type === 'answer' && pendingOfferer) {
        await pc.setRemoteDescription(obj.sdp);
        pendingOfferer = false;
        $id('signal-input').value = '';
        alert('Connection established!');
      }
    } catch (e) { alert('Invalid signal payload'); }
  }

  function wireDataChannel(channel) {
    channel.onopen = () => {
      try { channel.send(JSON.stringify({ t: 'snapshot', boardId, b64: u8ToB64(Automerge.save(doc)) })); } catch { }
    };
    channel.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.t === 'snapshot' && msg.b64 && msg.boardId === boardId) {
          const other = Automerge.load(b64ToU8(msg.b64));
          doc = Automerge.merge(doc, other);
          persist();
          render();
        }
      } catch { }
    };
  }

  function notifyPeers() {
    if (!doc) return;
    const payload = JSON.stringify({ t: 'snapshot', boardId, b64: u8ToB64(Automerge.save(doc)) });
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
      if (!d.cards) d.cards = [];
      d.cards.push({ id: uid(), title, listId, position: Date.now(), assigneeId: null });
    });
    persist();
    render();
    notifyPeers();
  }

  function moveCard(cardId, newListId) {
    doc = Automerge.change(doc, d => {
      if (!d.cards) return;
      const c = d.cards.find(x => x.id === cardId);
      if (c) { c.listId = newListId; c.position = Date.now(); }
    });
    persist();
    render();
    notifyPeers();
  }

  function deleteCard(cardId) {
    doc = Automerge.change(doc, d => {
      if (!d.cards) return;
      const idx = d.cards.findIndex(x => x.id === cardId);
      if (idx >= 0) d.cards.splice(idx, 1);
    });
    persist();
    render();
    notifyPeers();
  }

  function render() {
    const boardEl = $id('board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const lists = (doc.lists || []).slice().sort((a, b) => a.position - b.position);
    const cardsByList = (doc.cards || []).reduce((acc, card) => {
      if (!acc[card.listId]) acc[card.listId] = [];
      acc[card.listId].push(card);
      return acc;
    }, {});

    for (const list of lists) {
      const col = document.createElement('div');
      col.className = 'kb-column';
      col.dataset.list = list.id;

      const title = document.createElement('div');
      title.className = 'kb-col-title';
      title.textContent = list.title;
      col.appendChild(title);

      const cardsEl = document.createElement('div');
      cardsEl.className = 'kb-cards';
      cardsEl.id = `col-${list.id}`;

      const cards = (cardsByList[list.id] || []).slice().sort((a, b) => a.position - b.position);
      for (const c of cards) {
        const card = document.createElement('div');
        card.className = 'kb-card';
        card.draggable = true;
        card.dataset.id = c.id;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'card-title';
        titleDiv.textContent = c.title;
        card.appendChild(titleDiv);

        const del = document.createElement('button');
        del.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        del.className = 'kb-del';
        del.onclick = (e) => { e.stopPropagation(); deleteCard(c.id); };
        card.appendChild(del);

        const footer = document.createElement('div');
        footer.className = 'card-footer';

        const assignee = getMemberById(c.assigneeId);

        // Custom styling for badging
        const badgeOuter = document.createElement('div');
        if (assignee) {
          const badge = document.createElement('span');
          badge.className = 'assignee-badge';
          if (assignee.isAgent) {
            badge.innerHTML = `<i class="fa-solid fa-robot"></i> ${displayName(assignee)}`;
            badge.style.color = 'var(--agent-color)';
            badge.style.background = 'rgba(163, 113, 247, 0.1)';
            badge.style.borderColor = 'rgba(163, 113, 247, 0.2)';
          } else {
            badge.textContent = `${displayName(assignee)}`;
          }
          badgeOuter.appendChild(badge);
        }
        footer.appendChild(badgeOuter);

        const select = document.createElement('select');
        select.className = 'assign-select';
        const members = (doc.members || []).slice().sort((a, b) => displayName(a).localeCompare(displayName(b)));

        const optNone = document.createElement('option');
        optNone.value = '';
        optNone.textContent = '— Assign to... —';
        select.appendChild(optNone);

        for (const m of members) {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = displayName(m) + (m.isAgent ? ' (AI)' : '');
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

      const addBtn = document.createElement('button');
      addBtn.className = 'add-card-btn';
      addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add a card';
      addBtn.onclick = () => {
        const t = prompt('Card title');
        if (t && t.trim()) addCard(t.trim(), list.id);
      };
      col.appendChild(addBtn);

      boardEl.appendChild(col);
    }
    wireDnD();
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
        if (id) {
          const listId = col.getAttribute('data-list');
          moveCard(id, listId);
        }
      });
    });
  }

  function setupUI() {
    const modal = $id('invite-modal');
    $id('share-btn')?.addEventListener('click', () => { modal.style.display = 'flex'; });
    $id('modal-close-btn')?.addEventListener('click', () => { modal.style.display = 'none'; });
    $id('create-invite-btn')?.addEventListener('click', createInvite);
    $id('accept-invite-btn')?.addEventListener('click', acceptInvite);

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

    // Agent setup
    $id('add-agent-btn')?.addEventListener('click', () => {
      const agentName = ($id('agent-name-input')?.value || '').trim();
      if (agentName) {
        addAgent(agentName);
        $id('agent-name-input').value = '';
        renderMembersBar();
        renderTeamList();
        notifyPeers();
      }
    });
  }

  // --- Members & Assignment Logic ---
  function ensureSelfMember() {
    const existing = (doc.members || []).find(m => m.id === myId);
    if (!existing) {
      doc = Automerge.change(doc, d => {
        if (!d.members) d.members = [];
        d.members.push({ id: myId, name: localStorage.getItem(getMyNameKey()) || '', joinedAt: Date.now(), isAgent: false });
      });
      persist();
    } else {
      const lsName = localStorage.getItem(getMyNameKey()) || '';
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
    localStorage.setItem(getMyNameKey(), name);
    doc = Automerge.change(doc, d => {
      const m = d.members.find(x => x.id === myId);
      if (m) m.name = name; else d.members.push({ id: myId, name, joinedAt: Date.now(), isAgent: false });
    });
    persist();
  }

  function addAgent(name) {
    const agentId = 'agent_' + uid();
    doc = Automerge.change(doc, d => {
      if (!d.members) d.members = [];
      d.members.push({ id: agentId, name, joinedAt: Date.now(), isAgent: true });
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
      if (m.isAgent) continue;
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
      li.innerHTML = `${m.isAgent ? '<i class="fa-solid fa-robot" style="color:var(--agent-color)"></i> ' : '<i class="fa-solid fa-user" style="color:var(--text-muted)"></i> '}${displayName(m)}${m.id === myId ? ' (you)' : ''}`;
      ul.appendChild(li);
    }
    const myInput = $id('my-name-input');
    if (myInput) myInput.value = localStorage.getItem(getMyNameKey()) || (getMemberById(myId)?.name || '');
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

  window.Kanban = {
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
    },
    addCard(title, listId) { addCard(title, listId); },
    moveCard(cardId, newListId) { moveCard(cardId, newListId); },
    setAssignee(cardId, memberId) { setAssignee(cardId, memberId); }
  };

  // Boot
  loadUserBoards();
  renderBoardSelector();
  initDoc();
  restore();

  // Robust seed implementation guaranteeing the lists logic works
  if (!doc.cards || doc.cards.length === 0) {
    try {
      doc = Automerge.change(doc, d => {
        if (!d.cards) d.cards = [];
        d.cards.push({ id: uid(), title: 'Welcome to Kanban!', listId: 'todo', position: Date.now() - 3, assigneeId: null });
        d.cards.push({ id: uid(), title: 'Click + Add a card to create tasks', listId: 'todo', position: Date.now() - 2, assigneeId: null });
        d.cards.push({ id: uid(), title: 'Drag cards across columns', listId: 'doing', position: Date.now() - 1, assigneeId: null });
      });
      persist();
    } catch (e) { console.error("Failed to seed initial cards", e); }
  }

  render();
  setupUI();
});
