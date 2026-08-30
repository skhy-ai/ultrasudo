/**
 * P2P Calling — Complete rewrite
 * Features: Contacts (localStorage), QR code sharing, DataChannel text chat,
 * call history, audio-only mode, rich status states, WhatsApp contact import.
 */

// ── Constants ─────────────────────────────────────────────────────────────────
const CONTACTS_KEY = 'p2p_contacts';
const HISTORY_KEY  = 'p2p_call_history';
const MAX_HISTORY  = 20;

// ── State ─────────────────────────────────────────────────────────────────────
let peer = null;
let localStream = null;
let currentCall = null;
let dataConn = null;          // DataChannel connection for chat
let isVideoMuted = false;
let isAudioMuted = false;
let isScreenSharing = false;
let audioOnlyMode = false;    // true when camera intentionally disabled
let callTimerInterval = null;
let callStartTime = null;
let myPeerId = '';
let qrCodeInstance = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const localVideo     = document.getElementById('local-video');
const remoteVideo    = document.getElementById('remote-video');
const myIdInput      = document.getElementById('my-id');
const targetIdInput  = document.getElementById('target-id');
const statusText     = document.getElementById('status-text');
const statusBadge    = document.getElementById('status-badge');
const incomingCallBox= document.getElementById('incoming-call');
const incomingFrom   = document.getElementById('incoming-from');
const remoteWaiting  = document.getElementById('remote-waiting');
const callTimerEl    = document.getElementById('call-timer');
const timerDisplay   = document.getElementById('timer-display');
const localAvatar    = document.getElementById('local-avatar');
const remoteLabel    = document.getElementById('remote-label');
const chatMessages   = document.getElementById('chat-messages');
const chatInput      = document.getElementById('chat-input');
const sendChatBtn    = document.getElementById('btn-send-chat');
const chatStatus     = document.getElementById('chat-status');
const contactsList   = document.getElementById('contacts-list');
const callHistory    = document.getElementById('call-history');

// ── Status helpers ────────────────────────────────────────────────────────────
function setStatus(text, type = 'connecting') {
    statusText.textContent = text;
    statusBadge.className = `status-badge ${type}`;
}

// ── Peer initialization ───────────────────────────────────────────────────────
function initPeer() {
    setStatus('Connecting...', 'connecting');
    peer = new Peer({
        host: '0.peerjs.com',
        port: 443,
        path: '/'
    });

    peer.on('open', (id) => {
        myPeerId = id;
        myIdInput.value = id;
        setStatus('Online · Ready', 'online');
    });

    peer.on('call', (call) => {
        incomingCallBox.classList.remove('hidden');
        incomingFrom.textContent = resolveContactName(call.peer) || call.peer;
        incomingFrom.dataset.peerId = call.peer;

        document.getElementById('btn-accept').onclick = () => {
            incomingCallBox.classList.add('hidden');
            answerCall(call, audioOnlyMode);
        };
        document.getElementById('btn-reject').onclick = () => {
            incomingCallBox.classList.add('hidden');
            call.close();
        };
    });

    peer.on('connection', (conn) => {
        setupDataChannel(conn);
    });

    peer.on('error', (err) => {
        setStatus(`Error: ${err.type}`, 'disconnected');
        console.error('PeerJS error:', err);
    });

    peer.on('disconnected', () => setStatus('Disconnected', 'disconnected'));
}

// ── Media ─────────────────────────────────────────────────────────────────────
async function getMedia(withVideo = true) {
    try {
        const constraints = withVideo
            ? { video: { width: 1280, height: 720 }, audio: true }
            : { audio: true, video: false };
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideo.srcObject = localStream;
        audioOnlyMode = !withVideo;
        if (!withVideo) {
            localAvatar.classList.remove('hidden');
            localVideo.classList.add('hidden-video');
        } else {
            localAvatar.classList.add('hidden');
            localVideo.classList.remove('hidden-video');
        }
        return true;
    } catch (err) {
        console.error('Media error:', err);
        setStatus('Camera/mic blocked', 'disconnected');
        return false;
    }
}

