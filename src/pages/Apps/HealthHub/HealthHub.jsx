import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import './HealthHub.css';

const RECIPES = [
    {
        id: 1,
        name: 'Avocado & Quinoa Power Bowl',
        cuisine: 'Mediterranean',
        tags: ['vegan', 'gluten-free', 'no-meat'],
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800',
        ingredients: [
            { name: 'Quinoa', amount: '1 cup cooked' },
            { name: 'Avocado', amount: '1 sliced' },
            { name: 'Cherry Tomatoes', amount: '1/2 cup' },
            { name: 'Olive Oil & Lemon', amount: '2 tbsp' }
        ],
        steps: [
            { text: 'Rinse and boil quinoa in fresh water for 15 minutes until fluffy.' },
            { text: 'Slice fresh ripe avocado and halve the juicy cherry tomatoes.' },
            { text: 'Assemble quinoa base in a bowl and top with avocado and tomatoes.' },
            { text: 'Drizzle extra virgin olive oil and lemon juice. Season with sea salt.' }
        ]
    },
    {
        id: 2,
        name: 'Palak Tofu Curry',
        cuisine: 'Indian',
        tags: ['vegan', 'gluten-free', 'no-meat'],
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800',
        ingredients: [
            { name: 'Fresh Spinach', amount: '4 cups' },
            { name: 'Firm Tofu', amount: '200g cubed' },
            { name: 'Garlic & Ginger', amount: '1 tbsp minced' },
            { name: 'Indian Spices', amount: '1 tsp cumin, turmeric' }
        ],
        steps: [
            { text: 'Blanch fresh spinach leaves for 2 minutes and puree into a smooth green paste.' },
            { text: 'Sauté garlic, ginger, cumin, and turmeric in a pan until aromatic.' },
            { text: 'Add spinach puree and simmer cubed tofu for 8 minutes.' },
            { text: 'Serve warm with low-GI brown rice or whole-wheat roti.' }
        ]
    },
    {
        id: 3,
        name: 'Asian Sesame Edamame Salad',
        cuisine: 'Asian',
        tags: ['vegan', 'gluten-free', 'no-meat'],
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
        ingredients: [
            { name: 'Shelled Edamame', amount: '1.5 cups' },
            { name: 'Shredded Cabbage', amount: '2 cups' },
            { name: 'Sesame Dressing', amount: '2 tbsp' }
        ],
        steps: [
            { text: 'Steam shelled edamame pods for 5 minutes and let cool.' },
            { text: 'Toss shredded purple and green cabbage in a large wooden salad bowl.' },
            { text: 'Mix in edamame and dress generously with toasted sesame vinaigrette.' }
        ]
    }
];

const SUN_SALUTATION_POSES = [
    { name: "Prayer Pose", instruction: "Stand tall. Palms together at heart center. Breathe deeply." },
    { name: "Raised Arms Pose", instruction: "Inhale deeply, sweep arms overhead and gently stretch back." },
    { name: "Hand to Foot Pose", instruction: "Exhale fully, hinge at hips and fold forward to touch toes." },
    { name: "Equestrian Pose", instruction: "Inhale, step right leg far back into a low lunge. Look forward." },
    { name: "Plank Pose", instruction: "Hold breath, step left leg back to join right in a strong plank." },
    { name: "Eight-Limbed Pose", instruction: "Exhale, lower knees, chest, and chin gently to the mat." },
    { name: "Cobra Pose", instruction: "Inhale, slide forward and lift chest upwards with soft shoulders." },
    { name: "Downward Dog", instruction: "Exhale, lift hips high up and back into an inverted V." },
    { name: "Equestrian Pose", instruction: "Inhale, step right foot forward between hands into lunge." },
    { name: "Hand to Foot Pose", instruction: "Exhale, step left foot forward. Fold deeply over legs." },
    { name: "Raised Arms Pose", instruction: "Inhale, reach up and arch gently backwards." },
    { name: "Mountain Pose", instruction: "Exhale, drop hands to side. Feel grounded and peaceful." }
];

