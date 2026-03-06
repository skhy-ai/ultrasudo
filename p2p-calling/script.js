const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const myIdInput = document.getElementById('my-id');
const targetIdInput = document.getElementById('target-id');
const statusDisplay = document.getElementById('status-display');
const incomingCallBox = document.getElementById('incoming-call');
const remoteWaiting = document.getElementById('remote-waiting');

let peer;
let localStream = null;
let currentCall = null;
let isVideoMuted = false;
let isAudioMuted = false;
let isScreenSharing = false;

// Initialize PeerJS with a public server
function initPeer() {
    peer = new Peer({
        host: '0.peerjs.com',
        port: 443,
        path: '/'
    });

    peer.on('open', (id) => {
        myIdInput.value = id;
        statusDisplay.textContent = 'Connected to Server';
    });

    peer.on('call', (call) => {
        // Show incoming call UI
        incomingCallBox.classList.remove('hidden');
        
        document.getElementById('btn-accept').onclick = () => {
            incomingCallBox.classList.add('hidden');
            answerCall(call);
        };
        
        document.getElementById('btn-reject').onclick = () => {
            incomingCallBox.classList.add('hidden');
            call.close();
        };
    });

    peer.on('error', (err) => {
        console.error(err);
        statusDisplay.textContent = `Error: ${err.type}`;
    });
}

async function getMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (err) {
        console.error('Failed to get local stream', err);
        statusDisplay.textContent = 'Camera/Mic blocked';
    }
}

function answerCall(call) {
    if (!localStream) {
        alert("Microphone and Camera access required to answer");
        return;
    }
    call.answer(localStream);
    setupCallHandlers(call);
    currentCall = call;
    statusDisplay.textContent = `In call with ${call.peer}`;
}

function makeCall() {
    const targetId = targetIdInput.value.trim();
    if (!targetId) return;
    if (!localStream) {
        alert("Microphone and Camera access required to call");
        return;
    }

    statusDisplay.textContent = `Calling ${targetId}...`;
    const call = peer.call(targetId, localStream);
    setupCallHandlers(call);
    currentCall = call;
}

function setupCallHandlers(call) {
    call.on('stream', (remoteStream) => {
        remoteVideo.srcObject = remoteStream;
        remoteWaiting.style.display = 'none';
    });

    call.on('close', () => {
        endCallCleanup();
    });
}

function endCallCleanup() {
    if (currentCall) {
        currentCall.close();
        currentCall = null;
    }
    remoteVideo.srcObject = null;
    remoteWaiting.style.display = 'block';
    statusDisplay.textContent = 'Call Ended';
}

// UI Controls
document.getElementById('btn-copy').addEventListener('click', () => {
    myIdInput.select();
    document.execCommand('copy');
    statusDisplay.textContent = 'ID Copied!';
    setTimeout(() => { if (peer) statusDisplay.textContent = 'Connected to Server'; }, 2000);
});

document.getElementById('btn-call').addEventListener('click', makeCall);

document.getElementById('btn-end-call').addEventListener('click', endCallCleanup);

document.getElementById('btn-toggle-video').addEventListener('click', (e) => {
    if (!localStream) return;
    isVideoMuted = !isVideoMuted;
    localStream.getVideoTracks()[0].enabled = !isVideoMuted;
    const btn = e.currentTarget;
    if (isVideoMuted) {
        btn.classList.add('muted');
        btn.innerHTML = '<i class="fas fa-video-slash"></i>';
    } else {
        btn.classList.remove('muted');
        btn.innerHTML = '<i class="fas fa-video"></i>';
    }
});

document.getElementById('btn-toggle-audio').addEventListener('click', (e) => {
    if (!localStream) return;
    isAudioMuted = !isAudioMuted;
    localStream.getAudioTracks()[0].enabled = !isAudioMuted;
    const btn = e.currentTarget;
    if (isAudioMuted) {
        btn.classList.add('muted');
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    } else {
        btn.classList.remove('muted');
        btn.innerHTML = '<i class="fas fa-microphone"></i>';
    }
});

document.getElementById('btn-share-screen').addEventListener('click', async (e) => {
    if (!currentCall) {
        alert("Must be in a call to share screen");
        return;
    }
    
    try {
        if (!isScreenSharing) {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const videoTrack = screenStream.getVideoTracks()[0];
            
            // Replace track in peer connection
            const sender = currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
            sender.replaceTrack(videoTrack);
            
            // Local viewing
            localVideo.srcObject = screenStream;
            isScreenSharing = true;
            e.currentTarget.classList.add('muted');
            
            // Handle native stop sharing
            videoTrack.onended = () => {
                stopScreenShare(e.currentTarget);
            };
        } else {
            stopScreenShare(e.currentTarget);
        }
    } catch (err) {
        console.error("Screen sharing failed", err);
    }
});

function stopScreenShare(btn) {
    const videoTrack = localStream.getVideoTracks()[0];
    const sender = currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
    sender.replaceTrack(videoTrack);
    localVideo.srcObject = localStream;
    isScreenSharing = false;
    if (btn) btn.classList.remove('muted');
}

// Startup
getMedia();
initPeer();