// ── Call management ───────────────────────────────────────────────────────────
async function makeCall(withVideo = true) {
    const targetId = targetIdInput.value.trim();
    if (!targetId) { alert('Enter a Peer ID or select a contact.'); return; }

    if (!localStream) {
        const ok = await getMedia(withVideo);
        if (!ok) { alert('Microphone access is required to call.'); return; }
    }

    setStatus(`Calling ${resolveContactName(targetId) || targetId}…`, 'ringing');
    const call = peer.call(targetId, localStream);
    setupCallHandlers(call);
    currentCall = call;

    // Open data channel for chat
    const conn = peer.connect(targetId, { reliable: true });
    setupDataChannel(conn);

    addCallHistory(targetId, 'outgoing');
}

function answerCall(call, withVideo = true) {
    if (!localStream) {
        getMedia(withVideo).then((ok) => {
            if (!ok) { call.close(); return; }
            doAnswer(call);
        });
    } else {
        doAnswer(call);
    }
}

function doAnswer(call) {
    call.answer(localStream);
    setupCallHandlers(call);
    currentCall = call;
    addCallHistory(call.peer, 'incoming');
    setStatus(`In Call · ${resolveContactName(call.peer) || call.peer}`, 'in-call');
}

function setupCallHandlers(call) {
    call.on('stream', (remoteStream) => {
        remoteVideo.srcObject = remoteStream;
        remoteWaiting.style.display = 'none';
        setStatus(`In Call · ${resolveContactName(call.peer) || call.peer}`, 'in-call');
        startCallTimer();
    });
    call.on('close', endCallCleanup);
    call.on('error', (e) => { console.error('Call error:', e); endCallCleanup(); });
}

function endCallCleanup() {
    if (currentCall) { currentCall.close(); currentCall = null; }
    remoteVideo.srcObject = null;
    remoteWaiting.style.display = 'flex';
    stopCallTimer();
    setStatus('Online · Ready', 'online');
    disableChat();
}

// ── Call Timer ────────────────────────────────────────────────────────────────
function startCallTimer() {
    callStartTime = Date.now();
    callTimerEl.classList.remove('hidden');
    callTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
    }, 1000);
}

function stopCallTimer() {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
    callTimerEl.classList.add('hidden');
    timerDisplay.textContent = '00:00';
}

// ── DataChannel / Text Chat ───────────────────────────────────────────────────
function setupDataChannel(conn) {
    dataConn = conn;
    conn.on('open', () => {
        enableChat();
    });
    conn.on('data', (data) => {
        appendChatMessage(data.text, 'received', data.from || 'Remote');
    });
    conn.on('close', disableChat);
    conn.on('error', disableChat);
}

function enableChat() {
    chatInput.disabled = false;
    sendChatBtn.disabled = false;
    chatStatus.textContent = '(connected)';
}

function disableChat() {
    chatInput.disabled = true;
    sendChatBtn.disabled = true;
    chatStatus.textContent = '(connect to chat)';
}

function sendChat() {
    const text = chatInput.value.trim();
    if (!text || !dataConn) return;
    dataConn.send({ text, from: myPeerId });
    appendChatMessage(text, 'sent', 'You');
    chatInput.value = '';
}

