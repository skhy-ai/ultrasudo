/**
 * Home Diagnostics — Symptom Flowchart / Decision Tree
 * Adds a visual interactive symptom navigator alongside the chat UI.
 * Based on a branching decision tree from symptoms → possible conditions.
 */

// Symptom Decision Tree
const SYMPTOM_TREE = {
    root: {
        question: 'Where is your main discomfort?',
        options: [
            { label: '🧠 Head / Neurological', next: 'head' },
            { label: '❤️ Chest / Heart', next: 'chest' },
            { label: '🫁 Respiratory', next: 'respiratory' },
            { label: '🤢 Digestive / Abdomen', next: 'digestive' },
            { label: '💪 Muscles / Joints', next: 'musculoskeletal' },
            { label: '🌡️ Fever / General', next: 'fever' },
            { label: '👁️ Eyes / Vision', next: 'eyes' },
            { label: '🦷 Mouth / Throat', next: 'throat' },
        ]
    },
    head: {
        question: 'What type of head symptom?',
        options: [
            { label: 'Throbbing headache', next: 'result', result: { conditions: ['Migraine', 'Tension headache', 'Dehydration'], urgency: 'low', action: 'Rest in dark room, hydrate. Take ibuprofen/paracetamol. See doctor if >3 days or sudden severe onset.' } },
            { label: 'Dizziness / Vertigo', next: 'result', result: { conditions: ['Vertigo (BPPV)', 'Inner ear infection', 'Low blood pressure'], urgency: 'medium', action: 'Sit or lie down. Stay hydrated. Avoid sudden movements. See doctor if persists >1 day.' } },
            { label: 'Confusion / Memory issues', next: 'result', result: { conditions: ['Dehydration', 'Low blood sugar', 'Stroke (if sudden)'], urgency: 'high', action: '⚠️ If sudden onset — call emergency services immediately. Could indicate stroke (FAST test).' } },
            { label: 'Headache with stiff neck + fever', next: 'result', result: { conditions: ['Meningitis'], urgency: 'emergency', action: '🚨 EMERGENCY: Call ambulance immediately. Do NOT wait.' } },
        ]
    },
    chest: {
        question: 'Describe your chest symptom:',
        options: [
            { label: 'Sharp pain on breathing', next: 'result', result: { conditions: ['Pleuritis', 'Costochondritis', 'Pneumonia'], urgency: 'medium', action: 'Seek medical attention within hours. Monitor breathing rate.' } },
            { label: 'Crushing / pressure chest pain', next: 'result', result: { conditions: ['Heart attack', 'Angina'], urgency: 'emergency', action: '🚨 EMERGENCY: Call ambulance immediately. Chew aspirin (325mg) if not allergic.' } },
            { label: 'Palpitations / racing heart', next: 'result', result: { conditions: ['Arrhythmia', 'Anxiety / Panic attack', 'Caffeine excess'], urgency: 'medium', action: 'Sit down and breathe slowly. Avoid caffeine. See doctor if frequent or with chest pain.' } },
            { label: 'Heartburn / acid reflux', next: 'result', result: { conditions: ['GERD', 'Gastritis'], urgency: 'low', action: 'Take antacid. Avoid spicy food and lying down after eating. See GP if chronic.' } },
        ]
    },
    respiratory: {
        question: 'What is your respiratory symptom?',
        options: [
            { label: 'Dry persistent cough', next: 'result', result: { conditions: ['Viral infection', 'Allergies', 'COVID-19', 'ACE inhibitor side effect'], urgency: 'low', action: 'Stay hydrated. Honey + lemon. See doctor if >2 weeks or with blood.' } },
            { label: 'Shortness of breath (sudden)', next: 'result', result: { conditions: ['Asthma', 'Panic attack', 'Pulmonary embolism', 'Heart failure'], urgency: 'high', action: '⚠️ Seek emergency care if sudden onset at rest. Use inhaler if asthmatic.' } },
            { label: 'Wheezing', next: 'result', result: { conditions: ['Asthma', 'Bronchitis', 'Allergic reaction'], urgency: 'medium', action: 'Use bronchodilator if available. Sit upright. Seek care if not improving in 1 hour.' } },
            { label: 'Runny nose + sneezing', next: 'result', result: { conditions: ['Common cold', 'Allergic rhinitis', 'Flu'], urgency: 'low', action: 'Rest, fluids, vitamin C. Antihistamine for allergies. See doctor if no improvement in 10 days.' } },
        ]
    },
    digestive: {
        question: 'What digestive symptom are you experiencing?',
        options: [
            { label: 'Nausea / Vomiting', next: 'result', result: { conditions: ['Gastroenteritis', 'Food poisoning', 'Migraine'], urgency: 'low', action: 'Sip clear fluids slowly. Rest. See doctor if vomiting blood or >48 hours.' } },
            { label: 'Severe abdominal pain', next: 'result', result: { conditions: ['Appendicitis', 'Kidney stones', 'Bowel obstruction'], urgency: 'high', action: '⚠️ Seek emergency care for severe constant pain, especially lower right (appendicitis).' } },
            { label: 'Diarrhoea', next: 'result', result: { conditions: ['Gastroenteritis', 'Food intolerance', 'IBS'], urgency: 'low', action: 'Stay hydrated with oral rehydration salts. Eat bland foods (BRAT diet). See doctor if blood in stool.' } },
            { label: 'Constipation', next: 'result', result: { conditions: ['Low fibre diet', 'Dehydration', 'IBS'], urgency: 'low', action: 'Increase water and fibre intake. Exercise. Take laxative if >5 days. See doctor if chronic.' } },
        ]
    },
    musculoskeletal: {
        question: 'Describe your muscle or joint issue:',
        options: [
            { label: 'Joint pain / swelling', next: 'result', result: { conditions: ['Arthritis', 'Gout', 'Injury', 'Lyme disease'], urgency: 'medium', action: 'Rest and ice affected area. Anti-inflammatory medication. See doctor if swollen, red, and warm.' } },
            { label: 'Back pain', next: 'result', result: { conditions: ['Muscle strain', 'Herniated disc', 'Sciatica'], urgency: 'low', action: 'Gentle stretching, heat/ice. Ibuprofen. See doctor if radiates down leg or with bladder changes.' } },
            { label: 'Muscle cramps', next: 'result', result: { conditions: ['Electrolyte imbalance', 'Dehydration', 'Overexertion'], urgency: 'low', action: 'Stretch muscle gently. Hydrate. Eat banana (potassium). See doctor if frequent or severe.' } },
        ]
    },
    fever: {
        question: 'What is your temperature and additional symptoms?',
        options: [
            { label: 'Fever <38.5°C + tiredness', next: 'result', result: { conditions: ['Viral infection', 'Common cold', 'Flu'], urgency: 'low', action: 'Rest, hydrate, paracetamol/ibuprofen. Monitor temperature. See doctor if >3 days.' } },
            { label: 'Fever >39°C + chills', next: 'result', result: { conditions: ['Influenza', 'COVID-19', 'Bacterial infection'], urgency: 'medium', action: 'See doctor within 24 hours. Antipyretics, fluids. COVID test if applicable.' } },
            { label: 'Fever + rash + sensitivity to light', next: 'result', result: { conditions: ['Meningitis', 'Scarlet fever', 'Measles'], urgency: 'emergency', action: '🚨 EMERGENCY: Seek immediate medical care. May indicate meningitis.' } },
            { label: 'Fatigue / lethargy (no fever)', next: 'result', result: { conditions: ['Anaemia', 'Thyroid disorder', 'Depression', 'Chronic fatigue'], urgency: 'low', action: 'Blood test recommended. Review sleep and diet. See GP if persistent >2 weeks.' } },
        ]
    },
    eyes: {
        question: 'What is your eye symptom?',
        options: [
            { label: 'Red / itchy eyes', next: 'result', result: { conditions: ['Conjunctivitis', 'Allergy', 'Dry eyes'], urgency: 'low', action: 'Antihistamine eye drops for allergy. Antibiotic drops if bacterial. Wash hands frequently.' } },
            { label: 'Sudden vision loss / double vision', next: 'result', result: { conditions: ['Stroke', 'Retinal detachment', 'Optic neuritis'], urgency: 'emergency', action: '🚨 EMERGENCY: Seek immediate medical care. Vision loss is a stroke warning sign.' } },
            { label: 'Eye pain / sensitivity to light', next: 'result', result: { conditions: ['Corneal abrasion', 'Glaucoma', 'Migraine with aura'], urgency: 'medium', action: 'Do not rub eye. See doctor or optometrist within 24 hours if pain severe.' } },
        ]
    },
    throat: {
        question: 'What throat or mouth symptom?',
        options: [
            { label: 'Sore throat', next: 'result', result: { conditions: ['Pharyngitis', 'Strep throat', 'Tonsillitis'], urgency: 'low', action: 'Gargle warm salt water. Throat lozenges. See doctor if white patches appear or >5 days.' } },
            { label: 'Difficulty swallowing', next: 'result', result: { conditions: ['Tonsillitis', 'Epiglottitis', 'Esophageal issue'], urgency: 'medium', action: 'See doctor if sudden or severe difficulty (especially with breathing).' } },
            { label: 'Mouth ulcers', next: 'result', result: { conditions: ['Aphthous ulcers', 'Vitamin B12 deficiency', 'Herpes simplex'], urgency: 'low', action: 'Avoid spicy food. Use antiseptic mouthwash. See doctor if >2 weeks or recurring.' } },
        ]
    }
};

