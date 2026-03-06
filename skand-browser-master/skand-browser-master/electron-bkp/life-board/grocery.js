// Grocery planning UI and save logic
// Depends on globals: glycemicFoods, completions, selectedDate, groceryPlanningTaskId
// Uses: isColorLight(), openModal(), closeModal(), saveData(), renderTasks(), renderStats()

function openGroceryModal(taskId) {
  groceryPlanningTaskId = taskId;
  const grid = document.getElementById("groceryGrid");
  grid.innerHTML = "";
  const selected = completions[selectedDate]?.[taskId] || [];
  glycemicFoods.forEach(food => {
    const isSelected = selected.includes(food.name);
    const card = document.createElement("div");
    card.className = `food-card ${isSelected ? "selected" : ""}`;
    if (isColorLight(food.color)) card.classList.add("text-dark");
    card.dataset.foodName = food.name;
    card.style.backgroundColor = food.color;
    card.innerHTML = `<div class="food-name">${food.name}</div><div class="food-info"><span class="gi-value">GI: ${food.gi}</span></div>`;
    card.onclick = () => card.classList.toggle("selected");
    grid.appendChild(card);
  });
  openModal("groceryModal");
}

function saveGroceryList() {
  if (!groceryPlanningTaskId) return;
  const selectedEls = document.querySelectorAll("#groceryGrid .food-card.selected");
  const items = Array.from(selectedEls).map(el => el.dataset.foodName);
  const d = selectedDate;
  if (!completions[d]) completions[d] = {};
  completions[d][groceryPlanningTaskId] = items;
  completions[d][groceryPlanningTaskId + "_completed"] = items.length > 0;
  saveData();
  closeModal("groceryModal");
  renderTasks();
  renderStats();
}

function updateLowGIMeals() {
  if (!groceryPlanningTaskId) return;
  
  // Get currently selected items before refreshing
  const selectedEls = document.querySelectorAll("#groceryGrid .food-card.selected");
  const selectedItems = new Set(Array.from(selectedEls).map(el => el.dataset.foodName));
  
  // Refresh the grid with updated glycemicFoods from state-data.js
  const grid = document.getElementById("groceryGrid");
  grid.innerHTML = "";
  
  glycemicFoods.forEach(food => {
    const isSelected = selectedItems.has(food.name);
    const card = document.createElement("div");
    card.className = `food-card ${isSelected ? "selected" : ""}`;
    if (isColorLight(food.color)) card.classList.add("text-dark");
    card.dataset.foodName = food.name;
    card.style.backgroundColor = food.color;
    card.innerHTML = `<div class="food-name">${food.name}</div><div class="food-info"><span class="gi-value">GI: ${food.gi}</span></div>`;
    card.onclick = () => card.classList.toggle("selected");
    grid.appendChild(card);
  });
  
  // Show a brief notification
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = "Low GI meals updated!";
  document.body.appendChild(notification);
  
  // Remove the notification after 2 seconds
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}
