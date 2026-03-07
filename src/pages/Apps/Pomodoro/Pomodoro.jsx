import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import TimerDisplay from '../../../components/shared/TimerDisplay/TimerDisplay';
import useLocalStore from '../../../hooks/useLocalStore';
import useAudioBeep from '../../../hooks/useAudioBeep';
import './Pomodoro.css';

const DEFAULT_CONFIG = {
    workTime: 25 * 60,
    breakTime: 5 * 60,
    longBreakTime: 15 * 60,
    cyclesBeforeLongBreak: 4
};

export default function Pomodoro() {
    const [config, setConfig] = useLocalStore('pomodoro_config', DEFAULT_CONFIG);
    const [timeLeft, setTimeLeft] = useState(config.workTime);
    const [totalTime, setTotalTime] = useState(config.workTime);
    const [isRunning, setIsRunning] = useState(false);
    const [isWork, setIsWork] = useState(true);
    const [cycle, setCycle] = useState(1);
    
    const { beep } = useAudioBeep();
    const timerRef = useRef(null);

    const handlePhaseEnd = useCallback(() => {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        
        beep(880, 1); // Notification sound

        if (isWork) {
            const isLongBreak = cycle % config.cyclesBeforeLongBreak === 0;
            const nextTime = isLongBreak ? config.longBreakTime : config.breakTime;
            setTimeLeft(nextTime);
            setTotalTime(nextTime);
            setIsWork(false);
        } else {
            const nextCycle = (cycle % config.cyclesBeforeLongBreak === 0) ? 1 : cycle + 1;
            setCycle(nextCycle);
            setTimeLeft(config.workTime);
            setTotalTime(config.workTime);
            setIsWork(true);
        }
    }, [isWork, cycle, config, beep]);

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
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, handlePhaseEnd]);

    const startTimer = () => setIsRunning(true);
    const pauseTimer = () => setIsRunning(false);
    const resetTimer = () => {
        setIsRunning(false);
        setIsWork(true);
        setCycle(1);
        setTimeLeft(config.workTime);
        setTotalTime(config.workTime);
    };
    const skipTimer = () => handlePhaseEnd();

    const updateConfig = (key, value) => {
        const newConfig = { ...config, [key]: parseInt(value) * 60 };
        setConfig(newConfig);
        if (!isRunning) {
            // Reset state to match new config if not running
            if (isWork) {
                setTimeLeft(newConfig.workTime);
                setTotalTime(newConfig.workTime);
            } else {
                const isLongBreak = cycle % config.cyclesBeforeLongBreak === 0;
                const nextTime = isLongBreak ? newConfig.longBreakTime : newConfig.breakTime;
                setTimeLeft(nextTime);
                setTotalTime(nextTime);
            }
        }
    };

    const getStatusText = () => {
        if (isWork) return `Focus Session ${cycle}`;
        if (cycle % config.cyclesBeforeLongBreak === 0) return 'Long Break';
        return 'Short Break';
    };

    const getBrandColor = () => {
        if (isWork) return '#ef4444'; // Red for work
        if (cycle % config.cyclesBeforeLongBreak === 0) return '#3b82f6'; // Blue for long break
        return '#10b981'; // Green for short break
    };

    return (
        <AppShell title="Pomodoro Timer" icon="fas fa-clock">
            <div className="pomodoro-app">
                <div className="timer-section">
                    <TimerDisplay 
                        timeLeft={timeLeft} 
                        totalTime={totalTime} 
                        status={getStatusText()} 
                        brandColor={getBrandColor()}
                    />
                    
                    <div className="timer-controls">
                        {!isRunning ? (
                            <button className="control-btn start" onClick={startTimer}>
                                <i className="fas fa-play"></i> Start
                            </button>
                        ) : (
                            <button className="control-btn pause" onClick={pauseTimer}>
                                <i className="fas fa-pause"></i> Pause
                            </button>
                        )}
                        <button className="control-btn reset" onClick={resetTimer}>
                            <i className="fas fa-undo"></i> Reset
                        </button>
                        <button className="control-btn skip" onClick={skipTimer}>
                            <i className="fas fa-forward"></i> Skip
                        </button>
                    </div>
                </div>

                <div className="settings-section">
                    <h2 className="settings-title">Settings</h2>
                    <div className="settings-grid">
                        <div className="setting-item">
                            <label>Work Duration (mins)</label>
                            <input 
                                type="number" 
                                value={config.workTime / 60} 
                                onChange={(e) => updateConfig('workTime', e.target.value)}
                            />
                        </div>
                        <div className="setting-item">
                            <label>Short Break (mins)</label>
                            <input 
                                type="number" 
                                value={config.breakTime / 60} 
                                onChange={(e) => updateConfig('breakTime', e.target.value)}
                            />
                        </div>
                        <div className="setting-item">
                            <label>Long Break (mins)</label>
                            <input 
                                type="number" 
                                value={config.longBreakTime / 60} 
                                onChange={(e) => updateConfig('longBreakTime', e.target.value)}
                            />
                        </div>
                        <div className="setting-item">
                            <label>Long Break Interval</label>
                            <select 
                                value={config.cyclesBeforeLongBreak}
                                onChange={(e) => setConfig({ ...config, cyclesBeforeLongBreak: parseInt(e.target.value) })}
                            >
                                <option value="2">Every 2 cycles</option>
                                <option value="3">Every 3 cycles</option>
                                <option value="4">Every 4 cycles</option>
                                <option value="5">Every 5 cycles</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
