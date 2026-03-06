// Pomodoro Timer Implementation
let timer;
let timeLeft;
let isRunning = false;
let isWork = true;
let cycle = 0;
let workTime = 25 * 60; // 25 minutes
let breakTime = 5 * 60; // 5 minutes
let longBreakTime = 15 * 60; // 15 minutes
let cyclesBeforeLongBreak = 4;

const display = document.getElementById('display');
const status = document.getElementById('status');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const skipBtn = document.getElementById('skip');

function updateSettings() {
  workTime = parseInt(document.getElementById('work-time').value) * 60;
  breakTime = parseInt(document.getElementById('break-time').value) * 60;
  longBreakTime = parseInt(document.getElementById('long-break-time').value) * 60;
  cyclesBeforeLongBreak = parseInt(document.getElementById('cycles').value);

  if (window.setAppData) {
    window.setAppData('pomodoro_settings', {
      workTime: workTime / 60,
      breakTime: breakTime / 60,
      longBreakTime: longBreakTime / 60,
      cycles: cyclesBeforeLongBreak
    }, 'pomodoro-timer');
  }
}

function loadSettings() {
  if (window.getAppData) {
    const s = window.getAppData('pomodoro_settings');
    if (s) {
      document.getElementById('work-time').value = s.workTime || 25;
      document.getElementById('break-time').value = s.breakTime || 5;
      document.getElementById('long-break-time').value = s.longBreakTime || 15;
      document.getElementById('cycles').value = s.cycles || 4;
      updateSettings();
    }
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  display.textContent = formatTime(timeLeft);
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timer = setInterval(() => {
    timeLeft--;
    updateDisplay();
    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      if (isWork) {
        cycle++;
        if (cycle % cyclesBeforeLongBreak === 0) {
          timeLeft = longBreakTime;
          status.textContent = 'Long Break';
        } else {
          timeLeft = breakTime;
          status.textContent = 'Short Break';
        }
        isWork = false;

        // Track history
        if (window.setAppData) {
          let history = window.getAppData('pomodoro_history', 0);
          window.setAppData('pomodoro_history', history + 1, 'pomodoro-timer');
        }
      } else {
        timeLeft = workTime;
        status.textContent = 'Work Time';
        isWork = true;
      }
      updateDisplay();
      alert(`${status.textContent} started!`);
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timer);
  isRunning = false;
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  timeLeft = workTime;
  cycle = 0;
  isWork = true;
  status.textContent = 'Ready';
  updateDisplay();
}

function skipTimer() {
  clearInterval(timer);
  isRunning = false;
  if (isWork) {
    cycle++;
    if (cycle % cyclesBeforeLongBreak === 0) {
      timeLeft = longBreakTime;
      status.textContent = 'Long Break';
    } else {
      timeLeft = breakTime;
      status.textContent = 'Short Break';
    }
    isWork = false;
  } else {
    timeLeft = workTime;
    status.textContent = 'Work Time';
    isWork = true;
  }
  updateDisplay();
}

startBtn.addEventListener('click', () => {
  updateSettings();
  if (!isRunning) {
    startTimer();
    status.textContent = 'Running';
  }
});

pauseBtn.addEventListener('click', pauseTimer);

resetBtn.addEventListener('click', resetTimer);

skipBtn.addEventListener('click', skipTimer);

// Initialize
setTimeout(() => {
  loadSettings();
  updateDisplay();
}, 600);
