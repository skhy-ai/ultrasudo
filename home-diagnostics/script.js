// Home Diagnostics Assistant - Main Logic (recreated)
class HomeDiagnosticsApp {
  constructor(){
    this.currentState = 'START';
    this.assessmentData = {};
    this.vitalSigns = { bloodPressure: null, temperature: null, oxygen: null, pulse: null };
    this.conversationHistory = [];
    this.progress = 0;
    this.currentMedications = [];
    this.drugInteractionDatabase = this.initializeDrugInteractions();
    this.init();
  }

  init(){
    this.bindEvents();
    this.setupHistoryTabs();
    this.setupReportGenerator();
    this.loadHistoryData();
    this.showInitialMessage();
    this.updateProgress();
  }

  bindEvents(){
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    sendButton.addEventListener('click', () => this.handleUserInput());
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.handleUserInput(); });

    document.querySelectorAll('.quick-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.closest('.quick-action').dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        this.handleNavigation(section);
      });
    });

    const appBarVitalBtn = document.getElementById('vital-signs-button');
    if (appBarVitalBtn) appBarVitalBtn.addEventListener('click', () => this.handleQuickAction('vital-signs'));

    // Panel / Modal
    document.getElementById('close-panel').addEventListener('click', () => this.togglePanel(false));
    document.getElementById('close-vital-modal').addEventListener('click', () => this.toggleModal('vital-signs-modal', false));
    document.getElementById('cancel-vital').addEventListener('click', () => this.toggleModal('vital-signs-modal', false));
    document.getElementById('save-vital').addEventListener('click', () => this.saveVitalSigns());
    document.getElementById('close-emergency').addEventListener('click', () => this.toggleModal('emergency-modal', false));
  }

  showInitialMessage(){
    setTimeout(() => {
      this.addMessage('assistant', `Welcome! Describe your symptoms and I will help assess them.
- Add vitals via the heart icon.
- Check Natural Remedies for mild issues.
- Use Find Specialist to locate nearby care.`);
    }, 300);
  }

  handleUserInput(){
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    if (!message) return;
    this.addMessage('user', message);
    try{ if (window.homeDxDB?.db) window.homeDxDB.add('symptoms', { text: message }); } catch(e){}
    userInput.value = '';
    this.processInput(message);
  }

  handleQuickAction(action){
    switch(action){
      case 'vital-signs': this.toggleModal('vital-signs-modal', true); break;
      case 'emergency': this.toggleModal('emergency-modal', true); break;
      case 'remedies': this.showNaturalRemedies(this.getLatestSymptom() || 'headache'); break;
      case 'find-care': if (window.findCare?.findSpecialistNearby) window.findCare.findSpecialistNearby((this.currentState||'START').toLowerCase()); break;
      case 'history': this.showPanel('history'); break;
      case 'reports': this.showPanel('reports'); break;
    }
  }


  processInput(input){
    const lower = input.toLowerCase().trim();
    this.conversationHistory.push({ input: lower, timestamp: new Date().toISOString(), state: this.currentState });
    this.navigateDecisionTree(lower);
  }

  navigateDecisionTree(input){
    if (!this.diagnosticsGraph) this.initDiagnosticGraph();
    let response = "I'm not sure I understand. Could you rephrase your symptoms or condition?";
    let matchFound = false;

    if (this.currentState === 'START') {
      for (const t of this.diagnosticsGraph.START.transitions) {
        if (t.keywords.some(k => input.includes(k))) {
          this.currentState = t.target;
          response = this.diagnosticsGraph[t.target].prompt;
          matchFound = true;
          break;
        }
      }
      if (!matchFound) {
        if (input.includes('pain') || input.includes('ache')) response = "Are you experiencing a headache/fever, muscle pain, joint pain, or menstrual cramps?";
        else if (input.includes('stomach') || input.includes('belly') || input.includes('digest')) response = "Is it acid/heartburn, nausea/vomiting, diarrhea, gas/bloating, or spasms?";
        else if (input.includes('breath') || input.includes('cough')) response = "Is it related to allergies, asthma, congestion, or motion sickness?";
        else if (input.includes('fever') || input.includes('infection') || input.includes('skin')) response = "Is it a bacterial infection (e.g. throat), fungal, or skin issue?";
        else response = "I couldn't categorize that. Please try to be specific: is it a headache, muscle pain, nausea, congestion, rash, etc.?";
      }
    } else if (this.currentState === 'MONITOR') {
      if (input.includes('yes') || input.includes('effective') || input.includes('good') || input.includes('better')) {
        response = "Glad to hear it! Continue as prescribed (complete course, monitor side effects, follow up as needed).";
        this.currentState = 'START';
      } else if (input.includes('no') || input.includes('worse') || input.includes('not working')) {
        response = "Please Consult a Doctor. Bring a symptom diary, list the tried medications, and report any side effects.";
        this.currentState = 'START';
      } else {
        response = "Is the treatment effective? Please reply Yes or No.";
      }
    } else {
      const stateObj = this.diagnosticsGraph[this.currentState];
      if (stateObj && stateObj.transitions) {
        for (const t of stateObj.transitions) {
          if (t.keywords.some(k => input.includes(k))) {
            this.currentState = t.target;
            const nextState = this.diagnosticsGraph[t.target];
            if (nextState.end) {
              this.showRecommendations(nextState);
              response = "Here are your recommendations based on your input. After taking this, please monitor your response. Is it effective? (Yes/No)";
              this.currentState = 'MONITOR'; 
            } else {
              response = nextState.prompt;
            }
            matchFound = true;
            break;
          }
        }
      }
      if (!matchFound && stateObj) {
        response = "I didn't catch that. " + stateObj.prompt;
      }
    }

    this.addMessage('assistant', response);
    this.updateProgress();
  }

  initDiagnosticGraph() {
    this.diagnosticsGraph = {
      START: {
        transitions: [
          { keywords: ['headache', 'fever', 'head', 'migraine', 'temperature', 'hot'], target: 'PHC' },
          { keywords: ['muscle', 'body ache', 'sore', 'sprain', 'strain'], target: 'PMC' },
          { keywords: ['joint', 'knee', 'elbow', 'arthritis', 'inflammation', 'swelling'], target: 'PJC' },
          { keywords: ['menstrual', 'period', 'cramps'], target: 'PWC' },
          { keywords: ['acid', 'heartburn', 'reflux', 'gerd', 'burning'], target: 'DHC' },
          { keywords: ['nausea', 'vomit', 'puke', 'queasy', 'sick'], target: 'DNC' },
          { keywords: ['diarrhea', 'loose stool', 'runny bowel', 'runs'], target: 'DDC' },
          { keywords: ['gas', 'bloat', 'fart', 'burp', 'flatulence'], target: 'DGC' },
          { keywords: ['spasm', 'stomach cramp', 'tummy cramp', 'abdominal'], target: 'DSC' },
          { keywords: ['allergy', 'sneez', 'itch', 'runny nose', 'watery eye'], target: 'RAC' },
          { keywords: ['asthma', 'breath', 'wheez', 'shortness'], target: 'RASC' },
          { keywords: ['congestion', 'stuffy', 'phlegm', 'mucus', 'cough', 'cold'], target: 'RCC' },
          { keywords: ['motion', 'car sick', 'sea sick', 'dizzy', 'vertigo'], target: 'RMC' },
          { keywords: ['bacterial', 'throat', 'pus', 'tonsil'], target: 'IBC' },
          { keywords: ['fungal', 'yeast', 'ringworm', 'athlete', 'jock'], target: 'IFC' },
          { keywords: ['skin', 'rash', 'cut', 'wound', 'scrape', 'burn'], target: 'ISC' }
        ]
      },
      PHC: {
        prompt: "For headache/fever: Do you have Liver Problems (yellow eyes/skin, dark urine) or Heart Disease (high BP, chest pain)? Reply: 'Liver', 'Heart', or 'Neither'.",
        transitions: [
          { keywords: ['liver', 'yellow', 'urine'], target: 'PH1' },
          { keywords: ['heart', 'bp', 'blood', 'chest'], target: 'PH2' },
          { keywords: ['neither', 'no', 'none', 'na'], target: 'PH3' }
        ]
      },
      PH1: { end: true, type: "Headache (w/ Liver Risk)", recommendations: ["Paracetamol 500-1000mg ONLY"], warnings: ["Check for Yellow eyes/skin", "Check for Dark urine", "Check for Right upper pain"] },
      PH2: { end: true, type: "Headache (w/ Heart Risk)", recommendations: ["Paracetamol 500-1000mg", "Low-dose aspirin only"], warnings: ["Check BP & oxygen levels", "Check Chest pain", "Check irregular heartbeat"] },
      PH3: { end: true, type: "Headache Protocol", recommendations: ["Paracetamol 500-1000mg", "Ibuprofen 400mg", "Naproxen 250-500mg", "Aspirin 300-900mg", "Celecoxib"], warnings: [] },
      PMC: {
        prompt: "For muscle pain: Do you have Glaucoma (eye pressure/vision changes) or are you Elderly (>65 with balance issues)? Reply 'Glaucoma', 'Elderly', or 'Neither'.",
        transitions: [
          { keywords: ['glaucoma', 'eye', 'vision'], target: 'PM1' },
          { keywords: ['elderly', 'old', 'balance', '65'], target: 'PM2' },
          { keywords: ['neither', 'no', 'none'], target: 'PM3' }
        ]
      },
      PM1: { end: true, type: "Muscle Pain (w/ Glaucoma)", recommendations: ["Paracetamol", "NSAIDs"], warnings: ["Check Eye pressure", "Check Vision changes", "Halos around lights"] },
      PM2: { end: true, type: "Muscle Pain (Elderly)", recommendations: ["Orphenadrine 100mg", "Eperisone 50mg", "Low-dose muscle relaxants"], warnings: ["USE WITH CAUTION", "Check Balance issues", "Check Joint/Recovery"] },
      PM3: { end: true, type: "Muscle Protocol", recommendations: ["Orphenadrine 100mg", "Eperisone 50mg", "Methocarbamol 500-750mg", "Myonal"], warnings: [] },
      PJC: {
        prompt: "For joint pain/inflammation: Do you have a history of Ulcers (stomach pain, black stools) or Heart Disease? Reply 'Ulcer', 'Heart', or 'Neither'.",
        transitions: [
          { keywords: ['ulcer', 'stomach', 'black'], target: 'PJ1' },
          { keywords: ['heart', 'bp', 'chest'], target: 'PJ2' },
          { keywords: ['neither', 'no', 'none'], target: 'PJ3' }
        ]
      },
      PJ1: { end: true, type: "Joint Pain (w/ Ulcers)", recommendations: ["CONSULT DOCTOR"], warnings: ["Check Stomach pain", "Check Black stools", "Loss of appetite"] },
      PJ2: { end: true, type: "Joint Pain (w/ Heart Risk)", recommendations: ["Paracetamol"], warnings: ["Check BP & heart rate", "Check Chest pain"] },
      PJ3: { end: true, type: "Joint Protocol", recommendations: ["Naproxen", "Celecoxib", "Mefenamic Acid"], warnings: [] },
      PWC: {
        prompt: "For menstrual pain: Are you Pregnant, or do you have a Bleeding Disorder? Reply 'Pregnant', 'Bleeding', or 'Neither'.",
        transitions: [
          { keywords: ['pregnant', 'pregnancy'], target: 'PW1' },
          { keywords: ['bleeding', 'blood', 'clot', 'anemia'], target: 'PW2' },
          { keywords: ['neither', 'no', 'none'], target: 'PW3' }
        ]
      },
      PW1: { end: true, type: "Menstrual Pain (Pregnant)", recommendations: ["CONSULT DOCTOR"], warnings: ["Check BP changes", "Unusual pain", "Swelling"] },
      PW2: { end: true, type: "Menstrual Pain (Bleeding Disorder)", recommendations: ["Paracetamol 500-1000mg"], warnings: ["Check Bleeding severity", "Clotting time", "Anemia signs"] },
      PW3: { end: true, type: "Menstrual Protocol", recommendations: ["Mefenamic Acid 500mg", "Tranexamic Acid 500mg", "Ibuprofen 400mg"], warnings: ["Monitor flow intensity", "Monitor pain levels"] },
      DHC: {
        prompt: "For acid/heartburn: Do you have Risk of Osteoporosis (long term use) or Kidney Problems? Reply 'Osteoporosis', 'Kidney', or 'Neither'.",
        transitions: [
          { keywords: ['osteo', 'bone'], target: 'DH1' },
          { keywords: ['kidney', 'urine', 'back'], target: 'DH2' },
          { keywords: ['neither', 'no', 'none'], target: 'DH3' }
        ]
      },
      DH1: { end: true, type: "Acid Protocol (Osteoporosis)", recommendations: ["Antacids (Short Term)", "H2 Blockers"], warnings: ["Check Bone density history"] },
      DH2: { end: true, type: "Acid Protocol (Kidney Risk)", recommendations: ["Consult for Alternatives"], warnings: ["AVOID Aluminum antacids", "AVOID High-dose PPIs", "Check Urine/Swelling"] },
      DH3: { end: true, type: "Acid Protocol", recommendations: ["Omeprazole 20mg", "Esomeprazole", "Rabeprazole", "Famotidine 20mg", "Calcium carbonate/Magnesium hydroxide"], warnings: [] },
      DNC: {
        prompt: "For nausea/vomiting: Do you have Heart Problems or Parkinson's Disease? Reply 'Heart', 'Parkinson', or 'Neither'.",
        transitions: [
          { keywords: ['heart', 'bp', 'chest', 'dizzy'], target: 'DN1' },
          { keywords: ['parkinson', 'motor', 'balance'], target: 'DN2' },
          { keywords: ['neither', 'no', 'none'], target: 'DN3' }
        ]
      },
      DN1: { end: true, type: "Nausea (Heart Risk)", recommendations: ["CONSULT DOCTOR"], warnings: ["Check BP & HR", "Check Chest pain", "Check Dizziness"] },
      DN2: { end: true, type: "Nausea (Parkinson's)", recommendations: ["USE WITH CAUTION: Domperidone 10mg"], warnings: ["Check Motor function", "Balance issues", "Side effects"] },
      DN3: { end: true, type: "Nausea Protocol", recommendations: ["Domperidone 10mg", "Prochlorperazine 5mg", "Ondansetron 4-8mg"], warnings: ["Monitor frequency", "Dehydration risk"] },
      DDC: {
        prompt: "For diarrhea: Do you suspect a Bacterial Infection (fever, blood in stool, severe cramping)? Reply 'Yes' or 'No'.",
        transitions: [
          { keywords: ['yes', 'bacterial', 'fever', 'blood', 'cramp'], target: 'DD1' },
          { keywords: ['no', 'none'], target: 'DD2' }
        ]
      },
      DD1: { end: true, type: "Diarrhea (Bacterial)", recommendations: ["CONSULT DOCTOR"], warnings: ["Fever presence", "Blood in stool", "Severe cramping"] },
      DD2: { end: true, type: "Diarrhea Protocol", recommendations: ["Loperamide 2mg", "Oral rehydration salts"], warnings: ["Check Dehydration signs", "Duration", "Fluid intake"] },
      DGC: {
        prompt: "For gas/bloating: Is it accompanied With Pain? Reply 'With Pain' or 'Without Pain'.",
        transitions: [
          { keywords: ['yes', 'with', 'pain', 'hurt', 'cramp'], target: 'DG1' },
          { keywords: ['no', 'without', 'painless'], target: 'DG2' }
        ]
      },
      DG1: { end: true, type: "Gas Protocol (With Pain)", recommendations: ["Simeticone 40mg", "Antispasmodics"], warnings: ["Check Bloating severity", "Pain location"] },
      DG2: { end: true, type: "Gas Protocol (Without Pain)", recommendations: ["Simeticone 40mg", "Dietary modifications"], warnings: ["Check Frequency", "Eating habits review"] },
      DSC: {
        prompt: "For stomach spasms: Do you have Glaucoma or Prostate Problems? Reply 'Yes' or 'No'.",
        transitions: [
          { keywords: ['yes', 'glaucoma', 'prostate', 'eye', 'urine'], target: 'DS1' },
          { keywords: ['no', 'none', 'neither'], target: 'DS2' }
        ]
      },
      DS1: { end: true, type: "Spasms (Glaucoma/Prostate Risk)", recommendations: ["CONSULT DOCTOR"], warnings: ["Check Eye pressure", "Check Urination patterns", "Vision changes"] },
      DS2: { end: true, type: "Spasm Protocol", recommendations: ["Hyoscine Butylbromide 10mg", "Dicyclomine 10mg"], warnings: ["Monitor response time", "Pattern of spasms"] },
      RAC: {
        prompt: "For allergies: Will you be Driving (Alertness needed) or do you have Liver Problems? Reply 'Driving', 'Liver', or 'Neither'.",
        transitions: [
          { keywords: ['driving', 'drive', 'alertness', 'operate', 'machinery'], target: 'RA1' },
          { keywords: ['liver', 'tests'], target: 'RA2' },
          { keywords: ['neither', 'no', 'none'], target: 'RA3' }
        ]
      },
      RA1: { end: true, type: "Allergy Protocol (Alertness)", recommendations: ["Loratadine 10mg", "Cetirizine 10mg"], warnings: ["SAFE to drive", "AVOID Diphenhydramine", "AVOID Chlorpheniramine"] },
      RA2: { end: true, type: "Allergy Protocol (Liver Caution)", recommendations: ["Levocetirizine"], warnings: ["Check Liver function tests"] },
      RA3: { end: true, type: "Allergy Protocol", recommendations: ["Loratadine 10mg", "Cetirizine 10mg", "Levocetirizine", "Diphenhydramine 25mg", "Chlorpheniramine 4mg"], warnings: [] },
      RASC: {
        prompt: "For asthma symptoms: Do you also have Depression? Reply 'Yes' or 'No'.",
        transitions: [
          { keywords: ['yes', 'depression', 'depressed', 'sad'], target: 'RAS1' },
          { keywords: ['no', 'none', 'neither'], target: 'RAS2' }
        ]
      },
      RAS1: { end: true, type: "Asthma (Depression Caution)", recommendations: ["CONSULT DOCTOR"], warnings: ["Check Mood changes", "Sleep patterns", "Breathing diffs"] },
      RAS2: { end: true, type: "Asthma Protocol", recommendations: ["Montelukast 10mg", "Salbutamol inhaler prn", "Maintenance inhalers"], warnings: ["Monitor Peak flow", "Symptom diary"] },
      RCC: {
        prompt: "For congestion/cough: Do you have a Peptic Ulcer? Reply 'Yes' or 'No'.",
        transitions: [
          { keywords: ['yes', 'ulcer', 'stomach', 'acid'], target: 'RC1' },
          { keywords: ['no', 'none', 'neither'], target: 'RC2' }
        ]
      },
      RC1: { end: true, type: "Congestion (Peptic Ulcer Risk)", recommendations: ["CONSULT DOCTOR"], warnings: ["Check Stomach pain", "Acid reflux", "Bleeding signs"] },
      RC2: { end: true, type: "Congestion Protocol", recommendations: ["Bromhexine 8mg", "Pseudoephedrine 60mg", "Saline nasal spray"], warnings: ["Monitor Breathing ease", "Mucus color", "Sleep quality"] },
      RMC: {
        prompt: "For motion sickness: Do you have Glaucoma? Reply 'Yes' or 'No'.",
        transitions: [
          { keywords: ['yes', 'glaucoma', 'eye'], target: 'RM1' },
          { keywords: ['no', 'none', 'neither'], target: 'RM2' }
        ]
      },
      RM1: { end: true, type: "Motion Sickness (Glaucoma)", recommendations: ["CONSULT DOCTOR"], warnings: ["Check Eye pressure", "Vision changes"] },
      RM2: { end: true, type: "Motion Sickness Protocol", recommendations: ["Dimenhydrinate 50mg", "Meclizine 25mg"], instructions: "Take 30-60 min before travel.", warnings: ["Monitor drowsiness"] },
      IBC: {
        prompt: "For bacterial infection: Do you have a Penicillin Allergy or are you Pregnant? Reply 'Allergy', 'Pregnant', or 'Neither'.",
        transitions: [
          { keywords: ['allergy', 'penicillin', 'allergic'], target: 'IB1' },
          { keywords: ['pregnant', 'pregnancy'], target: 'IB2' },
          { keywords: ['neither', 'no', 'none'], target: 'IB3' }
        ]
      },
      IB1: { end: true, type: "Bacterial Infection (Penicillin Allergy)", recommendations: ["Azithromycin 500mg", "Clarithromycin 500mg", "Doxycycline 100mg"], warnings: [] },
      IB2: { end: true, type: "Bacterial Infection (Pregnancy)", recommendations: ["Amoxicillin", "Cephalexin"], warnings: ["SAFE indicated", "AVOID Tetracyclines", "AVOID Fluoroquinolones"] },
      IB3: { end: true, type: "Bacterial Protocol", recommendations: ["Enhancin", "Norfloxacin", "Azithromycin 500mg", "Amoxicillin 500mg", "Cephalexin 500mg"], warnings: [] },
      IFC: {
        prompt: "For fungal infection: Are you Pregnant? Reply 'Yes' or 'No'.",
        transitions: [
          { keywords: ['yes', 'pregnant', 'pregnancy'], target: 'IF1' },
          { keywords: ['no', 'none', 'neither'], target: 'IF2' }
        ]
      },
      IF1: { end: true, type: "Fungal Infection (Pregnancy)", recommendations: ["CONSULT DOCTOR"], warnings: ["Check Pregnancy stage", "Infection location", "Severity"] },
      IF2: { end: true, type: "Fungal Protocol", recommendations: ["Fluconazole 150mg", "Topical antifungals", "Ketoconazole 2%"], warnings: ["Monitor Spread of infection", "Healing progress"] },
      ISC: {
        prompt: "For skin infection: Do you have Open Wounds? Reply 'Yes' or 'No'.",
        transitions: [
          { keywords: ['yes', 'open', 'wound', 'deep', 'cut'], target: 'IS1' },
          { keywords: ['no', 'none', 'neither'], target: 'IS2' }
        ]
      },
      IS1: { end: true, type: "Skin Infection (Open Wounds)", recommendations: ["CONSULT DOCTOR"], warnings: ["Check Wound depth", "Signs of infection", "Healing stage"] },
      IS2: { end: true, type: "Skin Protocol", recommendations: ["Quinodochlor cream", "Mupirocin 2%", "Antihistamine if needed"], warnings: ["Monitor Skin response", "Spreading/regression"] }
    };
  }

  showRecommendations(recommendations){
    const panel = document.getElementById('recommendations-panel');
    const content = document.getElementById('panel-content');
    let html = `<h4>${recommendations.type.toUpperCase()} TREATMENT</h4>`;
    html += '<div class="recommendation-section"><h5>Recommendations:</h5><ul>';
    (recommendations.recommendations||[]).forEach(r => html += `<li>${r}</li>`);
    html += '</ul></div>';
    if (recommendations.warnings?.length){
      html += '<div class="recommendation-section warning"><h5>⚠️ Warnings:</h5><ul>';
      recommendations.warnings.forEach(w => html += `<li>${w}</li>`);
      html += '</ul></div>';
    }
    if (recommendations.instructions){
      html += `<div class="recommendation-section"><h5>Instructions:</h5><p>${recommendations.instructions}</p></div>`;
    }
    content.innerHTML = html;
    this.togglePanel(true);
    try{ if (window.homeDxDB?.db) window.homeDxDB.add('assessments', { type: recommendations.type, data: recommendations }); } catch(e){}
  }

  togglePanel(show, panelId = 'recommendations-panel') {
    const panel = document.getElementById(panelId);
    const main = document.querySelector('.main-content');
    if (show) { 
      // Hide all panels first
      document.querySelectorAll('.side-panel > div').forEach(p => p.style.display = 'none');
      // Show the requested panel
      panel.style.display = 'flex'; 
      main.style.gridTemplateColumns = '1fr 350px'; 
    } else { 
      panel.style.display = 'none'; 
      main.style.gridTemplateColumns = '1fr 20px'; 
    }
  }

  toggleModal(id, show){ const m=document.getElementById(id); if (!m) return; show? m.classList.add('show') : m.classList.remove('show'); }

  saveVitalSigns(){
    const bp = document.getElementById('bp-input').value;
    const t = parseFloat(document.getElementById('temp-input').value);
    const o2 = parseInt(document.getElementById('o2-input').value);
    const p = parseInt(document.getElementById('pulse-input').value);
    this.vitalSigns = { bloodPressure: bp, temperature: t, oxygen: o2, pulse: p };
    try{ if (window.homeDxDB?.db) window.homeDxDB.add('vitals', { ...this.vitalSigns }); } catch(e){}
    this.analyzeVitalSigns();
    this.updateVitalSignsDisplay();
    this.toggleModal('vital-signs-modal', false);
  }

  analyzeVitalSigns(){
    const results=[]; const { bloodPressure, temperature, oxygen, pulse }=this.vitalSigns;
    const out = document.getElementById('vital-results');
    if (bloodPressure){ const [sys, dia]=(bloodPressure||'').split('/').map(Number); if (sys>=180||dia>=120) results.push('⚠️ Hypertensive crisis: seek immediate care'); else if (sys>=140||dia>=90) results.push('🔴 High blood pressure: monitor/consult'); else if (sys>=130||dia>=80) results.push('🟡 Elevated BP'); else if (sys<90||dia<60) results.push('🟡 Low BP'); else results.push('🟢 Normal BP'); }
    if (temperature){ if (temperature>=103) results.push('⚠️ High fever: seek care'); else if (temperature>=100.4) results.push('🔴 Fever: monitor'); else if (temperature>=99) results.push('🟡 Elevated temp'); else if (temperature<97) results.push('🟡 Low temp'); else results.push('🟢 Normal temp'); }
    if (oxygen){ if (oxygen<95) results.push('⚠️ Low oxygen: seek care'); else if (oxygen<98) results.push('🟡 Low-normal oxygen'); else results.push('🟢 Normal oxygen'); }
    if (pulse){ if (pulse>120) results.push('🟡 High pulse'); else if (pulse<50) results.push('🟡 Low pulse'); else results.push('🟢 Normal pulse'); }
    out.innerHTML = results.map(r=>`<div class="vital-result">${r}</div>`).join('');
  }

  updateVitalSignsDisplay(){
    const { bloodPressure, temperature, oxygen, pulse } = this.vitalSigns;
    const bpEl = document.querySelector('#bp-display span'); if (bpEl) bpEl.textContent = `BP: ${bloodPressure||'-'}`;
    const tEl = document.querySelector('#temp-display span'); if (tEl) tEl.textContent = `Temp: ${isFinite(temperature)?temperature:'-'}`;
    const oEl = document.querySelector('#o2-display span'); if (oEl) oEl.textContent = `O2: ${isFinite(oxygen)?oxygen:'-'}`;
    const pEl = document.querySelector('#pulse-display span'); if (pEl) pEl.textContent = `Pulse: ${isFinite(pulse)?pulse:'-'}`;
    
    // Also update the vitals history if it's visible
    if (document.getElementById('vitals-tab').classList.contains('active')) {
      this.loadHistoryData('vitals');
    }
  }

  addMessage(role, text){
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `message ${role}`;
    const icon = document.createElement('div'); icon.className='message-icon'; icon.innerHTML = role==='assistant'? '<i class="fas fa-robot"></i>':'<i class="fas fa-user"></i>';
    const content = document.createElement('div'); content.className='message-content'; content.innerHTML = text.replace(/\n/g,'<br>');
    msg.append(icon, content); container.appendChild(msg); container.scrollTop = container.scrollHeight;
  }

  showNaturalRemedies(symptom){
    const remedies = window.naturalRemedies?.getRemediesFor ? window.naturalRemedies.getRemediesFor(symptom) : [];
    const content = document.getElementById('panel-content');
    const title = `Natural Remedies for ${String(symptom).toUpperCase()}`;
    if (!remedies.length){ content.innerHTML = `<h4>${title}</h4><p>No specific remedies found. Try hydration, rest, warm compress.</p>`; }
    else {
      let html = `<h4>${title}</h4><div class="recommendation-section"><ul>`;
      remedies.forEach(r => html += `<li><strong>${r.title}</strong>: ${r.detail}</li>`);
      html += '</ul></div>'; content.innerHTML = html;
    }
    this.togglePanel(true);
  }


  getLatestSymptom(){
    for (let i = this.conversationHistory.length-1; i>=0; i--){
      const input = this.conversationHistory[i].input;
      if (input.includes('headache') || input.includes('pain') || input.includes('nausea') || input.includes('fever')) return input;
    }
    return 'headache';
  }

  // History and Reports Functionality
  
  // Setup history tabs functionality
  setupHistoryTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = e.currentTarget.getAttribute('data-tab');
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Show corresponding tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Load data for the selected tab if needed
        this.loadHistoryData(tabId);
      });
    });
  }
  
  // Handle navigation menu clicks
  handleNavigation(section) {
    switch(section) {
      case 'history':
        this.showPanel('history');
        break;
      case 'reports':
        this.showPanel('reports');
        break;
      case 'dashboard':
        this.togglePanel(false);
        break;
      default:
        this.showToast(`"${section}" feature coming soon!`, 'info');
    }
  }
  
  // Show a specific panel
  showPanel(panelId) {
    // Hide all panels first
    document.querySelectorAll('.side-panel > div').forEach(panel => {
      panel.style.display = 'none';
    });
    
    // Show the requested panel
    const panel = document.getElementById(`${panelId}-panel`);
    if (panel) {
      panel.style.display = 'block';
      document.getElementById('side-panel').style.display = 'flex';
      
      // Load data if needed
      if (panelId === 'history') {
        const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab') || 'symptoms';
        this.loadHistoryData(activeTab);
      } else if (panelId === 'reports') {
        document.getElementById('report-preview').style.display = 'none';
      }
    }
  }
  
  // Load history data from IndexedDB
  async loadHistoryData(type = 'symptoms') {
    if (!window.homeDxDB?.db) return;
    
    try {
      let items = [];
      const today = new Date();
      const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
      
      if (type === 'symptoms') {
        items = await window.homeDxDB.getAll('symptoms');
      } else if (type === 'vitals') {
        items = await window.homeDxDB.getAll('vitals');
      } else if (type === 'assessments') {
        items = await window.homeDxDB.getAll('assessments');
      }
      
      this.renderHistoryList(type, items);
    } catch (error) {
      console.error('Error loading history data:', error);
      this.showToast('Error loading history data', 'error');
    }
  }
  
  // Render history items in the appropriate list
  renderHistoryList(type, items) {
    const container = document.getElementById(`${type}-list`);
    if (!container) return;
    
    if (!items || items.length === 0) {
      container.innerHTML = '<p class="empty-message">No ' + type + ' recorded yet</p>';
      return;
    }
    
    container.innerHTML = ''; // Clear existing items
    
    // Sort by date (newest first)
    items.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
    
    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';
      
      const date = item.timestamp ? new Date(item.timestamp) : new Date();
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (type === 'symptoms') {
        itemEl.innerHTML = `
          <div class="history-item-header">
            <span>${dateStr}</span>
            <span>${timeStr}</span>
          </div>
          <div class="history-item-content">
            ${item.text || 'No details available'}
          </div>
        `;
      } else if (type === 'vitals') {
        const vitalItems = [];
        if (item.bloodPressure) vitalItems.push(`BP: ${item.bloodPressure}`);
        if (item.temperature) vitalItems.push(`Temp: ${item.temperature}°C`);
        if (item.oxygen) vitalItems.push(`O2: ${item.oxygen}%`);
        if (item.pulse) vitalItems.push(`Pulse: ${item.pulse} bpm`);
        
        itemEl.innerHTML = `
          <div class="history-item-header">
            <span>${dateStr}</span>
            <span>${timeStr}</span>
          </div>
          <div class="history-item-content">
            <div>${vitalItems.join(' • ')}</div>
          </div>
        `;
      } else if (type === 'assessments') {
        itemEl.innerHTML = `
          <div class="history-item-header">
            <span>${dateStr}</span>
            <span>${timeStr}</span>
          </div>
          <div class="history-item-content">
            <div><strong>${item.type || 'Assessment'}</strong></div>
            ${item.data?.recommendations?.length ? 
              `<div>Recommendations: ${item.data.recommendations.join(', ')}</div>` : ''}
          </div>
        `;
      }
      
      container.appendChild(itemEl);
    });
  }
  
  // Setup report generator
  setupReportGenerator() {
    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    document.getElementById('report-start-date').value = formatDate(startDate);
    document.getElementById('report-end-date').value = formatDate(endDate);
    
    // Generate report button
    const generateBtn = document.getElementById('generate-report');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateReport());
    }
    
    // Print report button
    const printBtn = document.getElementById('print-report');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.printReport());
    }
    
    // Export history button
    const exportBtn = document.getElementById('export-history');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportHistory());
    }
    
    // Print history button
    const printHistoryBtn = document.getElementById('print-history');
    if (printHistoryBtn) {
      printHistoryBtn.addEventListener('click', () => this.printHistory());
    }
  }
  
  // Generate a health report
  async generateReport() {
    const startDate = new Date(document.getElementById('report-start-date').value);
    const endDate = new Date(document.getElementById('report-end-date').value);
    endDate.setHours(23, 59, 59, 999); // End of the day
    
    const selectedSections = Array.from(document.querySelectorAll('input[name="report-sections"]:checked'))
      .map(el => el.value);
    
    if (selectedSections.length === 0) {
      this.showToast('Please select at least one section to include in the report', 'warning');
      return;
    }
    
    try {
      let reportData = {};
      
      // Load data for selected sections
      if (selectedSections.includes('symptoms')) {
        reportData.symptoms = await window.homeDxDB.getByDateRange('symptoms', startDate, endDate);
      }
      
      if (selectedSections.includes('vitals')) {
        reportData.vitals = await window.homeDxDB.getByDateRange('vitals', startDate, endDate);
      }
      
      if (selectedSections.includes('assessments')) {
        reportData.assessments = await window.homeDxDB.getByDateRange('assessments', startDate, endDate);
      }
      
      // Render the report
      this.renderReport(reportData, startDate, endDate);
      
      // Show the preview
      document.getElementById('report-preview').style.display = 'block';
      document.getElementById('report-date').textContent = new Date().toLocaleString();
      document.getElementById('report-range').textContent = 
        `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      
      // Scroll to preview
      document.getElementById('report-preview').scrollIntoView({ behavior: 'smooth' });
      
    } catch (error) {
      console.error('Error generating report:', error);
      this.showToast('Error generating report', 'error');
    }
  }
  
  // Render the report content
  renderReport(data, startDate, endDate) {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;
    
    reportContent.innerHTML = '';
    
    // Helper to create a section
    const createSection = (title, items, renderItem) => {
      if (!items || items.length === 0) return '';
      
      let html = `
        <div class="report-section">
          <h3>${title}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Date</th>
      `;
      
      // Add dynamic headers based on item type
      if (title === 'Symptoms') {
        html += `
                <th>Description</th>
        `;
      } else if (title === 'Vital Signs') {
        html += `
                <th>Blood Pressure</th>
                <th>Temperature</th>
                <th>Oxygen</th>
                <th>Pulse</th>
        `;
      } else if (title === 'Assessments') {
        html += `
                <th>Type</th>
                <th>Recommendations</th>
        `;
      }
      
      html += `
            </tr>
          </thead>
          <tbody>
      `;
      
      // Sort by date
      items.sort((a, b) => new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date));
      
      // Add rows
      items.forEach(item => {
        const date = item.timestamp ? new Date(item.timestamp) : new Date();
        html += '<tr>';
        html += `<td>${date.toLocaleString()}</td>`;
        
        if (title === 'Symptoms') {
          html += `
            <td>${item.text || 'No details'}</td>
          `;
        } else if (title === 'Vital Signs') {
          html += `
            <td>${item.bloodPressure || '-'}</td>
            <td>${item.temperature ? item.temperature + '°C' : '-'}</td>
            <td>${item.oxygen ? item.oxygen + '%' : '-'}</td>
            <td>${item.pulse ? item.pulse + ' bpm' : '-'}</td>
          `;
        } else if (title === 'Assessments') {
          html += `
            <td>${item.type || 'Assessment'}</td>
            <td>${item.data?.recommendations?.join(', ') || 'No recommendations'}</td>
          `;
        }
        
        html += '</tr>';
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
      
      return html;
    };
    
    // Add sections based on available data
    if (data.symptoms) {
      reportContent.innerHTML += createSection('Symptoms', data.symptoms);
    }
    
    if (data.vitals) {
      reportContent.innerHTML += createSection('Vital Signs', data.vitals);
    }
    
    if (data.assessments) {
      reportContent.innerHTML += createSection('Assessments', data.assessments);
    }
    
    // Add summary section
    let summary = '<div class="report-section"><h3>Summary</h3>';
    
    if (data.symptoms) {
      summary += `<p><strong>Symptoms Tracked:</strong> ${data.symptoms.length} entries</p>`;
    }
    
    if (data.vitals) {
      const avgPulse = data.vitals.reduce((sum, v) => sum + (parseInt(v.pulse) || 0), 0) / data.vitals.length;
      summary += `<p><strong>Vitals Recorded:</strong> ${data.vitals.length} entries (Avg Pulse: ${isNaN(avgPulse) ? 'N/A' : avgPulse.toFixed(1)} bpm)</p>`;
    }
    
    if (data.assessments) {
      const types = [...new Set(data.assessments.map(a => a.type))];
      summary += `<p><strong>Assessments:</strong> ${data.assessments.length} total (${types.length} types)</p>`;
    }
    
    summary += '</div>';
    reportContent.insertAdjacentHTML('afterbegin', summary);
  }
  
  // Print the current report
  printReport() {
    const printContent = document.getElementById('report-preview').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div id="print-area">
        <style>
          @media print {
            body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; }
            .report-header { text-align: center; margin-bottom: 20px; }
            .report-header h2 { color: #2563eb; margin: 0 0 10px; }
            .report-meta { margin-bottom: 20px; color: #666; }
            .report-section { margin: 30px 0; }
            .report-section h3 { color: #2563eb; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #f3f4f6; text-align: left; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; }
            .report-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #666; text-align: center; }
          }
        </style>
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    this.showToast('Report printed successfully', 'success');
  }
  
  // Export history data as JSON
  async exportHistory() {
    try {
      const data = {
        symptoms: await window.homeDxDB.getAll('symptoms'),
        vitals: await window.homeDxDB.getAll('vitals'),
        assessments: await window.homeDxDB.getAll('assessments'),
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showToast('History exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting history:', error);
      this.showToast('Error exporting history', 'error');
    }
  }
  
  // Print the current history view
  printHistory() {
    const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab');
    if (!activeTab) return;
    
    const printContent = document.getElementById(`${activeTab}-tab`).innerHTML;
    const title = document.querySelector(`[data-tab="${activeTab}"]`).textContent.trim();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Health History - ${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
          h1 { color: #2563eb; margin-bottom: 20px; }
          .history-item { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
          .history-item-header { display: flex; justify-content: space-between; color: #666; margin-bottom: 5px; font-size: 0.9em; }
          .history-item-content { margin-top: 5px; }
          .empty-message { color: #999; font-style: italic; text-align: center; margin: 40px 0; }
          @page { margin: 1cm; }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Health History - ${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <div class="history-content">
          ${printContent || '<p class="empty-message">No data available</p>'}
        </div>
        <div class="no-print" style="margin-top: 40px; text-align: center; color: #999; font-size: 0.9em;">
          <p>This document was generated by Home Diagnostics App</p>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
  
  // Show a toast notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger reflow
    toast.offsetHeight;
    
    // Show toast
    toast.classList.add('show');
    
    // Remove toast after delay
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
  
  initializeDrugInteractions(){ return { /* placeholder for future extension */ }; }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', ()=>{ window.homeDiagnosticsApp = new HomeDiagnosticsApp(); });
