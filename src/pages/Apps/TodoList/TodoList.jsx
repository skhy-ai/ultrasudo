import React, { useState, useEffect } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import { useAppAgent } from '../../../hooks/useAppAgent';
import './TodoList.css';

export default function TodoList({ embedded = false }) {
    const [tasks, setTasks] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [category, setCategory] = useState('');
    const [score, setScore] = useState(0);

    useAppAgent({
        appId: 'todo-list',
        appName: 'To-Do List',
        getContext: () => ({
            tasksCount: tasks.length,
            completedCount: tasks.filter(t => t.checked).length,
            gamificationScore: score,
            currentTasks: tasks.map(t => ({ id: t.id, text: t.text, checked: t.checked, dueDate: t.dueDate, category: t.category }))
        }),
        suggestedPrompts: [
            'Prioritize my pending tasks',
            'Break down launch tasks into 3 checklist items',
            'Clear all completed tasks'
        ],
        actions: [
            {
                name: 'add_task',
                description: 'Add a new task to the todo list',
                parameters: {
                    taskText: { type: 'string', description: 'The task title or description' },
                    dueDate: { type: 'string', description: 'Optional due date in YYYY-MM-DD' },
                    category: { type: 'string', description: 'Optional category tag' }
                },
                handler: ({ taskText, dueDate = '', category = '' }) => {
                    if (!taskText) throw new Error('Task text is required');
                    const newTask = {
                        id: Date.now(),
                        text: taskText,
                        dueDate,
                        category: category.trim(),
                        checked: false
                    };
                    setTasks(prev => {
                        const updated = [...prev, newTask];
                        localStorage.setItem("desktop_app_todo_tasks", JSON.stringify({ value: updated }));
                        return updated;
                    });
                    return { success: true, task: newTask };
                }
            },
            {
                name: 'toggle_task',
                description: 'Mark a task as completed or incomplete',
                parameters: {
                    taskId: { type: 'number', description: 'ID of the task to toggle' }
                },
                handler: ({ taskId }) => {
                    toggleTask(Number(taskId));
                    return { success: true };
                }
            },
            {
                name: 'clear_completed',
                description: 'Clear all finished/completed tasks',
                parameters: {},
                isDestructive: true,
                handler: () => {
                    setTasks(prev => {
                        const remaining = prev.filter(t => !t.checked);
                        localStorage.setItem("desktop_app_todo_tasks", JSON.stringify({ value: remaining }));
                        return remaining;
                    });
                    return { success: true };
                }
            }
        ]
    });

    // Load initial data
    useEffect(() => {
        const storedScore = localStorage.getItem("todo_gamification_score");
        setScore(storedScore ? parseInt(storedScore) : 0);

        const data = localStorage.getItem("desktop_app_todo_tasks");
        if (data) {
            try { 
                const loadedTasks = JSON.parse(data).value || []; 
                setTasks(loadedTasks);
                processGamification(loadedTasks, storedScore ? parseInt(storedScore) : 0);
            } catch (e) { console.error(e); }
        }
    }, []);

    const processGamification = (currentTasks, currentScore) => {
        const today = new Date().toISOString().split('T')[0];
        let scoreChanged = false;
        let newScore = currentScore;
        const updatedTasks = currentTasks.map(task => {
            if (!task.checked && !task.missed && task.dueDate && task.dueDate < today) {
                newScore -= 1;
                scoreChanged = true;
                return { ...task, missed: true };
            }
            return task;
        });

        if (scoreChanged) {
            setScore(newScore);
            localStorage.setItem("todo_gamification_score", newScore);
            setTasks(updatedTasks);
            localStorage.setItem("desktop_app_todo_tasks", JSON.stringify({ value: updatedTasks }));
        }
    };

    const saveData = (newTasks) => {
        setTasks(newTasks);
        localStorage.setItem("desktop_app_todo_tasks", JSON.stringify({ value: newTasks }));
    };

    const addTask = () => {
        const taskText = inputValue.trim();
        if (taskText === '') {
            alert("You must write a task!");
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            dueDate: dueDate,
            category: category.trim(),
            checked: false
        };

        const newTasks = [...tasks, newTask];
        saveData(newTasks);
        setInputValue('');
        setDueDate('');
        setCategory('');
    };

    const toggleTask = (taskId) => {
        let newScore = score;
        const today = new Date().toISOString().split('T')[0];

        const newTasks = tasks.map(task => {
            if (task.id === taskId) {
                const checked = !task.checked;
                let rewarded = task.rewarded;
                
                if (checked && !rewarded) {
                    if (!task.dueDate || task.dueDate >= today) {
                        newScore += 3;
                        rewarded = true;
                    }
                } else if (!checked && rewarded) {
                    newScore -= 3;
                    rewarded = false;
                }
                return { ...task, checked, rewarded };
            }
            return task;
        });

        if (newScore !== score) {
            setScore(newScore);
            localStorage.setItem("todo_gamification_score", newScore);
        }
        saveData(newTasks);
    };

    const deleteTask = (e, taskId) => {
        e.stopPropagation();
        const newTasks = tasks.filter(t => t.id !== taskId);
        saveData(newTasks);
    };

    const getBadge = (s) => {
        if (s >= 200) return { name: "Director", icon: "fa-crown", color: "#f59e0b" };
        if (s >= 100) return { name: "Manager", icon: "fa-user-tie", color: "#6366f1" };
        if (s >= 50) return { name: "Taskmaster", icon: "fa-hammer", color: "#3b82f6" };
        return { name: "Beginner's Luck", icon: "fa-seedling", color: "#10b981" };
    };

    const badge = getBadge(score);

    const content = (
        <div className="todo-app-wrapper">
            <div className="score-display">
                <i className="fas fa-trophy" style={{color:'#f59e0b'}}></i> Score: {score}
                <span className="badge-span" style={{color: badge.color}}>
                    <i className={`fas ${badge.icon}`}></i> {badge.name}
                </span>
            </div>
            
            <div className="container">
                <div className="todo-app">
                    <h2>To-Do List <i className="fas fa-list-check"></i></h2>
                    <div className="row">
                        <input type="text" id="input-box" placeholder="Add your task" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') addTask() }} />
                        <input type="date" id="due-date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        <select id="category-box" value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="" disabled>Select Category</option>
                            <option value="Email">Email</option>
                            <option value="Grocery Shopping">Grocery Shopping</option>
                            <option value="Exercise">Exercise</option>
                            <option value="Office">Office</option>
                            <option value="Meetings">Meetings</option>
                            <option value="Calls">Calls</option>
                            <option value="Personal">Personal</option>
                        </select>
                        <button onClick={addTask}>Add</button>
                    </div>
                    <ul id="list-container">
                        {tasks.map(task => (
                            <li key={task.id} className={task.checked ? 'checked' : ''} onClick={() => toggleTask(task.id)}>
                                {task.text}
                                {(task.category || task.dueDate) && (
                                    <div className="details">
                                        {[task.category ? `Category: ${task.category}` : null, task.dueDate ? `Due: ${task.dueDate}` : null].filter(Boolean).join(' | ')}
                                    </div>
                                )}
                                <span onClick={(e) => deleteTask(e, task.id)}>×</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );

    if (embedded) return content;

    return (
        <AppShell title="To-Do List" icon="fas fa-list-check">
            {content}
        </AppShell>
    );
}
