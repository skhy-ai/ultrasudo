import React, { useState, useEffect, useRef } from 'react';
import { OTC_MEDICATIONS, COMMON_SYMPTOMS } from '../../../data/otcMedications';


export default function HealthDiagnosticsAgent({ speak }) {
    const [viewMode, setViewMode] = useState('triage'); // 'triage' | 'med_library'
    const [medSearch, setMedSearch] = useState('');
    const [messages, setMessages] = useState([
        { 
            sender: 'agent', 
            text: 'Hello! I am your AI Health & Diagnostics Agent powered by the clinical OTC Medicine Database. What symptoms or health concerns are you experiencing today?' 
        }
    ]);
    const [step, setStep] = useState(0); // 0: Symptom, 1: Severity, 2: Conditions, 3: Vitals, 4: Summary
    const [intakeData, setIntakeData] = useState({
        symptom: '',
        severity: 3,
        duration: '1-2 Days',
        conditions: [],
        temp: 98.6,
        bp: '120/80',
        hr: 72
    });
    const [inputQuery, setInputQuery] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addAgentMessage = (text) => {
        setMessages(prev => [...prev, { sender: 'agent', text }]);
        if (speak) speak(text);
    };

    const handleSymptomSelect = (symptomItem) => {
        setIntakeData(prev => ({ ...prev, symptom: symptomItem.label }));
        setMessages(prev => [...prev, { sender: 'user', text: `Primary Symptom: ${symptomItem.label}` }]);
        
        setTimeout(() => {
            setStep(1);
            addAgentMessage(`Understood. On a scale of 1 to 10, how severe is your discomfort?`);
        }, 400);
    };

    const handleSeveritySelect = (severityVal) => {
        setIntakeData(prev => ({ ...prev, severity: severityVal }));
        const label = severityVal <= 3 ? 'Mild (1-3)' : severityVal <= 6 ? 'Moderate (4-6)' : 'Severe (7-10)';
        setMessages(prev => [...prev, { sender: 'user', text: `Severity level: ${label}` }]);

        setTimeout(() => {
            setStep(2);
            addAgentMessage(`Do you have any existing health conditions (e.g. Liver Disease, Heart Condition, Stomach Ulcer, Glaucoma, Pregnancy)? Select any that apply.`);
        }, 400);
    };

    const toggleCondition = (condName) => {
        setIntakeData(prev => {
            const exists = prev.conditions.includes(condName);
            const updated = exists ? prev.conditions.filter(c => c !== condName) : [...prev.conditions, condName];
            return { ...prev, conditions: updated };
        });
    };

    const confirmConditionsStep = () => {
        const condList = intakeData.conditions.length > 0 ? intakeData.conditions.join(', ') : 'None reported';
        setMessages(prev => [...prev, { sender: 'user', text: `Pre-existing conditions: ${condList}` }]);
        setTimeout(() => {
            setStep(3);
            addAgentMessage(`Please confirm your body temperature (°F) and vital measurements.`);
        }, 400);
    };

    const generateDiagnosticAssessment = () => {
        setStep(4);
        const { symptom, severity, duration, conditions, temp } = intakeData;
        const numTemp = parseFloat(temp) || 98.6;

        let triageStatus = '🟢 Routine Self-Care & OTC Options';
        let mainAdvice = 'Your symptoms appear mild and manageable with rest, hydration, and targeted OTC care.';

        if (severity >= 8 || numTemp >= 103) {
            triageStatus = '🔴 Urgent Care Attention Recommended';
            mainAdvice = 'CRITICAL WARNING: High fever or severe pain requires immediate medical evaluation. Seek urgent care if symptoms worsen.';
        } else if (severity >= 5 || numTemp >= 100.4 || conditions.length > 0) {
            triageStatus = '🟡 Doctor Consultation Recommended';
            mainAdvice = 'Given your moderate symptoms or health background, consult a physician if symptoms do not improve in 48 hours.';
        }

        // Match OTC Meds
        let matchedMeds = OTC_MEDICATIONS.filter(m => {
            const symLower = symptom.toLowerCase();
            return m.symptom.toLowerCase().includes(symLower) || m.use.toLowerCase().includes(symLower);
        });
        if (matchedMeds.length === 0) matchedMeds = OTC_MEDICATIONS.slice(0, 3);

        // Filter out contraindicated meds based on conditions
        const safeMeds = matchedMeds.filter(m => {
            const warn = m.warnings.toLowerCase();
            if (conditions.includes('Liver Disease') && warn.includes('liver')) return false;
            if (conditions.includes('Heart Condition') && (warn.includes('heart') || warn.includes('cv'))) return false;
            if (conditions.includes('Ulcers') && warn.includes('ulcer')) return false;
            if (conditions.includes('Glaucoma') && warn.includes('glaucoma')) return false;
            if (conditions.includes('Pregnancy') && warn.includes('pregnancy')) return false;
            return true;
        });

        const medsReport = safeMeds.length > 0
            ? safeMeds.map(m => `• **${m.name}** (${m.brand})\n  *Usage:* ${m.use} | *Timing:* ${m.timing}\n  *Warnings:* ${m.warnings}`).join('\n\n')
            : '• **Paracetamol (500mg)** - Safe baseline analgesic. Consult doctor for specific prescriptions.';

        const summaryReport = `### 📋 Clinical Symptom & OTC Assessment Report

**Concern:** ${symptom} | **Severity:** ${severity}/10
**Vitals:** Temp ${numTemp}°F | HR ${intakeData.hr} bpm | BP ${intakeData.bp}
**Pre-existing Conditions:** ${conditions.length > 0 ? conditions.join(', ') : 'None'}

---
#### ${triageStatus}
${mainAdvice}

#### 💊 Evaluated OTC Medications (Safe Options):
${medsReport}

#### 🌿 Clinical Home Protocol:
• **Hydration:** 2.5L electrolyte fluids daily.
• **Monitoring:** Re-check temperature every 6 hours. Seek immediate care if chest pain or shortness of breath occurs.
`;

        setMessages(prev => [...prev, 
            { sender: 'user', text: `Submitted vitals: ${numTemp}°F, HR ${intakeData.hr} bpm, BP ${intakeData.bp}` },
            { sender: 'agent', text: summaryReport }
        ]);
        if (speak) speak(`Diagnostic assessment complete for ${symptom}. Status: ${triageStatus}`);
    };

    const handleCustomSend = () => {
        if (!inputQuery.trim()) return;
        const q = inputQuery.trim();
        setMessages(prev => [...prev, { sender: 'user', text: q }]);
        setInputQuery('');

        setTimeout(() => {
            addAgentMessage(`Note recorded: "${q}". Stay well hydrated and follow dosage timings. You can search the 31 OTC Medicine Database tab anytime for full contraindications.`);
        }, 600);
    };

    const resetAssessment = () => {
        setStep(0);
        setIntakeData({ symptom: '', severity: 3, duration: '1-2 Days', conditions: [], temp: 98.6, bp: '120/80', hr: 72 });
        setMessages([
            { 
                sender: 'agent', 
                text: 'Intake reset. Select a primary symptom to start a new assessment:' 
            }
        ]);
    };

    const filteredMeds = OTC_MEDICATIONS.filter(m => 
        m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
        m.brand.toLowerCase().includes(medSearch.toLowerCase()) ||
        m.symptom.toLowerCase().includes(medSearch.toLowerCase()) ||
        m.use.toLowerCase().includes(medSearch.toLowerCase())
    );

    return (
        <div className="health-diagnostics-agent-container" style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            height: '660px',
            boxSizing: 'border-box'
        }}>
            {/* Header & Mode Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <i className="fas fa-user-nurse" style={{ fontSize: '18px' }}></i>
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#f8fafc' }}>AI Diagnostics & OTC Medicine Hub</div>
                        <div style={{ fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> 31 OTC Meds Connected
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => setViewMode('triage')}
                        style={{
                            background: viewMode === 'triage' ? '#10b981' : 'rgba(255,255,255,0.08)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        <i className="fas fa-stethoscope"></i> AI Triage
                    </button>
                    <button 
                        onClick={() => setViewMode('med_library')}
                        style={{
                            background: viewMode === 'med_library' ? '#10b981' : 'rgba(255,255,255,0.08)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        <i className="fas fa-pills"></i> OTC Meds (31)
                    </button>
                    <button 
                        onClick={resetAssessment}
                        title="Reset Triage Intake"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                        <i className="fas fa-rotate-left"></i>
                    </button>
                </div>
            </div>

            {/* VIEW MODE 1: TRIAGE CHAT */}
            {viewMode === 'triage' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '6px', margin: '10px 0' }}>
                        {messages.map((m, idx) => (
                            <div key={idx} style={{
                                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                background: m.sender === 'user' ? '#059669' : 'rgba(30, 41, 59, 0.9)',
                                color: '#f8fafc',
                                padding: '12px 16px',
                                borderRadius: m.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                fontSize: '0.9rem',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-line'
                            }}>
                                {m.text}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        {step === 0 && (
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Select primary symptom area:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {COMMON_SYMPTOMS.map(s => (
                                        <button key={s.label} onClick={() => handleSymptomSelect(s)} style={{
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            color: '#6ee7b7',
                                            borderRadius: '20px',
                                            padding: '6px 14px',
                                            fontSize: '0.82rem',
                                            cursor: 'pointer'
                                        }}>
                                            + {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Select severity level:</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <button onClick={() => handleSeveritySelect(2)} style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', color: '#4ade80', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                        Mild (1 - 3)
                                    </button>
                                    <button onClick={() => handleSeveritySelect(5)} style={{ background: 'rgba(234, 179, 8, 0.2)', border: '1px solid #eab308', color: '#fde047', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                        Moderate (4 - 6)
                                    </button>
                                    <button onClick={() => handleSeveritySelect(8)} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                        Severe (7 - 10)
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Select any existing conditions for medication safety:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                    {['Liver Disease', 'Heart Condition', 'Ulcers', 'Glaucoma', 'Pregnancy', 'Kidney Disease'].map(c => {
                                        const sel = intakeData.conditions.includes(c);
                                        return (
                                            <button key={c} onClick={() => toggleCondition(c)} style={{
                                                background: sel ? '#10b981' : 'rgba(255,255,255,0.08)',
                                                color: sel ? 'white' : '#cbd5e1',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                borderRadius: '20px',
                                                padding: '5px 12px',
                                                fontSize: '0.78rem',
                                                cursor: 'pointer'
                                            }}>
                                                {sel ? '✓ ' : '+ '} {c}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={confirmConditionsStep} style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                    Continue to Vitals Input
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Temp (°F)</label>
                                        <input type="number" step="0.1" value={intakeData.temp} onChange={(e) => setIntakeData({ ...intakeData, temp: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '6px', padding: '6px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Heart Rate (bpm)</label>
                                        <input type="number" value={intakeData.hr} onChange={(e) => setIntakeData({ ...intakeData, hr: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '6px', padding: '6px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Blood Pressure</label>
                                        <input type="text" value={intakeData.bp} onChange={(e) => setIntakeData({ ...intakeData, bp: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '6px', padding: '6px' }} />
                                    </div>
                                </div>
                                <button onClick={generateDiagnosticAssessment} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                                    Generate Assessment & Safe Medicines
                                </button>
                            </div>
                        )}

                        {step === 4 && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Type follow-up questions for AI agent..."
                                    value={inputQuery}
                                    onChange={(e) => setInputQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCustomSend()}
                                    style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem' }}
                                />
                                <button onClick={handleCustomSend} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '0 16px', fontWeight: '600', cursor: 'pointer' }}>
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW MODE 2: OTC MEDICINES LIBRARY */}
            {viewMode === 'med_library' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search 31 OTC Medications by brand, chemical name, or symptom (e.g. Paracetamol, Acid, Allergy, Pain)..."
                            value={medSearch}
                            onChange={(e) => setMedSearch(e.target.value)}
                            style={{
                                width: '100%',
                                background: '#0f172a',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: '#f8fafc',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                        {filteredMeds.map((med, i) => (
                            <div key={i} style={{
                                background: 'rgba(30, 41, 59, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '700', color: '#10b981', fontSize: '0.95rem' }}>{med.name}</span>
                                    <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '6px', color: '#cbd5e1' }}>
                                        Brand: <strong>{med.brand}</strong>
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.82rem', color: '#e2e8f0' }}><strong>Use:</strong> {med.use}</div>
                                <div style={{ fontSize: '0.82rem', color: '#38bdf8' }}><strong>Symptoms Addressed:</strong> {med.symptom}</div>
                                <div style={{ fontSize: '0.78rem', color: '#fde047' }}><strong>Timing:</strong> {med.timing}</div>
                                <div style={{ fontSize: '0.78rem', color: '#fca5a5' }}><strong>Warnings / Contraindications:</strong> {med.warnings}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
