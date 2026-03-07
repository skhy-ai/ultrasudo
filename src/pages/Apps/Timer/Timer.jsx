import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import TimerDisplay from '../../../components/shared/TimerDisplay/TimerDisplay';
import useAudioBeep from '../../../hooks/useAudioBeep';
import './Timer.css';

export default function Timer() {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [showAlarm, setShowAlarm] = useState(false);
    
    const { beep } = useAudioBeep();
    const timerRef = useRef(null);

    const handleTimerEnd = useCallback(() => {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setShowAlarm(true);
        beep(880, 0.5);
        
        // Loop beep for a bit?
        const beepInterval = setInterval(() => beep(880, 0.5), 1000);
        setTimeout(() => clearInterval(beepInterval), 3000);
    }, [beep]);

    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimerEnd();
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
    }, [isRunning, handleTimerEnd]);

    const setFromInputs = () => {
        const total = (hours * 3600) + (minutes * 60) + seconds;
        setTimeLeft(total);
        setTotalTime(total);
        setShowAlarm(false);
    };

    const startTimer = () => {
        if (timeLeft <= 0) setFromInputs();
        if ((hours * 3600) + (minutes * 60) + seconds > 0 || timeLeft > 0) {
            setIsRunning(true);
            setShowAlarm(false);
        }
    };

    const pauseTimer = () => setIsRunning(false);
    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(0);
        setTotalTime(0);
        setShowAlarm(false);
    };

    const applyPreset = (sec) => {
        setTimeLeft(sec);
        setTotalTime(sec);
        setShowAlarm(false);
        setIsRunning(false);
    };

    return (
        <AppShell title="Countdown Timer" icon="fas fa-stopwatch">
            <div className="timer-app">
                <div className="timer-section">
                    <TimerDisplay 
                        timeLeft={timeLeft} 
                        totalTime={totalTime} 
                        status={isRunning ? 'Counting Down' : 'Ready'} 
                        brandColor="#3b82f6"
                    />
                    
                    {showAlarm && (
                        <div className="timer-alarm">
                            <i className="fas fa-bell"></i> Time's Up!
                        </div>
                    )}

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
                    </div>
                </div>

                <div className="settings-section">
                    <h2 className="settings-title">Set Duration</h2>
                    <div className="inputs-grid">
                        <div className="input-item">
                            <label>Hours</label>
                            <input 
                                type="number" 
                                min="0" 
                                value={hours} 
                                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))} 
                            />
                        </div>
                        <div className="input-item">
                            <label>Minutes</label>
                            <input 
                                type="number" 
                                min="0" 
                                max="59" 
                                value={minutes} 
                                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} 
                            />
                        </div>
                        <div className="input-item">
                            <label>Seconds</label>
                            <input 
                                type="number" 
                                min="0" 
                                max="59" 
                                value={seconds} 
                                onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} 
                            />
                        </div>
                    </div>
                    
                    <button className="set-btn" onClick={setFromInputs}>Apply Duration</button>

                    <div className="presets-section">
                        <h3>Quick Presets</h3>
                        <div className="presets-grid">
                            <button onClick={() => applyPreset(60)}>1 Min</button>
                            <button onClick={() => applyPreset(300)}>5 Mins</button>
                            <button onClick={() => applyPreset(600)}>10 Mins</button>
                            <button onClick={() => applyPreset(1500)}>25 Mins</button>
                            <button onClick={() => applyPreset(3600)}>1 Hour</button>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