const BREATHING_PHASES = [
    { text: 'Inhale', duration: 4000, scale: 1.5 },
    { text: 'Hold', duration: 4000, scale: 1.5 },
    { text: 'Exhale', duration: 4000, scale: 1.0 },
    { text: 'Hold', duration: 4000, scale: 1.0 }
];

export default function HealthHub() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'kitchen';

    const setTab = (tab) => {
        setSearchParams({ tab });
    };

    const [voiceMuted, setVoiceMuted] = useState(false);

    // Speech Synthesis Assistant
    const speak = useCallback((text) => {
        if (voiceMuted || !('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }, [voiceMuted]);

    // ── Kitchen State ──
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [cookingStep, setCookingStep] = useState(null);

    const startCooking = (recipe) => {
        setCookingStep(0);
        setSelectedRecipe(recipe);
        speak(recipe.steps[0].text);
    };

    const nextCookingStep = () => {
        if (cookingStep < selectedRecipe.steps.length - 1) {
            const next = cookingStep + 1;
            setCookingStep(next);
            speak(selectedRecipe.steps[next].text);
        }
    };

    // ── Yoga & Breathing State ──
    const [workoutMode, setWorkoutMode] = useState('none'); // 'none', 'yoga', 'breathing'
    const [yogaIdx, setYogaIdx] = useState(0);
    const [yogaRound, setYogaRound] = useState(1);
    const [yogaTimer, setYogaTimer] = useState(15);
    const [breathIdx, setBreathIdx] = useState(0);

    // Yoga timer loop
    useEffect(() => {
        let timer;
        if (workoutMode === 'yoga') {
            timer = setInterval(() => {
                setYogaTimer((prev) => {
                    if (prev <= 1) {
                        const nextIdx = yogaIdx + 1;
                        if (nextIdx >= SUN_SALUTATION_POSES.length) {
                            if (yogaRound >= 3) {
                                speak("Surya Namaskar practice complete. Namaste.");
                                setWorkoutMode('none');
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
    }, [workoutMode, yogaIdx, yogaRound, speak]);

    // Yoga speech cue
    useEffect(() => {
        if (workoutMode === 'yoga') {
            const pose = SUN_SALUTATION_POSES[yogaIdx];
            speak(`${pose.name}. ${pose.instruction}`);
        }
    }, [yogaIdx, workoutMode, speak]);

    // Breathing loop
    useEffect(() => {
        let timer;
        if (workoutMode === 'breathing') {
            const phase = BREATHING_PHASES[breathIdx];
            speak(phase.text);
            timer = setTimeout(() => {
                setBreathIdx((prev) => (prev + 1) % BREATHING_PHASES.length);
            }, phase.duration);
        }
        return () => clearTimeout(timer);
    }, [workoutMode, breathIdx, speak]);

    // ── Diagnostics & Vitals State ──
    const [heightCm, setHeightCm] = useState(175);
    const [weightKg, setWeightKg] = useState(70);
    const [waterGlasses, setWaterGlasses] = useState(5);

    const bmi = useMemo(() => {
        const hM = heightCm / 100;
        if (!hM || hM <= 0) return 0;
        return (weightKg / (hM * hM)).toFixed(1);
    }, [heightCm, weightKg]);

    const bmiCategory = useMemo(() => {
        const val = parseFloat(bmi);
        if (val < 18.5) return { label: 'Underweight', color: '#f59e0b' };
        if (val < 25.0) return { label: 'Normal / Optimal Weight', color: '#34d399' };
        if (val < 30.0) return { label: 'Overweight', color: '#f87171' };
        return { label: 'Obese', color: '#ef4444' };
    }, [bmi]);

    return (
        <div className="health-hub-container">
            {/* Header */}
            <div className="health-header">
                <div className="health-header-title">
                    <div className="health-header-icon">
                        <i className="fas fa-heart-pulse"></i>
                    </div>
                    <div>
                        <h1>Health & Wellness Hub</h1>
                        <p>Mindful Nutrition, Yoga Workouts & Vitals Diagnostics</p>
                    </div>
                </div>

                <button className="voice-toggle-btn" onClick={() => setVoiceMuted(!voiceMuted)}>
                    <i className={`fas fa-volume-${voiceMuted ? 'xmark' : 'high'}`}></i>
                    {voiceMuted ? 'Voice Off' : 'Voice Assistant On'}
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="health-tabs">
                <button 
                    className={`health-tab-btn ${activeTab === 'kitchen' ? 'active' : ''}`}
                    onClick={() => setTab('kitchen')}
                >
                    <i className="fas fa-utensils"></i> Nutrition & Kitchen
                </button>
                <button 
                    className={`health-tab-btn ${activeTab === 'yoga' ? 'active' : ''}`}
                    onClick={() => setTab('yoga')}
                >
                    <i className="fas fa-spa"></i> Yoga & Meditation
                </button>
                <button 
                    className={`health-tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
                    onClick={() => setTab('diagnostics')}
                >
                    <i className="fas fa-stethoscope"></i> Diagnostics & Vitals
                </button>
            </div>

            {/* TAB 1: NUTRITION & KITCHEN */}
            {activeTab === 'kitchen' && (
                <div>
                    <div className="recipe-grid">
                        {RECIPES.map(r => (
                            <div key={r.id} className="recipe-card" onClick={() => setSelectedRecipe(r)}>
                                <div className="recipe-img" style={{ backgroundImage: `url(${r.image})` }}></div>
                                <div className="recipe-info">
                                    <div className="recipe-title">{r.name}</div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                                        <span className="recipe-tag">{r.cuisine}</span>
                                        {r.tags.map(t => (
                                            <span key={t} className="recipe-tag" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#38bdf8' }}>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Selected Recipe Modal */}
                    {selectedRecipe && cookingStep === null && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
                        }}>
                            <div style={{
                                background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px', padding: '30px', maxWidth: '540px', width: '100%'
                            }}>
                                <h2>{selectedRecipe.name}</h2>
                                <p style={{ color: '#34d399' }}>{selectedRecipe.cuisine} Low-GI Recipe</p>
                                
                                <h4>Ingredients</h4>
                                <ul style={{ color: '#e2e8f0', paddingLeft: '20px' }}>
                                    {selectedRecipe.ingredients.map((ing, i) => (
                                        <li key={i}>{ing.name} — <strong>{ing.amount}</strong></li>
                                    ))}
                                </ul>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                                    <button className="health-btn-primary" style={{ background: '#334155' }} onClick={() => setSelectedRecipe(null)}>Close</button>
                                    <button className="health-btn-primary" onClick={() => startCooking(selectedRecipe)}>
                                        <i className="fas fa-fire"></i> Start Guided Cooking
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cooking Assistant Overlay */}
                    {cookingStep !== null && selectedRecipe && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: '#060913', padding: '40px', zIndex: 1000, overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <button className="voice-toggle-btn" onClick={() => { setCookingStep(null); window.speechSynthesis.cancel(); }}>
                                    ← End Cooking Session
                                </button>
                                <h3>Step {cookingStep + 1} of {selectedRecipe.steps.length}</h3>
                            </div>

                            <div className="health-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                                <h2 style={{ color: '#34d399' }}>{selectedRecipe.name}</h2>
                                <p style={{ fontSize: '1.4rem', margin: '30px 0', lineHeight: '1.6' }}>
                                    "{selectedRecipe.steps[cookingStep].text}"
                                </p>

                                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                    <button 
                                        className="health-btn-primary" 
                                        disabled={cookingStep === 0} 
                                        onClick={() => setCookingStep(c => c - 1)}
                                    >
                                        Previous Step
                                    </button>
                                    <button className="voice-toggle-btn" onClick={() => speak(selectedRecipe.steps[cookingStep].text)}>
                                        <i className="fas fa-volume-high"></i> Speak Step
                                    </button>
                                    <button 
                                        className="health-btn-primary" 
                                        disabled={cookingStep === selectedRecipe.steps.length - 1} 
                                        onClick={nextCookingStep}
                                    >
                                        Next Step
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: YOGA & MEDITATION */}
            {activeTab === 'yoga' && (
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    {workoutMode === 'none' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="health-card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => { setWorkoutMode('yoga'); setYogaIdx(0); setYogaRound(1); setYogaTimer(15); }}>
                                <i className="fas fa-sun" style={{ fontSize: '3rem', color: '#f59e0b', marginBottom: '16px' }}></i>
                                <h3>Sun Salutation</h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>12 Poses of Surya Namaskar to energize body & mind.</p>
                            </div>
                            <div className="health-card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => { setWorkoutMode('breathing'); setBreathIdx(0); }}>
                                <i className="fas fa-wind" style={{ fontSize: '3rem', color: '#14b8a6', marginBottom: '16px' }}></i>
                                <h3>Pranayama Box Breathing</h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Deep breathing pulse for stress reduction and calm.</p>
                            </div>
                        </div>
                    )}

                    {/* Active Yoga Workout */}
                    {workoutMode === 'yoga' && (
                        <div className="health-card" style={{ textAlign: 'center' }}>
                            <h2 style={{ color: '#f59e0b' }}>{SUN_SALUTATION_POSES[yogaIdx].name}</h2>
                            <p style={{ fontSize: '1.2rem', margin: '20px 0', color: '#f8fafc' }}>
                                {SUN_SALUTATION_POSES[yogaIdx].instruction}
                            </p>

                            <div style={{ fontSize: '3.5rem', fontWeight: '800', color: '#38bdf8', margin: '20px 0' }}>
                                {yogaTimer}s
                            </div>
                            <div style={{ color: '#94a3b8', marginBottom: '24px' }}>Round {yogaRound} of 3</div>

                            <button className="health-btn-primary" style={{ background: '#ef4444' }} onClick={() => setWorkoutMode('none')}>
                                Exit Workout Session
                            </button>
                        </div>
                    )}

                    {/* Active Box Breathing */}
                    {workoutMode === 'breathing' && (
                        <div className="health-card" style={{ textAlign: 'center' }}>
                            <h2>Pranayama Box Breathing</h2>
                            <div className="breathing-box">
                                <div 
                                    className="breathing-pulse-circle"
                                    style={{
                                        transform: `scale(${BREATHING_PHASES[breathIdx].scale})`
                                    }}
                                >
                                    {BREATHING_PHASES[breathIdx].text}
                                </div>
                            </div>
                            <button className="health-btn-primary" style={{ background: '#ef4444', marginTop: '20px' }} onClick={() => setWorkoutMode('none')}>
                                End Breathing Session
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: DIAGNOSTICS & VITALS */}
            {activeTab === 'diagnostics' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* BMI Calculator */}
                    <div className="health-card">
                        <div className="health-card-title">
                            <span>BMI & Calorie Assessment</span>
                            <i className="fas fa-calculator" style={{ color: '#10b981' }}></i>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Height (cm)</label>
                            <input 
                                type="number" 
                                className="health-input"
                                value={heightCm}
                                onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Weight (kg)</label>
                            <input 
                                type="number" 
                                className="health-input"
                                value={weightKg}
                                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        <div style={{ background: 'rgba(15,23,42,0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Calculated Body Mass Index</div>
                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: bmiCategory.color, marginTop: '4px' }}>
                                {bmi} <span style={{ fontSize: '1rem', fontWeight: '600' }}>({bmiCategory.label})</span>
                            </div>
                        </div>
                    </div>

                    {/* Hydration Tracker */}
                    <div className="health-card">
                        <div className="health-card-title">
                            <span>Daily Hydration Tracker</span>
                            <i className="fas fa-glass-water" style={{ color: '#38bdf8' }}></i>
                        </div>

                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ fontSize: '3rem', fontWeight: '800', color: '#38bdf8' }}>
                                {waterGlasses} / 8 <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Glasses</span>
                            </div>
                            <p style={{ color: '#94a3b8', margin: '6px 0 20px' }}>Target: 2.0 Liters Daily</p>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button className="health-btn-primary" style={{ background: '#334155' }} onClick={() => setWaterGlasses(g => Math.max(0, g - 1))}>
                                    - 1 Glass
                                </button>
                                <button className="health-btn-primary" onClick={() => setWaterGlasses(g => g + 1)}>
                                    + 1 Glass
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
