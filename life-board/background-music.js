// Background Music Manager
class BackgroundMusic {
  constructor() {
    this.audio = new Audio();
    this.currentPlaylist = [];
    this.currentTrackIndex = -1;
    this.isPlaying = false;
    this.volume = 0.5; // Default volume (0-1)
    this.audio.volume = this.volume;
    this.setupEventListeners();
  }

  // Music categories and their corresponding folders
  categories = {
    'workout': '../music/Energizing/',
    'deep_work': '../music/Deep focus/',
    'yoga': '../music/Yoga/',
    'meditation': '../music/Meditation/',
    'default': '../music/Deep focus/'
  };

  // Map task types to music categories
  taskTypeToCategory = {
    'yoga': 'yoga',
    'deep_work': 'deep_work',
    'meditation': 'meditation',
    'workout': 'workout'
  };

  // Get a random track from the specified category
  async getRandomTrack(category) {
    const folder = this.categories[category] || this.categories['default'];
    try {
      // Get the list of files from the music directory
      const musicFiles = await this.getMusicFiles(category);
      
      if (musicFiles.length === 0) {
        console.warn(`No music files found in ${folder}`);
        return null;
      }
      
      const randomIndex = Math.floor(Math.random() * musicFiles.length);
      const trackPath = folder + musicFiles[randomIndex];
      this.currentTrackName = musicFiles[randomIndex].replace(/\.mp3$/, '').replace(/[-_]/g, ' ');
      
      // Update the UI with the current track name
      if (window.updateNowPlaying) {
        window.updateNowPlaying(this.currentTrackName);
      }
      
      return trackPath;
    } catch (error) {
      console.error('Error getting music tracks:', error);
      return null;
    }
  }
  
  // Get music files for a category
  async getMusicFiles(category) {
    // In a real implementation, you would fetch this from the server
    // For now, we'll return a list of available files based on the category
    const musicFiles = {
      'yoga': [
        'summer-rain-melody-background-for-meditation-and-yoga-20-minutes-314439.mp3',
        'sunrise-meditation-369921.mp3'
      ],
      'deep_work': [
        'endless-by-prabajithk-118998.mp3',
        'lofi-lofi-background-music-381780.mp3',
        'morning-in-the-forest-347089.mp3'
      ],
      'meditation': [
        'deep-meditation-infinite-breaths-298843.mp3',
        'pure-theta-4-7hz-with-deep-focus-soundscapes-351362.mp3',
        'simply-meditation-series-11hz-alpha-binaural-waves-for-relaxed-focus-8028.mp3'
      ],
      'workout': [
        'creative-technology-showreel-241274.mp3',
        'war-military-army-background-music-382052.mp3'
      ]
    };
    
    return musicFiles[category] || [];
  }

  // Play music for a specific task type
  async playForTaskType(taskType) {
    const category = this.taskTypeToCategory[taskType] || 'default';
    await this.playCategory(category);
  }

  // Play a specific category of music
  async playCategory(category) {
    this.currentPlaylist = [];
    this.currentTrackIndex = -1;
    this.category = category;
    this.currentTrackName = '';
    await this.playNextTrack();
  }

  // Play the next track in the playlist
  async playNextTrack() {
    try {
      const track = await this.getRandomTrack(this.category);
      if (!track) return;
      
      this.audio.pause();
      this.audio = new Audio(track);
      this.audio.volume = this.volume;
      this.audio.play().catch(e => console.error('Error playing audio:', e));
      this.isPlaying = true;
      
      // When the track ends, play the next one
      this.audio.onended = () => this.playNextTrack();
      
    } catch (error) {
      console.error('Error playing next track:', error);
    }
  }

  // Stop the music
  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
  }

  // Toggle play/pause
  togglePlay() {
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play().catch(e => console.error('Error playing audio:', e));
    }
    this.isPlaying = !this.isPlaying;
  }

  // Set volume (0-1)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.volume;
  }

  // Setup event listeners
  setupEventListeners() {
    // Handle audio errors
    this.audio.onerror = (e) => {
      console.error('Audio error:', e);
      this.playNextTrack(); // Try playing next track on error
    };
  }
}

// Create a singleton instance
const backgroundMusic = new BackgroundMusic();

// Export the instance
window.backgroundMusic = backgroundMusic;

// Auto-play unlock helper (simple placeholder – no WebAudio context used)
document.addEventListener('click', function initAudio() {
  // User interaction unlocks audio playback in some browsers
  try { backgroundMusic.audio.play().catch(() => {}); } catch (_) {}
  document.removeEventListener('click', initAudio);
}, { once: true });
