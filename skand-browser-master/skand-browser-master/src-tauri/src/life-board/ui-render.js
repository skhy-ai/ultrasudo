// UI rendering functions extracted from app-bootstrap.pretty.js
// Classic scripts: rely on globals from state-data.js and helpers from utils.js

function renderAll() {
  renderRituals();
  renderTasks();
  renderStats();
}

function updateDateDisplay() {
  document.getElementById("currentDate").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

function renderRituals() {
  const container = document.getElementById("ritualsContainer");
  container.innerHTML = "";
  rituals.forEach(r => {
    const card = document.createElement("div");
    card.className = `ritual-card ${r.id === currentRitualId ? "active" : ""}`;
    card.style.backgroundImage = `url(${r.image || "https://placehold.co/600x400/a29bfe/ffffff?text=Ritual"})`;
    card.onclick = () => selectRitual(r.id);
    card.innerHTML = `
      <div class="ritual-actions">
        <button class="btn btn-small btn-action" onclick="event.stopPropagation(); openEditRitualModal('${r.id}')" title="Edit">✏️</button>
        <button class="btn btn-small btn-action btn-danger" onclick="event.stopPropagation(); deleteRitual('${r.id}')" title="Delete">🗑️</button>
      </div>
      <div class="ritual-card-content">
        <h3>${r.name}</h3>
        <p>${r.description}</p>
      </div>`;
    container.appendChild(card);
  });
  const add = document.createElement("div");
  add.className = "ritual-card add-ritual-card";
  add.innerHTML = "<span>+ Add Ritual</span>";
  add.onclick = () => openModal("ritualModal");
  container.appendChild(add);

  // Planned Groceries summary card (left section)
  try {
    const plannerTask = tasks.find(t => t.type === 'planning');
    const items = (plannerTask && (completions[selectedDate]?.[plannerTask.id] || [])) || [];
    const plannedCard = document.createElement('div');
    plannedCard.className = 'ritual-card clickable';
    plannedCard.style.backgroundImage = 'url(https://placehold.co/600x400/27ae60/ffffff?text=Groceries)';
    plannedCard.onclick = () => {
      const plannerTask = tasks.find(t => t.type === 'planning');
      if (plannerTask) {
        openGroceryModal(plannerTask.id);
      } else {
        console.warn('No grocery planning task found');
      }
    };
    const chips = items.slice(0, 12).map(n => `<span class="planned-chip">${n}</span>`).join(" ");
    plannedCard.innerHTML = `
      <div class="ritual-card-content">
        <h3>Planned Groceries (${items.length})</h3>
        <p>${items.length ? chips : 'Tap to plan your grocery list'}</p>
      </div>`;
    container.appendChild(plannedCard);
  } catch (_) { }
}

function renderTasks() {
  const grid = document.getElementById("taskGrid");
  grid.innerHTML = "";
  if (!currentRitualId) {
    grid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">Select a ritual to view tasks</p>';
    document.getElementById("addTaskBtn").style.display = "none";
    document.getElementById("currentRitualTitle").textContent = "Select a Ritual";
    return;
  }
  const ritual = rituals.find(r => r.id === currentRitualId);
  if (!ritual) {
    currentRitualId = rituals.length > 0 ? rituals[0].id : null;
    saveData();
    renderTasks();
    return;
  }
  document.getElementById("currentRitualTitle").textContent = ritual.name;
  document.getElementById("addTaskBtn").style.display = "inline-block";

  // Filter out grocery planning tasks since they're now handled by the card
  const ritualTasks = tasks.filter(t => t.ritualId === currentRitualId && t.type !== 'planning');
  if (ritualTasks.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No tasks yet. Add your first task!</p>';
    return;
  }

  const dateKey = selectedDate;
  ritualTasks.forEach(t => {
    let isDone;
    if (t.type === 'planning') {
      const items = completions[dateKey]?.[t.id] || [];
      const flag = completions[dateKey]?.[t.id + '_completed'] === true;
      isDone = flag || (Array.isArray(items) && items.length > 0);
    } else {
      isDone = (completions[dateKey]?.[t.id] === true);
    }
    const card = document.createElement("div");
    card.className = `task-card ${isDone ? "completed" : ""}`;
    card.setAttribute("draggable", true);
    card.setAttribute("data-task-id", t.id);

    let actionButtons = "";
    let extraHtml = "";

    if (t.type === "journal") {
      actionButtons += `<button class="btn btn-small" onclick="openJournalModal('${t.id}')">Write/View Entry</button>`;
    } else if (t.type === "planning") {
      const planned = completions[dateKey]?.[t.id] || [];
      actionButtons += `<button class="btn btn-small" onclick="openGroceryModal('${t.id}')">Plan List (${planned.length})</button>`;
    } else if (t.type === "shopping") {
      const country = userCountry;
      const svc = deliveryServices[country];
      const planner = tasks.find(x => x.ritualId === t.ritualId && x.type === "planning");
      const plannerId = planner ? planner.id : null;
      const inputId = `grocery-extra-term-${t.id}`;
      if (svc) {
        const buttons = svc.map((s, idx) => {
          return `<button class="btn btn-small" onclick="openDeliverySearch('${country}', ${idx}, '${plannerId || ''}', '${inputId}')">${s.name}</button>`;
        }).join("");
        const planned = (plannerId && (completions[dateKey]?.[plannerId] || [])) || [];
        const chips = planned.map(n => `<span class="planned-chip">${n}</span>`).join(" ");
        extraHtml += `
          <div class="delivery-services">
            <h4>Delivery in ${formatCountryName(country)}</h4>
            <input id="${inputId}" class="form-group" type="text" placeholder="Add search term (e.g., brand, size)" style="width:100%;margin:6px 0;">
            ${planned.length ? `<div class="planned-chips">${chips}</div>` : ''}
            <div class="delivery-logos">${buttons}</div>
          </div>`;
      }
    } // Removed focus music button for deep work tasks - music plays automatically

    if (t.type === "yoga" || t.type === "deep_work" || (t.duration && t.type !== "yoga")) {
      const timer = timers[t.id];
      const status = timer ? timer.status : "stopped";
      let label = (t.type === "yoga") ? "Start Yoga" : "Start Timer";
      if (status === "running") label = "Pause"; else if (status === "paused") label = "Resume";
      actionButtons += `<button class="btn btn-small btn-timer ${status === "running" ? "active" : ""}" onclick="toggleTimer('${t.id}')">${label}</button>`;
    }

    if (t.integration?.type === "google-maps" && t.integration.label && t.integration.query) {
      const label = t.integration.label.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
      const query = t.integration.query.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
      actionButtons += `<button class="btn btn-small btn-info" data-map-label="${label}" data-map-query="${query}" onclick="openMapModal(this.dataset.mapLabel, this.dataset.mapQuery)" title="Find Location">📍</button>`;
    }

    card.innerHTML = `
      <div class="task-card-content">
        <div class="task-header">
          <div class="task-icon">${t.icon}</div>
          <div class="task-info">
            <h3>${t.name}</h3>
            <p>${t.description}</p>
            ${t.duration && t.type !== "yoga" ? `<div class="task-duration">⏱️ ${t.duration} min</div>` : ""}
            ${t.reps && t.type === "yoga" ? `<div class="task-duration">🔄 ${t.reps} reps</div>` : ""}
            ${timers[t.id] ? `<div class="timer-display" id="timer-${t.id}">${formatTime(timers[t.id].remaining)}</div>` : ""}
          </div>
        </div>
        ${extraHtml}
      </div>
      <div>
        <div class="checkbox-container" ${t.type === 'planning' ? '' : `onclick="toggleTask('${t.id}')"`} style="${t.type === "planning" ? "cursor:default" : ""}">
          <div class="custom-checkbox ${isDone ? "checked" : ""}">${isDone ? "✓" : ""}</div>
          <span>${t.type === 'planning' ? (isDone ? 'Items planned' : 'Plan items to complete') : `Mark as ${isDone ? 'incomplete' : 'complete'}`}</span>
        </div>
        <div class="task-actions">
          ${actionButtons}
          <button class="btn btn-small" onclick="openEditTaskModal('${t.id}')" title="Edit">✏️</button>
          <button class="btn btn-small btn-danger" onclick="deleteTask('${t.id}')" title="Delete">🗑️</button>
        </div>
      </div>`;

    grid.appendChild(card);
  });
}

function renderStats() {
  const grid = document.getElementById("statsGrid");
  const day = completions[selectedDate] || {};
  const relevant = tasks.filter(t => t.ritualId === currentRitualId && t.type !== "planning");
  const total = relevant.length;
  const done = relevant.filter(t => day[t.id] === true).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  grid.innerHTML = `
    <div class="stat-card"><div class="stat-number">${done}/${total}</div><div class="stat-label">Tasks Done</div></div>
    <div class="stat-card"><div class="stat-number">${pct}%</div><div class="stat-label">Success Rate</div></div>`;
}