const URGENCY_STYLES = {
    low: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Low Urgency' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'See Doctor Soon' },
    high: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', label: 'Seek Care Today' },
    emergency: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: '🚨 Emergency' }
};

let _history = [];

document.addEventListener('DOMContentLoaded', () => {
    injectFlowchartUI();
});

function injectFlowchartUI() {
    // Find the assessment progress element and add a flowchart tab
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // Create flowchart panel
    const panel = document.createElement('div');
    panel.className = 'symptom-flowchart-panel';
    panel.id = 'symptom-flowchart';
    panel.innerHTML = `
        <div class="flowchart-header">
            <h3><i class="fas fa-project-diagram"></i> Symptom Navigator</h3>
            <button class="flowchart-collapse" id="collapse-flowchart" title="Collapse">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <div class="flowchart-body" id="flowchart-body">
            <div id="flowchart-breadcrumb" class="flowchart-breadcrumb"></div>
            <div id="flowchart-question" class="flowchart-question"></div>
            <div id="flowchart-options" class="flowchart-options"></div>
            <div id="flowchart-result" class="flowchart-result" style="display:none;"></div>
            <button class="flowchart-restart" id="flowchart-restart" style="display:none;">
                <i class="fas fa-rotate-left"></i> Start Over
            </button>
        </div>
    `;
    mainContent.appendChild(panel);

    // Add styles
    addFlowchartStyles();

    // Wire events
    document.getElementById('collapse-flowchart').addEventListener('click', () => {
        const body = document.getElementById('flowchart-body');
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('flowchart-restart').addEventListener('click', () => {
        _history = [];
        navigate('root');
    });

    navigate('root');
}

function navigate(nodeKey) {
    const node = SYMPTOM_TREE[nodeKey];
    if (!node) return;

    const questionEl = document.getElementById('flowchart-question');
    const optionsEl = document.getElementById('flowchart-options');
    const resultEl = document.getElementById('flowchart-result');
    const restartBtn = document.getElementById('flowchart-restart');
    const breadcrumb = document.getElementById('flowchart-breadcrumb');

    resultEl.style.display = 'none';
    restartBtn.style.display = _history.length > 0 ? 'block' : 'none';
    questionEl.textContent = node.question;

    // Breadcrumb
    if (_history.length > 0) {
        breadcrumb.innerHTML = _history.map((h, i) =>
            `<span class="bc-item" onclick="navigateBack(${i})">${h.label}</span>`
        ).join('<i class="fas fa-chevron-right bc-sep"></i>');
    } else {
        breadcrumb.innerHTML = '';
    }

    // Options
    optionsEl.innerHTML = '';
    node.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'flowchart-option';
        btn.textContent = opt.label;
        btn.addEventListener('click', () => {
            if (opt.next === 'result' && opt.result) {
                _history.push({ label: opt.label, key: nodeKey });
                showResult(opt.result, opt.label);
            } else {
                _history.push({ label: opt.label, key: nodeKey });
                navigate(opt.next);
            }
        });
        optionsEl.appendChild(btn);
    });
}

