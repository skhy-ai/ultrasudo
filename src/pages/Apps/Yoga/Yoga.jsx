import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import './Yoga.css';

const SUN_SALUTATION_STEPS = [
    { name: "Prayer Pose", instruction: "Stand tall. Palms together at heart. Breath deep.", img: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&q=80&w=800" },
    { name: "Raised Arms", instruction: "Inhale, sweep arms up and back. Feel the stretch.", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800" },
    { name: "Hand to Foot", instruction: "Exhale, fold forward. Touch toes or shins.", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" },
    { name: "Equestrian", instruction: "Inhale, step right leg back into lunge. Look forward.", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" },
    { name: "Stick Pose", instruction: "Hold breath, step left leg back to plank.", img: "https://images.unsplash.com/photo-1566942803300-47c197ef9ff6?auto=format&fit=crop&q=80&w=800" },
    { name: "Eight-Limbed", instruction: "Exhale, lower knees, chest, and chin.", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" },
    { name: "Cobra Pose", instruction: "Inhale, slide forward and lift your chest.", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" },
    { name: "Downward Dog", instruction: "Exhale, lift hips up and back.", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" },
    { name: "Equestrian", instruction: "Inhale, step right foot forward to lunge.", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" },
    { name: "Hand to Foot", instruction: "Exhale, step left foot forward. Fold.", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" },
    { name: "Raised Arms", instruction: "Inhale, rise up and stretch back.", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800" },
    { name: "Mountain Pose", instruction: "Exhale, arms down. Feel the peace.", img: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&q=80&w=800" }
];

const BREATHING_CYCLE = [
    { text: 'Inhale', duration: 4000, scale: 2 },
    { text: 'Hold', duration: 4000, scale: 2 },
    { text: 'Exhale', duration: 4000, scale: 1 },
    { text: 'Hold', duration: 4000, scale: 1 }
];

export default function Yoga({ embedded = false }) {
    const [view, setView] = useState('home'); // 'home', 'yoga', 'breathing'
    const [isPaused, setIsPaused] = useState(false);
    
    // Yoga state
    const [yogaIdx, setYogaIdx] = useState(0);
    const [yogaRound, setYogaRound] = useState(1);
    const [yogaTimer, setYogaTimer] = useState(15);
    
    // Breathing state
    const [breathIdx, setBreathIdx] = useState(0);

    const speak = useCallback((text) => {
        if (!('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9;
        u.pitch = 1.1;
        speechSynthesis.speak(u);
    }, []);

    // Yoga timer logic
    useEffect(() => {
        let timer;
        if (view === 'yoga' && !isPaused) {
            timer = setInterval(() => {
                setYogaTimer((prev) => {
                    if (prev <= 1) {
                        const nextIdx = yogaIdx + 1;
                        if (nextIdx >= SUN_SALUTATION_STEPS.length) {
                            if (yogaRound >= 3) {
                                speak("Practice complete. Namaste.");
                                setView('home');
                                return 0;
                            }
                            setYogaRound(r => r + 1);
                            setYogaIdx(0);
                        } else {
                            setYogaIdx(nextIdx);
                        }
                        return 15;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [view, isPaused, yogaIdx, yogaRound, speak]);

    // Update speech for yoga
    useEffect(() => {
        if (view === 'yoga' && !isPaused) {
            const step = SUN_SALUTATION_STEPS[yogaIdx];
            speak(`${step.name}. ${step.instruction}`);
        }
    }, [yogaIdx, view, isPaused, speak]);

    // Breathing logic
    useEffect(() => {
        let timer;
        if (view === 'breathing' && !isPaused) {
            const phase = BREATHING_CYCLE[breathIdx];
            speak(phase.text);
            timer = setTimeout(() => {
                setBreathIdx((prev) => (prev + 1) % BREATHING_CYCLE.length);
            }, phase.duration);
        }
        return () => clearTimeout(timer);
    }, [view, isPaused, breathIdx, speak]);

    const startSession = (mode) => {
        setView(mode);
        setIsPaused(false);
        setYogaIdx(0);
        setYogaRound(1);
        setYogaTimer(15);
        setBreathIdx(0);
    };

    const stopSession = () => {
        setView('home');
        speechSynthesis.cancel();
    };

    const togglePause = () => {
        setIsPaused(!isPaused);
        if (!isPaused) speechSynthesis.cancel();
    };

    const content = (
        <div className="yoga-app-container">
            {view === 'home' && (
                <div className="yoga-home">
                    <header className="yoga-header">
                        <i className="fas fa-lotus lotus-main"></i>
                        <h2 className="yoga-main-title">ZEN YOGA</h2>
                        <p className="yoga-subtitle">Breath in peace, breath out stress.</p>
                    </header>
                    <div className="mode-selector">
                        <div className="yoga-card" onClick={() => startSession('yoga')}>
                            <i className="fas fa-sun"></i>
                            <h3>Sun Salutation</h3>
                            <p>12 poses of Surya Namaskar to energize your body and mind.</p>
                        </div>
                        <div className="yoga-card" onClick={() => startSession('breathing')}>
                            <i className="fas fa-wind"></i>
                            <h3>Pranayama</h3>
                            <p>Box breathing exercises for relaxation and focus.</p>
                        </div>
                    </div>
                </div>
            )}

            {(view === 'yoga' || view === 'breathing') && (
                <div className="session-ui">
                    <div className="session-card">
                        <h2 className="session-title">
                            {view === 'yoga' ? 'Sun Salutation' : 'Box Breathing'}
                        </h2>

                        {view === 'yoga' && (
                            <div className="yoga-content">
                                <div className="pose-image-container">
                                    <img src={SUN_SALUTATION_STEPS[yogaIdx].img} alt="Pose" />
                                </div>
                                <h3 className="pose-name">{SUN_SALUTATION_STEPS[yogaIdx].name}</h3>
                                <p className="pose-instruction">{SUN_SALUTATION_STEPS[yogaIdx].instruction}</p>

                                <div className="timer-wrapper">
                                    <svg width="120" height="120" className="timer-svg">
                                        <circle cx="60" cy="60" r="54" className="timer-bg" />
                                        <circle 
                                            cx="60" cy="60" r="54" 
                                            className="timer-progress" 
                                            style={{ 
                                                strokeDashoffset: 340 - (340 * (15 - yogaTimer) / 15) 
                                            }}
                                        />
                                    </svg>
                                    <span className="timer-val">{yogaTimer}</span>
                                </div>
                                <div className="round-counter">Round {yogaRound} / 3</div>
                            </div>
                        )}

                        {view === 'breathing' && (
                            <div className="breathing-content">
                                <div className="breathing-stage">
                                    <div 
                                        className="breathing-circle"
                                        style={{ 
                                            transform: `scale(${BREATHING_CYCLE[breathIdx].scale})`,
                                            transitionDuration: `${BREATHING_CYCLE[breathIdx].duration}ms`
                                        }}
                                    />
                                    <div className="breathing-text">{BREATHING_CYCLE[breathIdx].text}</div>
                                </div>
                                <p className="breathing-instruction">Follow the circle's pulse.</p>
                            </div>
                        )}

                        <div className="session-controls">
                            <button className="btn btn-pause" onClick={togglePause}>
                                <i className={`fas fa-${isPaused ? 'play' : 'pause'}`}></i>
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button className="btn btn-exit" onClick={stopSession}>
                                <i className="fas fa-stop"></i> Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (embedded) return content;

    return (
        <AppShell title="Zen Yoga" icon="fas fa-spa">
            {content}
        </AppShell>
    );
}
