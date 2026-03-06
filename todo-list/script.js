const inputBox = document.getElementById("input-box");
const dueDateInput = document.getElementById("due-date");
const categoryBox = document.getElementById("category-box");
const listContainer = document.getElementById("list-container");

let tasks = [];

function addTask() {
    const taskText = inputBox.value.trim();
    if (taskText === '') {
        alert("You must write a task!");
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        dueDate: dueDateInput.value,
        category: categoryBox.value.trim(),
        checked: false
    };

    tasks.push(task);

    inputBox.value = "";
    dueDateInput.value = "";
    categoryBox.value = "";

    saveData();
    renderTasks();
}

listContainer.addEventListener("click", function (e) {
    const li = e.target.closest('li');
    if (!li) return;

    const taskId = Number(li.dataset.id);
    const task = tasks.find(t => t.id === taskId);

    if (e.target.tagName === "SPAN") {
        tasks = tasks.filter(t => t.id !== taskId);
    } else if (task) {
        task.checked = !task.checked;

        // Handle +3 points for completing on time
        let storedScore = localStorage.getItem("todo_gamification_score");
        let score = storedScore !== null ? parseInt(storedScore) : 0;

        const today = new Date().toISOString().split('T')[0];

        if (task.checked && !task.rewarded) {
            if (!task.dueDate || task.dueDate >= today) {
                score += 3;
                task.rewarded = true;
                localStorage.setItem("todo_gamification_score", score);
            }
        } else if (!task.checked && task.rewarded) {
            score -= 3;
            task.rewarded = false;
            localStorage.setItem("todo_gamification_score", score);
        }
    }

    saveData();
    renderTasks();
    processGamification(); // Refresh UI score
}, false);

function renderTasks() {
    listContainer.innerHTML = "";
    tasks.forEach(task => {
        let li = document.createElement("li");
        li.dataset.id = task.id;
        if (task.checked) {
            li.classList.add("checked");
        }

        let taskTextNode = document.createTextNode(task.text);
        li.appendChild(taskTextNode);

        let detailsText = [];
        if (task.category) {
            detailsText.push(`Category: ${task.category}`);
        }
        if (task.dueDate) {
            detailsText.push(`Due: ${task.dueDate}`);
        }

        if (detailsText.length > 0) {
            let detailsDiv = document.createElement('div');
            detailsDiv.className = 'details';
            detailsDiv.textContent = detailsText.join(' | ');
            li.appendChild(detailsDiv);
        }

        let span = document.createElement("span");
        span.innerHTML = "\u00d7";
        li.appendChild(span);

        listContainer.appendChild(li);
    });
}

function saveData() {
    if (window.setAppData) {
        window.setAppData('todo_tasks', tasks, 'todo-list');
    } else {
        localStorage.setItem("desktop_app_todo_tasks", JSON.stringify({ value: tasks }));
    }
}

function loadTasks() {
    if (window.getAppData) {
        tasks = window.getAppData('todo_tasks', []);
    } else {
        const data = localStorage.getItem("desktop_app_todo_tasks");
        if (data) {
            try { tasks = JSON.parse(data).value || []; } catch (e) { tasks = []; }
        }
    }
    processGamification();
    renderTasks();
}

function processGamification() {
    let storedScore = localStorage.getItem("todo_gamification_score");
    // Ensure base score starts at 0, not 100, so badges scale properly from day 1
    let score = storedScore !== null && !isNaN(parseInt(storedScore)) ? parseInt(storedScore) : 0;

    const today = new Date().toISOString().split('T')[0];
    let scoreChanged = false;
    let missedCount = 0;

    tasks.forEach(task => {
        if (!task.checked && !task.missed && task.dueDate && task.dueDate < today) {
            task.missed = true;
            score -= 1;
            scoreChanged = true;
            missedCount++;
        }
    });

    if (scoreChanged) {
        localStorage.setItem("todo_gamification_score", score);
        saveData();
        if (missedCount > 0) {
            // Optional: alert the user they lost points
            console.log(`You lost ${missedCount} points for missing past tasks!`);
        }
    }

    renderScore(score);
}

function getBadge(score) {
    if (score >= 200) return { name: "Director", icon: "fa-crown", color: "#f59e0b" };
    if (score >= 100) return { name: "Manager", icon: "fa-user-tie", color: "#6366f1" };
    if (score >= 50) return { name: "Taskmaster", icon: "fa-hammer", color: "#3b82f6" };
    return { name: "Beginner's Luck", icon: "fa-seedling", color: "#10b981" };
}

function renderScore(score) {
    let scoreDisplay = document.getElementById("score-display");
    if (!scoreDisplay) {
        scoreDisplay = document.createElement("div");
        scoreDisplay.id = "score-display";
        scoreDisplay.style.cssText = "position:absolute; top:80px; right:20px; background:rgba(30,41,59,0.8); color:#f8fafc; padding:10px 15px; border-radius:30px; font-weight:bold; display:flex; align-items:center; gap:8px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter:blur(5px); animation: popIn 0.5s ease-out;";
        document.body.appendChild(scoreDisplay);
    }
    const badge = getBadge(score);
    scoreDisplay.innerHTML = `<i class="fas fa-trophy" style="color:#f59e0b;"></i> Score: ${score} 
        <span style="margin-left:8px; padding:2px 10px; border-radius:12px; font-size:12px; background:rgba(255,255,255,0.1); color:${badge.color};">
            <i class="fas ${badge.icon}"></i> ${badge.name}
        </span>`;
}

// Listen for cross-device sync changes
window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'DATA_CHANGE' && e.data.key === 'todo_tasks') {
        tasks = e.data.value || [];
        processGamification();
        renderTasks();
    }
});

// Initial load
setTimeout(() => {
    loadTasks();
}, 600); // Give DataManager time to load and hydrate from cloud
