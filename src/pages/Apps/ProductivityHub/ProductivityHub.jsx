import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../../components/shared/AppShell/AppShell';
import useAudioBeep from '../../../hooks/useAudioBeep';
import TodoList from '../TodoList/TodoList';
import KanbanBoard from '../KanbanBoard/KanbanBoard';
import Pomodoro from '../Pomodoro/Pomodoro';
import './ProductivityHub.css';

const DEFAULT_POMODORO = {
    workTime: 25 * 60,
    breakTime: 5 * 60,
    longBreakTime: 15 * 60,
    cyclesBeforeLongBreak: 4
};

const INITIAL_TASKS = [
    { id: 1, text: 'Finalize Q3 Financial Report', category: 'Office', dueDate: '2026-08-30', checked: false, kanbanStatus: 'In Progress' },
    { id: 2, text: 'Refactor Navigation Bar in React', category: 'Code', dueDate: '2026-08-29', checked: false, kanbanStatus: 'Backlog' },
    { id: 3, text: 'Weekly Grocery Shopping', category: 'Personal', dueDate: '2026-08-31', checked: true, kanbanStatus: 'Done' },
    { id: 4, text: 'Yoga Session & Stretches', category: 'Health', dueDate: '', checked: false, kanbanStatus: 'Review' },
];

export default function ProductivityHub() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'timers';

    const setTab = (tab) => {
        setSearchParams({ tab });
    };

    const { beep } = useAudioBeep();

    // ── Task Store & Gamification ──
    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('desktop_app_todo_tasks');
        if (saved) {
            try { return JSON.parse(saved).value || INITIAL_TASKS; } catch { return INITIAL_TASKS; }
        }
        return INITIAL_TASKS;
    });

    const [score, setScore] = useState(() => {
        const saved = localStorage.getItem('todo_gamification_score');
        return saved ? parseInt(saved, 10) : 45;
    });

    // ── Timer State ──
    const [pomoConfig, setPomoConfig] = useState(DEFAULT_POMODORO);
    const [timeLeft, setTimeLeft] = useState(DEFAULT_POMODORO.workTime);
    const [totalTime, setTotalTime] = useState(DEFAULT_POMODORO.workTime);
    const [isRunning, setIsRunning] = useState(false);
    const [isWork, setIsWork] = useState(true);
    const [cycle, setCycle] = useState(1);
    const [activeTaskId, setActiveTaskId] = useState(null);

    const timerRef = useRef(null);

    // Save tasks and score to localStorage
    useEffect(() => {
        localStorage.setItem('desktop_app_todo_tasks', JSON.stringify({ value: tasks }));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('todo_gamification_score', score.toString());
    }, [score]);

    // Timer phase end handler
    const handlePhaseEnd = useCallback(() => {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        
        try { beep(880, 1); } catch (e) { console.log('Audio alert', e); }

        if (isWork) {
            // Reward bonus points for completing a Pomodoro focus session!
            setScore(prev => prev + 5);
            const isLongBreak = cycle % pomoConfig.cyclesBeforeLongBreak === 0;
            const nextTime = isLongBreak ? pomoConfig.longBreakTime : pomoConfig.breakTime;
            setTimeLeft(nextTime);
            setTotalTime(nextTime);
            setIsWork(false);
        } else {
            const nextCycle = (cycle % pomoConfig.cyclesBeforeLongBreak === 0) ? 1 : cycle + 1;
            setCycle(nextCycle);
            setTimeLeft(pomoConfig.workTime);
            setTotalTime(pomoConfig.workTime);
            setIsWork(true);
        }
    }, [isWork, cycle, pomoConfig, beep]);

    // Timer interval loop
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handlePhaseEnd();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, handlePhaseEnd]);

    // Controls
    const startTimer = () => setIsRunning(true);
    const pauseTimer = () => setIsRunning(false);
    const resetTimer = () => {
        setIsRunning(false);
        setIsWork(true);
        setCycle(1);
        setTimeLeft(pomoConfig.workTime);
        setTotalTime(pomoConfig.workTime);
    };

    // Form inputs for new tasks
    const [taskInput, setTaskInput] = useState('');
    const [dueDateInput, setDueDateInput] = useState('');
    const [categoryInput, setCategoryInput] = useState('Office');

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!taskInput.trim()) return;

        const newTask = {
            id: Date.now(),
            text: taskInput.trim(),
            dueDate: dueDateInput,
            category: categoryInput,
            checked: false,
            kanbanStatus: 'Backlog'
        };

        setTasks([newTask, ...tasks]);
        setTaskInput('');
        setDueDateInput('');
    };

    const toggleTaskChecked = (id) => {
        setTasks(tasks.map(t => {
            if (t.id === id) {
                const checked = !t.checked;
                if (checked) {
                    setScore(prev => prev + 3);
                }
                return { ...t, checked, kanbanStatus: checked ? 'Done' : 'In Progress' };
            }
            return t;
        }));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const updateKanbanStatus = (id, newStatus) => {
        setTasks(tasks.map(t => {
            if (t.id === id) {
                return { ...t, kanbanStatus: newStatus, checked: newStatus === 'Done' };
            }
            return t;
        }));
    };

    // Rank Badge logic
    const getBadge = (s) => {
        if (s >= 200) return { name: 'Director', icon: 'fa-crown', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
        if (s >= 100) return { name: 'Manager', icon: 'fa-user-tie', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
        if (s >= 50) return { name: 'Taskmaster', icon: 'fa-hammer', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
        return { name: "Beginner's Luck", icon: 'fa-seedling', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    };

    const badge = getBadge(score);

    const scoreBadge = (
        <div className="prod-score-badge">
            <i className="fas fa-trophy" style={{ fontSize: '1.2rem', color: '#f59e0b' }}></i>
            <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Gamification Score</div>
                <div className="score-num">{score} pts</div>
            </div>
            <div className="rank-pill" style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.color}40` }}>
                <i className={`fas ${badge.icon}`}></i> {badge.name}
            </div>
        </div>
    );

    return (
        <AppShell title="Productivity Hub" icon="fas fa-stopwatch" headerActions={scoreBadge} noPadding={true}>
            <div className="prod-hub-container">
                {/* Navigation Tabs */}
                <div className="prod-tabs">
                    <button 
                        className={`prod-tab-btn ${activeTab === 'timers' ? 'active' : ''}`}
                        onClick={() => setTab('timers')}
                    >
                        <i className="fas fa-stopwatch"></i> Focus & Timers
                    </button>
                    <button 
                        className={`prod-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                        onClick={() => setTab('tasks')}
                    >
                        <i className="fas fa-list-check"></i> Tasks & Gamification
                    </button>
                    <button 
                        className={`prod-tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
                        onClick={() => setTab('kanban')}
                    >
                        <i className="fas fa-columns"></i> Kanban Workspace
                    </button>
                </div>

                {/* TAB 1: FOCUS & TIMERS */}
                {activeTab === 'timers' && (
                    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                        <Pomodoro embedded={true} />
                    </div>
                )}

                {/* TAB 2: TASKS & GAMIFICATION */}
                {activeTab === 'tasks' && (
                    <div>
                        <TodoList embedded={true} />
                    </div>
                )}

                {/* TAB 3: KANBAN WORKSPACE */}
                {activeTab === 'kanban' && (
                    <div>
                        <KanbanBoard embedded={true} />
                    </div>
                )}
            </div>
        </AppShell>
    );
}
