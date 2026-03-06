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
    }

    saveData();
    renderTasks();
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
    renderTasks();
}

// Listen for cross-device sync changes
window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'DATA_CHANGE' && e.data.key === 'todo_tasks') {
        tasks = e.data.value || [];
        renderTasks();
    }
});

// Initial load
setTimeout(() => {
    loadTasks();
}, 600); // Give DataManager time to load and hydrate from cloud
