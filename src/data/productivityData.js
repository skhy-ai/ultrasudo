/**
 * Centralized Productivity Data Module
 * Source: ProductivityHub / kanban-board / pomodoro-timer / todo-list
 */
export const DEFAULT_KANBAN_COLUMNS = [
    { id: 'todo', title: 'To Do', color: '#38bdf8' },
    { id: 'in_progress', title: 'In Progress', color: '#f59e0b' },
    { id: 'review', title: 'In Review', color: '#a855f7' },
    { id: 'done', title: 'Completed', color: '#34d399' }
];

export const POMODORO_PRESETS = [
    { name: "Focus Work", duration: 25, type: "work" },
    { name: "Short Break", duration: 5, type: "short_break" },
    { name: "Long Break", duration: 15, type: "long_break" },
    { name: "Deep Flow", duration: 50, type: "work" }
];