window.navigateBack = function(index) {
    _history = _history.slice(0, index);
    const key = SYMPTOM_TREE[_history[index]?.key || 'root'] ? (_history[index]?.key || 'root') : 'root';
    navigate(key || 'root');
    navigate(SYMPTOM_TREE[_history.slice(-1)[0]?.key] ? _history.slice(-1)[0]?.key : 'root');
};

function showResult(result, symptomLabel) {
    const questionEl = document.getElementById('flowchart-question');
    const optionsEl = document.getElementById('flowchart-options');
    const resultEl = document.getElementById('flowchart-result');
    const restartBtn = document.getElementById('flowchart-restart');

    questionEl.textContent = '';
    optionsEl.innerHTML = '';
    restartBtn.style.display = 'block';

    const urgency = URGENCY_STYLES[result.urgency] || URGENCY_STYLES.low;

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
        <div class="result-urgency" style="background:${urgency.bg}; border-color:${urgency.color};">
            <span style="color:${urgency.color}; font-weight:700;">${urgency.label}</span>
        </div>
        <div class="result-section">
            <div class="result-label">Possible Conditions</div>
            <div class="result-conditions">
                ${result.conditions.map(c => `<span class="condition-tag">${c}</span>`).join('')}
            </div>
        </div>
        <div class="result-section">
            <div class="result-label">Recommended Action</div>
            <p class="result-action">${result.action}</p>
        </div>
        <p class="result-disclaimer">⚕️ This is informational only. Always consult a medical professional for diagnosis and treatment.</p>
    `;

    // Also push to the chat UI if available
    const chatInput = document.getElementById('user-input');
    if (chatInput) {
        chatInput.value = `I have: ${symptomLabel.toLowerCase().replace(/^[^\s]+/u, '')}`;
    }
}

function addFlowchartStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .symptom-flowchart-panel {
            position: fixed; right: 0; top: 50%; transform: translateY(-50%);
            width: 320px; max-height: 85vh; overflow-y: auto;
            background: rgba(10, 14, 26, 0.92); backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.08); border-right: none;
            border-radius: 16px 0 0 16px;
            font-family: 'Inter', 'Segoe UI', sans-serif; color: #f8fafc;
            box-shadow: -8px 0 32px rgba(0,0,0,0.3); z-index: 500;
        }
        .flowchart-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .flowchart-header h3 { font-size: 0.9rem; font-weight: 600; color: #2563eb; display: flex; align-items: center; gap: 8px; }
        .flowchart-collapse { background: none; border: none; color: #64748b; cursor: pointer; padding: 4px; }
        .flowchart-body { padding: 14px; }
        .flowchart-breadcrumb { font-size: 0.72rem; color: #475569; margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
        .bc-item { cursor: pointer; color: #3b82f6; }
        .bc-item:hover { text-decoration: underline; }
        .bc-sep { font-size: 10px; color: #334155; }
        .flowchart-question { font-size: 0.9rem; font-weight: 600; color: #e2e8f0; margin-bottom: 12px; line-height: 1.4; }
        .flowchart-options { display: flex; flex-direction: column; gap: 6px; }
        .flowchart-option {
            text-align: left; padding: 9px 14px; background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; color: #94a3b8;
            cursor: pointer; font-size: 0.83rem; transition: all 0.2s;
        }
        .flowchart-option:hover { background: rgba(37,99,235,0.15); border-color: rgba(37,99,235,0.4); color: #93c5fd; }
        .flowchart-result { background: rgba(15,23,42,0.6); border-radius: 12px; padding: 14px; margin-bottom: 10px; }
        .result-urgency { padding: 8px 12px; border-radius: 8px; border: 1px solid; margin-bottom: 12px; font-size: 0.85rem; }
        .result-section { margin-bottom: 12px; }
        .result-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-bottom: 6px; }
        .result-conditions { display: flex; flex-wrap: wrap; gap: 6px; }
        .condition-tag { padding: 3px 10px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.25); border-radius: 20px; font-size: 0.75rem; color: #93c5fd; }
        .result-action { font-size: 0.82rem; color: #cbd5e1; line-height: 1.6; }
        .result-disclaimer { font-size: 0.72rem; color: #475569; margin-top: 10px; font-style: italic; }
        .flowchart-restart { width: 100%; padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #64748b; border-radius: 8px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 8px; }
        .flowchart-restart:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
    `;
    document.head.appendChild(style);
}
