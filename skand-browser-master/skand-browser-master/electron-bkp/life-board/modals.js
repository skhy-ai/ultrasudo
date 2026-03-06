// Modal helpers and related UI handlers (classic global scope)
// Depends on globals from state-data.js and functions like saveData(), renderAll(), renderTasks(), renderStats()

function openModal(id) {
  document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function setupIconSelector() {
  const container = document.getElementById("iconSelector");
  container.innerHTML = "";
  availableIcons.forEach(icon => {
    const el = document.createElement("div");
    el.className = "icon-option";
    el.textContent = icon;
    el.onclick = () => selectIcon(icon);
    container.appendChild(el);
  });
  selectIcon(availableIcons[0]);
}

function selectIcon(icon) {
  selectedIcon = icon;
  document.querySelectorAll(".icon-option").forEach(el => {
    el.classList.toggle("selected", el.textContent === icon);
  });
}

function openTaskModal() {
  editingTaskId = null;
  document.getElementById("taskName").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskDuration").value = "";
  document.getElementById("taskType").value = "normal";
  selectIcon(availableIcons[0]);
  document.getElementById("taskModalTitle").textContent = "Add New Task";
  document.getElementById("taskSubmitBtn").textContent = "Add Task";
  document.getElementById("taskSubmitBtn").onclick = createTask;
  toggleYogaOptions();
  openModal("taskModal");
}

function openEditTaskModal(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;
  editingTaskId = taskId;
  document.getElementById("taskName").value = t.name;
  document.getElementById("taskDescription").value = t.description;
  document.getElementById("taskType").value = t.type || "normal";
  if (t.type === "yoga") {
    document.getElementById("yogaReps").value = t.reps || 1;
    document.getElementById("taskDuration").value = "";
  } else {
    document.getElementById("taskDuration").value = t.duration || "";
    document.getElementById("yogaReps").value = 1;
  }
  selectIcon(t.icon);
  document.getElementById("taskModalTitle").textContent = "Edit Task";
  document.getElementById("taskSubmitBtn").textContent = "Update Task";
  document.getElementById("taskSubmitBtn").onclick = updateTask;
  toggleYogaOptions();
  openModal("taskModal");
}

function openEditRitualModal(ritualId) {
  const r = rituals.find(x => x.id === ritualId);
  if (!r) return;
  editingRitualId = ritualId;
  document.getElementById("editRitualName").value = r.name;
  document.getElementById("editRitualDescription").value = r.description;
  document.getElementById("editRitualImage").value = r.image || "";
  openModal("editRitualModal");
}

function openJournalModal(taskId) {
  editingTaskId = taskId;
  const dt = new Date(selectedDate + "T00:00:00");
  document.getElementById("journalDateDisplay").textContent = dt.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const existing = journalEntries[selectedDate]?.[taskId] || "";
  document.getElementById("journalEntry").value = existing;
  openModal("journalModal");
}

function saveJournalEntry() {
  const tId = editingTaskId;
  if (!tId) return;
  const text = document.getElementById("journalEntry").value.trim();
  journalEntries[selectedDate] = journalEntries[selectedDate] || {};
  journalEntries[selectedDate][tId] = text;
  completions[selectedDate] = completions[selectedDate] || {};
  completions[selectedDate][tId] = !!text;
  saveData();
  closeModal("journalModal");
  renderAll();
}

function toggleYogaOptions() {
  const type = document.getElementById("taskType").value;
  const yogaSec = document.getElementById("yoga-options");
  const durWrap = document.getElementById("taskDuration").parentElement;
  if (type === "yoga") {
    yogaSec.style.display = "block";
    durWrap.style.display = "none";
  } else {
    yogaSec.style.display = "none";
    durWrap.style.display = "block";
  }
}
