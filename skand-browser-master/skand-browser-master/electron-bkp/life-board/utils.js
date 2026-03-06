// Shared utility functions (classic global scope)
// These were extracted from app-bootstrap.pretty.js

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function isColorLight(hex) {
  // hex like #RRGGBB
  const num = parseInt(hex.substring(1), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  // Perceived brightness
  return (r * 299 + g * 587 + b * 114) >= 128000;
}

function getMoonPhase(year, month, day) {
  const phases = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Last Quarter",
    "Waning Crescent",
  ];
  const emojis = [
    "🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"
  ];

  let y = year, m = month, d = day; // month is 0-indexed in Date; app passes calendar values
  if (m < 2) { y--; m += 12; } else { m++; }
  const yy = 365.25 * y;
  const mm = 30.6 * m;
  let i = yy + mm + d - 694039.09; // days since known new moon
  i /= 29.5305882; // normalize by synodic month
  const ii = parseInt(i);
  i -= ii;
  let phaseIndex = Math.round(8 * i);
  if (phaseIndex >= 8) phaseIndex = 0;
  return { phase: phases[phaseIndex], emoji: emojis[phaseIndex] };
}

function formatCountryName(code) {
  return code.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Basic persistence helpers moved out of app-bootstrap
function saveData() {
  try {
    const payload = {
      rituals,
      tasks,
      todos,
      completions,
      journalEntries,
      userCountry,
      userLocation,
    };
    localStorage.setItem("dle:data", JSON.stringify(payload));
  } catch (e) {
    console.warn("saveData failed", e);
  }
}

function exportData() {
  try {
    const payload = {
      rituals,
      tasks,
      todos,
      completions,
      journalEntries,
      userCountry,
      userLocation,
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(payload, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-life-tracker-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Export failed: ' + e.message);
  }
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate required fields
        if (!data.rituals || !Array.isArray(data.rituals)) {
          throw new Error('Invalid data: missing or invalid rituals');
        }
        if (!data.tasks || !Array.isArray(data.tasks)) {
          throw new Error('Invalid data: missing or invalid tasks');
        }
        
        // Confirm import
        const confirmMsg = `Import data from ${data.exportDate ? new Date(data.exportDate).toLocaleDateString() : 'unknown date'}?\n\nThis will replace all current data. Make sure to export your current data first if needed.`;
        if (!confirm(confirmMsg)) return;
        
        // Import data
        if (data.rituals) rituals = data.rituals;
        if (data.tasks) tasks = data.tasks;
        if (data.todos) todos = data.todos;
        if (data.completions) completions = data.completions;
        if (data.journalEntries) journalEntries = data.journalEntries;
        if (data.userCountry) userCountry = data.userCountry;
        if (data.userLocation) userLocation = data.userLocation;
        
        // Ensure current ritual is valid
        if (!currentRitualId && rituals.length > 0) currentRitualId = rituals[0].id;
        if (currentRitualId && !rituals.find(r => r.id === currentRitualId)) {
          currentRitualId = rituals.length > 0 ? rituals[0].id : null;
        }
        
        saveData();
        renderAll();
        alert('Data imported successfully!');
      } catch (e) {
        alert('Import failed: ' + e.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function loadData() {
  try {
    const raw = localStorage.getItem("dle:data");
    if (!raw) { loadDefaultData(); return; }
    const data = JSON.parse(raw);
    if (data.rituals) rituals = data.rituals;
    if (data.tasks) tasks = data.tasks;
    if (data.todos) todos = data.todos;
    if (data.completions) completions = data.completions;
    if (data.journalEntries) journalEntries = data.journalEntries;
    if (data.userCountry) userCountry = data.userCountry;
    if (data.userLocation) userLocation = data.userLocation;
    if (!rituals || rituals.length === 0) { loadDefaultData(); return; }
    if (!currentRitualId && rituals.length > 0) currentRitualId = rituals[0].id;
  } catch (e) {
    console.warn("loadData failed", e);
  }
}

// Seed a simple default dataset for first-time users
function loadDefaultData() {
  rituals = [
    {
      id: "ritual_morning",
      name: "Morning Energizer",
      description: "Start the day strong",
      image: "images/pexels-photo-1812964.jpeg",
    },
    {
      id: "ritual_work",
      name: "Productive Work Flow",
      description: "Maximize focus and productivity",
      image: "images/pexels-photo-3184418.jpeg",
    },
    {
      id: "ritual_evening",
      name: "Evening Wind-down",
      description: "Relax and prepare for sleep",
      image: "images/pexels-photo-3094215.jpeg",
    },
  ];

  tasks = [
    { id: "task_water", ritualId: "ritual_morning", name: "Drink Water", description: "Hydrate with a full glass", icon: "💧", type: "normal", duration: 2 },
    { id: "task_meditate", ritualId: "ritual_morning", name: "Meditate", description: "Calm start to the day", icon: "🧘‍♀️", type: "normal", duration: 10 },
    { id: "task_gratitude", ritualId: "ritual_morning", name: "Gratitude Journal", description: "3 things you're grateful for", icon: "📓", type: "journal" },
    { id: "task_deepwork", ritualId: "ritual_work", name: "Deep Work Session", description: "Focused 50-minute sprint", icon: "🔥", type: "deep_work", duration: 50 },
    { id: "task_walk", ritualId: "ritual_work", name: "Walk Break", description: "Quick reset", icon: "🚶‍♂️", type: "normal", duration: 10 },
    { id: "task_yoga", ritualId: "ritual_evening", name: "Sun Salutations", description: "Gentle yoga flow", icon: "🌞", type: "yoga", reps: 3, duration: 9 },
    { id: "task_plan_grocery", ritualId: "ritual_evening", name: "Grocery Planning", description: "Low GI picks", icon: "🛒", type: "planning" },
    { id: "task_buy_grocery", ritualId: "ritual_evening", name: "Grocery Shopping", description: "Order your planned groceries online", icon: "🛍️", type: "shopping" },
  ];

  todos = [];
  completions = {};
  journalEntries = {};
  currentRitualId = rituals[0].id;
  selectedDate = (new Date()).toISOString().split("T")[0];
  try { saveData(); } catch (_) {}
}
