import React from 'react';
import './TimerDisplay.css';

/**
 * TimerDisplay — Shared visual component for Pomodoro and Countdown Timer.
 */
export default function TimerDisplay({ timeLeft, totalTime, status, brandColor }) {
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        if (h > 0) {
            return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const radius = 130;
    const circumference = 2 * Math.PI * radius;
    const offset = totalTime > 0 ? circumference - (timeLeft / totalTime) * circumference : circumference;

    return (
        <div className="timer-display-container" style={{ '--brand-color': brandColor || '#3b82f6' }}>
            <div className="timer-circle-wrapper">
                <svg className="timer-svg" viewBox="0 0 300 300">
                    <circle 
                        className="timer-bg" 
                        cx="150" cy="150" r={radius} 
                    />
                    <circle 
                        className="timer-progress" 
                        cx="150" cy="150" r={radius} 
                        style={{ 
                            strokeDasharray: circumference, 
                            strokeDashoffset: offset 
                        }}
                    />
                </svg>
                <div className="timer-text-overlay">
                    <div className="timer-status">{status}</div>
                    <div className="timer-time">{formatTime(timeLeft)}</div>
                </div>
            </div>
        </div>
    );
}
