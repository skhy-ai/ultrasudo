// Timers and Activity (Yoga) + Speech/Narration + Background Music
// Depends on globals: tasks, timers, activityState, speech, sunSalutationSteps, backgroundMusic
// Uses: formatTime(), openModal(), closeModal(), toggleTask(), renderTasks()

function toggleTimer(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t || !t.duration) return;
  const existing = timers[taskId];
  const status = existing ? existing.status : "stopped";
  
  // Start/stop background music based on task type
  if (status === "stopped") {
    // Map task types to music categories
    const musicCategoryMap = {
      'yoga': 'yoga',
      'deep_work': 'deep_work',
      'meditation': 'meditation',
      'workout': 'workout'
    };
    
    const musicCategory = musicCategoryMap[t.type] || 'default';
    if (window.backgroundMusic && typeof window.backgroundMusic.playCategory === 'function') {
      try {
        window.backgroundMusic.playCategory(musicCategory);
      } catch (e) {
        console.warn('Failed to play background music:', e);
      }
    }
  } else if (status === "running") {
    // Pause music when pausing a timer
    if (window.backgroundMusic && typeof window.backgroundMusic.stop === 'function') {
      try {
        window.backgroundMusic.stop();
      } catch (e) {
        console.warn('Failed to stop background music:', e);
      }
    }
  }
  
  if (t.type === "yoga") {
    if (status === "stopped") startYogaSession(taskId);
  } else {
    handleGenericTimer(taskId, status);
  }
  renderTasks();
}

function handleGenericTimer(taskId, status) {
  const t = tasks.find(x => x.id === taskId);
  switch (status) {
    case "stopped":
      timers[taskId] = {
        remaining: 60 * t.duration,
        status: "running",
        interval: setInterval(() => updateTimer(taskId), 1000),
      };
      break;
    case "running":
      clearInterval(timers[taskId].interval);
      timers[taskId].status = "paused";
      break;
    case "paused":
      timers[taskId].status = "running";
      timers[taskId].interval = setInterval(() => updateTimer(taskId), 1000);
      break;
  }
}

function updateTimer(taskId) {
  if (!timers[taskId] || timers[taskId].status !== "running") return;
  timers[taskId].remaining--;
  const el = document.getElementById(`timer-${taskId}`);
  if (el) el.textContent = formatTime(timers[taskId].remaining);
  const t = tasks.find(x => x.id === taskId);
  if (timers[taskId].remaining <= 0) {
    clearInterval(timers[taskId].interval);
    delete timers[taskId];
    toggleTask(taskId);
    
    // Stop music when timer completes
    if (window.backgroundMusic && typeof window.backgroundMusic.stop === 'function') {
      try {
        window.backgroundMusic.stop();
      } catch (e) {
        console.warn('Failed to stop background music:', e);
      }
    }
    
    renderTasks();
  }
}

function startYogaSession(taskId) {
  const t = tasks.find(x => x.id === taskId);
  const reps = t.reps || 1;
  const total = 180 * reps; // 3 mins each rep (12 steps * 15s)
  activityState = {
    type: "yoga",
    taskId,
    status: "running",
    totalDuration: total,
    elapsed: 0,
    stepIndex: 0,
    stepElapsed: 0,
    stepDuration: 15,
    steps: sunSalutationSteps,
    totalReps: reps,
    currentRep: 1,
    interval: null,
    isNarrationOn: true,
  };
  document.getElementById("activityTaskName").textContent = `${t.name}`;
  document.getElementById("activityPauseResumeBtn").textContent = "Pause";
  const narrBtn = document.getElementById("narrationBtn");
  narrBtn.style.display = "inline-block";
  narrBtn.textContent = "Turn Off Narration";
  openModal("activityModal");
  runActivityInterval();
}