function appendChatMessage(text, type, from) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `<span class="chat-from">${from}</span><span class="chat-text">${escHtml(text)}</span><span class="chat-time">${time}</span>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Contacts ──────────────────────────────────────────────────────────────────
function loadContacts() {
    try { return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]'); }
    catch { return []; }
}

function saveContacts(contacts) {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

function renderContacts() {
    const contacts = loadContacts();
    if (!contacts.length) {
        contactsList.innerHTML = '<div class="contacts-empty">No contacts yet. Add one to get started.</div>';
        return;
    }
    contactsList.innerHTML = contacts.map((c, i) => {
        const initials = (c.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const hue = (c.name.charCodeAt(0) * 37) % 360;
        return `
            <div class="contact-item" data-index="${i}" data-peer-id="${c.peerId || ''}">
                <div class="contact-avatar" style="background: hsl(${hue},60%,35%)">${initials}</div>
                <div class="contact-info">
                    <div class="contact-name">${escHtml(c.name)}</div>
                    <div class="contact-peer">${c.peerId ? c.peerId.slice(0, 20) + '…' : 'No Peer ID yet'}</div>
                </div>
                <div class="contact-btns">
                    ${c.peerId ? `<button class="contact-call-btn" title="Call" onclick="callContact('${c.peerId}')"><i class="fas fa-phone"></i></button>` : ''}
                    <button class="contact-del-btn" title="Delete" onclick="deleteContact(${i})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');

    // Click to fill target ID
    contactsList.querySelectorAll('.contact-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const pid = el.dataset.peerId;
            if (pid) { targetIdInput.value = pid; }
        });
    });
}

window.callContact = (peerId) => {
    targetIdInput.value = peerId;
    makeCall(!audioOnlyMode);
};

window.deleteContact = (index) => {
    const contacts = loadContacts();
    contacts.splice(index, 1);
    saveContacts(contacts);
    renderContacts();
};

function resolveContactName(peerId) {
    const contacts = loadContacts();
    const c = contacts.find(c => c.peerId === peerId);
    return c ? c.name : null;
}

// ── Call History ──────────────────────────────────────────────────────────────
function addCallHistory(peerId, direction) {
    let history = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch {}
    history.unshift({
        peerId,
        direction,
        name: resolveContactName(peerId) || peerId,
        time: new Date().toISOString()
    });
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderCallHistory();
}

function renderCallHistory() {
    let history = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch {}
    if (!history.length) {
        callHistory.innerHTML = '<div class="history-empty">No recent calls</div>';
        return;
    }
    callHistory.innerHTML = history.map(h => {
        const icon = h.direction === 'incoming' ? 'fa-phone-arrow-down-left' : 'fa-phone-arrow-up-right';
        const color = h.direction === 'incoming' ? '#34d399' : '#818cf8';
        const date = new Date(h.time);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `
            <div class="history-item" onclick="document.getElementById('target-id').value='${h.peerId}'" title="${h.peerId}">
                <i class="fas ${icon}" style="color:${color}"></i>
                <div class="history-info">
                    <div class="history-name">${escHtml(h.name)}</div>
                    <div class="history-time">${dateStr} ${timeStr}</div>
                </div>
                <button class="history-call-btn" onclick="event.stopPropagation();callContact('${h.peerId}')"><i class="fas fa-phone"></i></button>
            </div>
        `;
    }).join('');
}

// ── UI Event Listeners ────────────────────────────────────────────────────────

// Copy ID
document.getElementById('btn-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(myPeerId).then(() => {
        setStatus('ID Copied!', 'online');
        setTimeout(() => setStatus('Online · Ready', 'online'), 2000);
    });
});

// QR code
document.getElementById('btn-qr').addEventListener('click', () => {
    const modal = document.getElementById('qr-modal');
    const qrBox = document.getElementById('qr-code');
    document.getElementById('qr-peer-id').textContent = myPeerId;
    qrBox.innerHTML = '';
    if (myPeerId && window.QRCode) {
        new QRCode(qrBox, { text: myPeerId, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.H });
    }
    modal.classList.remove('hidden');
});

document.getElementById('btn-close-qr').addEventListener('click', () => {
    document.getElementById('qr-modal').classList.add('hidden');
});

document.getElementById('qr-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
});

// Call buttons
document.getElementById('btn-call-video').addEventListener('click', () => makeCall(true));
document.getElementById('btn-call-audio').addEventListener('click', () => makeCall(false));
document.getElementById('btn-end-call').addEventListener('click', endCallCleanup);

