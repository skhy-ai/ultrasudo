document.addEventListener('DOMContentLoaded', () => {
    const audio = new Audio();
    const playlistElement = document.getElementById('playlist');
    const playPauseBtn = document.getElementById('play-pause');
    const nextBtn = document.getElementById('next');
    const previousBtn = document.getElementById('previous');
    const volumeControl = document.getElementById('volume');
    const nowPlaying = document.getElementById('now-playing');

    let playlist = [];
    let currentIndex = 0;

    // Sample songs (you can add more or load from files)
    playlist = [
        { title: 'Song 1', src: 'song1.mp3' },
        { title: 'Song 2', src: 'song2.mp3' },
        { title: 'Song 3', src: 'song3.mp3' }
    ];

    function loadPlaylist() {
        playlistElement.innerHTML = '';
        playlist.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = song.title;
            li.addEventListener('click', () => playSong(index));
            playlistElement.appendChild(li);
        });
    }

    function playSong(index) {
        currentIndex = index;
        audio.src = playlist[currentIndex].src;
        audio.play();
        playPauseBtn.textContent = 'Pause';
        nowPlaying.textContent = `Now Playing: ${playlist[currentIndex].title}`;
    }

    playPauseBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playPauseBtn.textContent = 'Pause';
        } else {
            audio.pause();
            playPauseBtn.textContent = 'Play';
        }
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % playlist.length;
        playSong(currentIndex);
    });

    previousBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        playSong(currentIndex);
    });

    volumeControl.addEventListener('input', () => {
        audio.volume = volumeControl.value;
    });

    audio.addEventListener('ended', () => {
        if (!isRadio) nextBtn.click();
    });

    // Radio Channels
    let isRadio = false;
    document.querySelectorAll('.radio-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const url = e.target.dataset.url;
            isRadio = true;
            audio.src = url;
            audio.play();
            playPauseBtn.textContent = 'Pause';
            nowPlaying.textContent = `Radio: ${e.target.textContent}`;
        });
    });

    // Audio Recording
    const recordBtn = document.getElementById('record-btn');
    let mediaRecorder;
    let audioChunks = [];

    recordBtn.addEventListener('click', async () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            recordBtn.textContent = '● Rec';
            recordBtn.style.color = 'red';
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Add recording to playlist
                    playlist.push({ title: `Recording ${new Date().toLocaleTimeString()}`, src: audioUrl });
                    loadPlaylist();

                    // Reset chunks
                    audioChunks = [];
                    stream.getTracks().forEach(track => track.stop());
                };

                audioChunks = [];
                mediaRecorder.start();
                recordBtn.textContent = '■ Stop Rec';
                recordBtn.style.color = 'black';
            } catch (err) {
                console.error("Microphone access denied or error:", err);
                alert("Cannot access microphone for recording.");
            }
        }
    });

    loadPlaylist();
});
