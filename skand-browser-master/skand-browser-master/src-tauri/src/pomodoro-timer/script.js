// Pomodoro Timer - Modern Logic
let timer;
let timeLeft;
let totalTime;
let isRunning = false;
let isWork = true;
let cycle = 1;

// Configuration
let config = {
  workTime: 25 * 60,
  breakTime: 5 * 60,
  longBreakTime: 15 * 60,
  cyclesBeforeLongBreak: 4
};

// Elements
const display = document.getElementById('display');
const statusDisplay = document.getElementById('status');
const progressCircle = document.getElementById('progress');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const skipBtn = document.getElementById('skip');

const inputs = {
  work: document.getElementById('work-time'),
  break: document.getElementById('break-time'),
  longBreak: document.getElementById('long-break-time'),
  cycles: document.getElementById('cycles')
};

// Constants
const CIRCUMFERENCE = 2 * Math.PI * 45; // r=45

function init() {
  loadSettings();
  resetTimer();
  updateUI();
  setupListeners();
}

function setupListeners() {
  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);
  skipBtn.addEventListener('click', skipTimer);

  Object.values(inputs).forEach(input => {
    input.addEventListener('change', () => {
      saveSettings();
      if (!isRunning) resetTimer();
    });
  });
}

function loadSettings() {
  if (window.getAppData) {
    const saved = window.getAppData('pomodoro_settings');
    if (saved) {
      inputs.work.value = saved.workTime || 25;
      inputs.break.value = saved.breakTime || 5;
      inputs.longBreak.value = saved.longBreakTime || 15;
      inputs.cycles.value = saved.cycles || 4;
    }
  }
}

function saveSettings() {
  config.workTime = parseInt(inputs.work.value) * 60;
  config.breakTime = parseInt(inputs.break.value) * 60;
  config.longBreakTime = parseInt(inputs.longBreak.value) * 60;
  config.cyclesBeforeLongBreak = parseInt(inputs.cycles.value);

  if (window.setAppData) {
    window.setAppData('pomodoro_settings', {
      workTime: inputs.work.value,
      breakTime: inputs.break.value,
      longBreakTime: inputs.longBreak.value,
      cycles: inputs.cycles.value
    }, 'pomodoro-timer');
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateUI() {
  display.textContent = formatTime(timeLeft);

  // Update Progress Circle
  const offset = CIRCUMFERENCE - (timeLeft / totalTime) * CIRCUMFERENCE;
  progressCircle.style.strokeDashoffset = offset;

  // Update Buttons
  startBtn.disabled = isRunning;
  pauseBtn.disabled = !isRunning;

  // Update Colors & Status
  const root = document.documentElement;
  if (isWork) {
    root.style.setProperty('--brand-color', 'var(--work-color)');
    statusDisplay.textContent = `Focus Session ${cycle}`;
  } else if (cycle % config.cyclesBeforeLongBreak === 0) {
    root.style.setProperty('--brand-color', 'var(--long-break-color)');
    statusDisplay.textContent = 'Long Break';
  } else {
    root.style.setProperty('--brand-color', 'var(--break-color)');
    statusDisplay.textContent = 'Short Break';
  }
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  saveSettings();

  timer = setInterval(() => {
    timeLeft--;
    updateUI();

    if (timeLeft <= 0) {
      handlePhaseEnd();
    }
  }, 1000);

  updateUI();
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  updateUI();
}

function resetTimer() {
  pauseTimer();
  isWork = true;
  cycle = 1;
  saveSettings();
  timeLeft = config.workTime;
  totalTime = config.workTime;
  updateUI();
}

function skipTimer() {
  handlePhaseEnd();
}

function handlePhaseEnd() {
  pauseTimer();
  playNotification();

  if (isWork) {
    if (cycle % config.cyclesBeforeLongBreak === 0) {
      timeLeft = config.longBreakTime;
      totalTime = config.longBreakTime;
    } else {
      timeLeft = config.breakTime;
      totalTime = config.breakTime;
    }
    isWork = false;
  } else {
    if (cycle % config.cyclesBeforeLongBreak === 0) cycle = 1;
    else cycle++;

    timeLeft = config.workTime;
    totalTime = config.workTime;
    isWork = true;
  }

  updateUI();
}

function playNotification() {
  // Try audio element first
  const audio = document.getElementById('notification-sound');
  if (audio && audio.play) {
    audio.play().catch(() => beep());
  } else {
    beep();
  }
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
    osc.start();
    osc.stop(ctx.currentTime + 1);
  } catch (e) {
    console.warn("Audio Context beep failed", e);
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', init);
setTimeout(init, 500); // Fallback for delayed DataManager