// Controls
document.getElementById('btn-toggle-video').addEventListener('click', (e) => {
    if (!localStream) return;
    const tracks = localStream.getVideoTracks();
    if (!tracks.length) return;
    isVideoMuted = !isVideoMuted;
    tracks[0].enabled = !isVideoMuted;
    const btn = e.currentTarget;
    btn.classList.toggle('muted', isVideoMuted);
    btn.querySelector('i').className = isVideoMuted ? 'fas fa-video-slash' : 'fas fa-video';
});

document.getElementById('btn-toggle-audio').addEventListener('click', (e) => {
    if (!localStream) return;
    isAudioMuted = !isAudioMuted;
    localStream.getAudioTracks().forEach(t => t.enabled = !isAudioMuted);
    const btn = e.currentTarget;
    btn.classList.toggle('muted', isAudioMuted);
    btn.querySelector('i').className = isAudioMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
});

document.getElementById('btn-share-screen').addEventListener('click', async (e) => {
    if (!currentCall) { alert('Must be in a call to share screen.'); return; }
    try {
        if (!isScreenSharing) {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const videoTrack = screenStream.getVideoTracks()[0];
            const sender = currentCall.peerConnection.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(videoTrack);
            localVideo.srcObject = screenStream;
            isScreenSharing = true;
            e.currentTarget.classList.add('active');
            videoTrack.onended = () => stopScreenShare(e.currentTarget);
        } else {
            stopScreenShare(e.currentTarget);
        }
    } catch (err) { console.error('Screen share failed:', err); }
});

function stopScreenShare(btn) {
    if (!currentCall || !localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    const sender = currentCall.peerConnection.getSenders().find(s => s.track?.kind === 'video');
    if (sender && videoTrack) sender.replaceTrack(videoTrack);
    localVideo.srcObject = localStream;
    isScreenSharing = false;
    if (btn) btn.classList.remove('active');
}

// Chat
sendChatBtn.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

// Add contact
document.getElementById('btn-add-contact').addEventListener('click', () => openContactModal(false));
document.getElementById('btn-import-wa').addEventListener('click', () => openContactModal(true));
document.getElementById('btn-close-contact').addEventListener('click', closeContactModal);
document.getElementById('btn-cancel-contact').addEventListener('click', closeContactModal);
document.getElementById('contact-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeContactModal();
});

document.getElementById('btn-save-contact').addEventListener('click', () => {
    const name = document.getElementById('contact-name').value.trim();
    if (!name) { alert('Please enter a contact name.'); return; }
    const peerId = document.getElementById('contact-peer-id').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const contacts = loadContacts();
    contacts.push({ name, peerId, phone, addedAt: new Date().toISOString() });
    saveContacts(contacts);
    renderContacts();
    closeContactModal();
});

function openContactModal(isWhatsApp) {
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-phone').value = '';
    document.getElementById('contact-peer-id').value = '';

    const phoneRow = document.getElementById('phone-row');
    const title = document.getElementById('contact-modal-title');
    const desc = document.getElementById('contact-modal-desc');

    if (isWhatsApp) {
        phoneRow.classList.remove('hidden');
        title.innerHTML = '<i class="fab fa-whatsapp"></i> Import from WhatsApp';
        desc.textContent = 'Enter the contact name and phone number from WhatsApp. You can fill in their Peer ID later when they share it with you.';
    } else {
        phoneRow.classList.add('hidden');
        title.innerHTML = '<i class="fas fa-user-plus"></i> Add Contact';
        desc.textContent = "Enter the contact's name and their Peer ID (they can find it in their P2P app).";
    }

    document.getElementById('contact-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('contact-name').focus(), 50);
}

function closeContactModal() {
    document.getElementById('contact-modal').classList.add('hidden');
}

// Clear history
document.getElementById('btn-clear-history').addEventListener('click', () => {
    localStorage.removeItem(HISTORY_KEY);
    renderCallHistory();
});

// ── Startup ───────────────────────────────────────────────────────────────────
getMedia(true);
initPeer();
renderContacts();
renderCallHistory();