function runActivityInterval() {
  if (activityState.status !== "running") return;
  updateActivityDisplay();
  if (activityState.type === "yoga") {
    speak(`Let's begin Repetition ${activityState.currentRep}. The first pose is ${activityState.steps[activityState.stepIndex].name}. ${activityState.steps[activityState.stepIndex].instruction}`);
  }
  activityState.interval = setInterval(() => {
    activityState.elapsed++;
    activityState.stepElapsed++;
    if (activityState.stepElapsed >= activityState.stepDuration) {
      activityState.stepElapsed = 0;
      activityState.stepIndex++;
      if (activityState.stepIndex >= activityState.steps.length) {
        activityState.stepIndex = 0;
        activityState.currentRep++;
        if (activityState.currentRep > activityState.totalReps) {
          speak("Amazing session! You've completed all your sun salutations. Great work!");
          stopCurrentActivity(true);
          return;
        } else if (activityState.status === "running") {
          speak(`Great job! Starting repetition ${activityState.currentRep}.`);
        }
      }
      if (activityState.status === "running") {
        speak(`${activityState.steps[activityState.stepIndex].name}. ${activityState.steps[activityState.stepIndex].instruction}`);
      }
    }
    if (activityState.elapsed >= activityState.totalDuration) {
      stopCurrentActivity(true);
    } else {
      updateActivityDisplay();
    }
  }, 1000);
}

function updateActivityDisplay() {
  if (activityState.status === "stopped") return;
  const pct = (activityState.elapsed / activityState.totalDuration) * 100;
  document.getElementById("activityOverallProgress").style.width = `${pct}%`;
  if (activityState.type === "yoga") {
    const step = activityState.steps[activityState.stepIndex];
    if (!step) return;
    document.getElementById("activityTaskName").textContent = `${tasks.find(t => t.id === activityState.taskId).name}`;
    document.getElementById("activityRepCounter").textContent = `Repetition: ${activityState.currentRep} / ${activityState.totalReps}`;
    document.getElementById("activityStepName").textContent = `Step ${activityState.stepIndex + 1}: ${step.name}`;
    document.getElementById("activityStepInstruction").textContent = step.instruction;
    const img = document.getElementById("activityYogaImage");
    img.src = step.image;
    img.style.display = "block";
    document.getElementById("activity-yoga-image-container").style.display = "flex";
    const spct = (activityState.stepElapsed / activityState.stepDuration) * 100;
    document.getElementById("activityStepProgress").style.width = `${spct}%`;
    document.getElementById("activityStepTimer").textContent = formatTime(activityState.stepDuration - activityState.stepElapsed);
  } else {
    document.getElementById("activityStepTimer").textContent = formatTime(activityState.totalDuration - activityState.elapsed);
  }
}

function pauseResumeCurrentActivity() {
  const btn = document.getElementById("activityPauseResumeBtn");
  if (activityState.status === "running") {
    activityState.status = "paused";
    clearInterval(activityState.interval);
    btn.textContent = "Resume";
    speech.synth.cancel();
  } else if (activityState.status === "paused") {
    activityState.status = "running";
    btn.textContent = "Pause";
    runActivityInterval();
  }
}

function stopCurrentActivity(markComplete = false) {
  clearInterval(activityState.interval);
  speech.synth.cancel();
  const tid = activityState.taskId;
  activityState = { type: null, taskId: null, interval: null, status: "stopped", isNarrationOn: true };
  closeModal("activityModal");
  if (markComplete && tasks.find(t => t.id === tid)) toggleTask(tid);
}

function initSpeech() {
  if ("speechSynthesis" in window) {
    speech.synth = window.speechSynthesis;
    speech.synth.onvoiceschanged = loadVoices;
    loadVoices();
  } else {
    console.warn("Speech Synthesis not supported.");
  }
}

function loadVoices() {
  speech.voices = speech.synth.getVoices();
  const preferred = ["Google UK English Female", "Samantha", "Karen"];
  for (const name of preferred) {
    const v = speech.voices.find(v => v.name === name && v.lang.startsWith("en"));
    if (v) { speech.voice = v; return; }
  }
  speech.voice = (
    speech.voices.find(v => v.lang.startsWith("en") && v.name.includes("Female")) ||
    speech.voices.find(v => v.lang.startsWith("en")) ||
    speech.voices[0]
  );
}

function speak(text) {
  if (!speech.synth || !text || !activityState.isNarrationOn) return;
  speech.synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = speech.voice;
  u.rate = 0.9;
  u.pitch = 1.1;
  u.volume = 0.8;
  speech.synth.speak(u);
}

function toggleNarration() {
  activityState.isNarrationOn = !activityState.isNarrationOn;
  const btn = document.getElementById("narrationBtn");
  btn.textContent = activityState.isNarrationOn ? "Turn Off Narration" : "Turn On Narration";
  speak(activityState.isNarrationOn ? "Narration on." : "Narration off.");
}
