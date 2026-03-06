// Task & Ritual CRUD, selection, calendar navigation, todos, and DnD
// Depends on globals from state-data.js and functions saveData(), renderAll()/render*()

function selectRitual(id) {
  currentRitualId = id;
  saveData();
  renderAll();
}

function selectDate(dateIso) {
  selectedDate = dateIso;
  saveData();
  renderAll();
  fetchAndDisplayPanchang();
}

function changeMonth(delta) {
  currentViewDate.setMonth(currentViewDate.getMonth() + delta);
  renderCalendar();
}

function createOrUpdateTask(isUpdate) {
  const name = document.getElementById("taskName").value.trim();
  if (!name) return;
  const type = document.getElementById("taskType").value;
  const payload = {
    ritualId: currentRitualId,
    name,
    description: document.getElementById("taskDescription").value.trim(),
    icon: selectedIcon,
    type,
    reps: null,
    duration: null,
  };
  if (type === "yoga") {
    const reps = parseInt(document.getElementById("yogaReps").value) || 1;
    payload.reps = reps;
    payload.duration = 3 * reps;
  } else {
    const durStr = document.getElementById("taskDuration").value;
    payload.duration = durStr ? parseInt(durStr) : null;
  }

  if (isUpdate) {
    const idx = tasks.findIndex(t => t.id === editingTaskId);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...payload };
    }
  } else {
    payload.id = Date.now().toString();
    const same = tasks.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (same?.integration) payload.integration = same.integration;
    tasks.push(payload);
  }
  saveData();
  renderTasks();
  renderStats();
  closeModal("taskModal");
}

function createTask() { createOrUpdateTask(false); }
function updateTask() { createOrUpdateTask(true); }

function createRitual() {
  const name = document.getElementById("ritualName").value.trim();
  if (!name) return;
  const r = { id: Date.now().toString(), name, description: document.getElementById("ritualDescription").value.trim(), image: document.getElementById("ritualImage").value.trim() };
  rituals.push(r);
  saveData();
  renderRituals();
  closeModal("ritualModal");
}

function updateRitual() {
  const name = document.getElementById("editRitualName").value.trim();
  if (!name || !editingRitualId) return;
  const idx = rituals.findIndex(r => r.id === editingRitualId);
  if (idx !== -1) {
    rituals[idx] = {
      ...rituals[idx],
      name,
      description: document.getElementById("editRitualDescription").value.trim(),
      image: document.getElementById("editRitualImage").value.trim(),
    };
    saveData();
    renderAll();
    closeModal("editRitualModal");
  }
}

function deleteRitual(id) {
  rituals = rituals.filter(r => r.id !== id);
  tasks = tasks.filter(t => t.ritualId !== id);
  if (currentRitualId === id) currentRitualId = rituals.length > 0 ? rituals[0].id : null;
  saveData();
  renderAll();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveData();
  renderTasks();
  renderStats();
}

function toggleTask(taskId) {
  if (!completions[selectedDate]) completions[selectedDate] = {};
  const t = tasks.find(x => x.id === taskId);
  if (t && t.type === "journal") { 
    openJournalModal(taskId); 
    return; 
  }
  completions[selectedDate][taskId] = !completions[selectedDate][taskId];
  saveData();
  renderTasks();
  renderStats();
  renderCalendar();
}

function addTodo(ev) {
  ev.preventDefault();
  const input = document.getElementById("newTodoInput");
  const txt = input.value.trim();
  if (!txt) return;
  const todo = { id: Date.now(), text: txt, completed: false };
  todos.push(todo);
  input.value = "";
  saveData();
  renderTodos();
}

function toggleTodo(id) {
  const t = todos.find(x => x.id === id);
  if (t) {
    t.completed = !t.completed;
    saveData();
    renderTodos();
  }
}

function setupDragAndDrop() {
  const grid = document.getElementById("taskGrid");
  let dragEl = null;
  grid.addEventListener("dragstart", e => {
    if (e.target.classList.contains("task-card")) {
      dragEl = e.target;
      setTimeout(() => { e.target.classList.add("dragging"); }, 0);
    }
  });
  grid.addEventListener("dragend", () => { if (dragEl) dragEl.classList.remove("dragging"); dragEl = null; });
  grid.addEventListener("dragover", e => {
    e.preventDefault();
    const after = getDragAfterElement(grid, e.clientY);
    const cur = document.querySelector(".dragging");
    if (!cur) return;
    if (after == null) grid.appendChild(cur); else grid.insertBefore(cur, after);
  });
  grid.addEventListener("drop", e => {
    e.preventDefault();
    if (!dragEl) return;
    const orderedIds = [...document.querySelectorAll(".task-card")].map(el => el.dataset.taskId);
    const cur = tasks.filter(t => t.ritualId === currentRitualId && t.type !== 'planning');
    const other = tasks.filter(t => t.ritualId !== currentRitualId);
    const reordered = orderedIds.map(id => cur.find(t => t.id === id)).filter(Boolean);
    tasks = [...other, ...reordered];
    saveData();
    renderTasks();
  });
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('.task-card:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
