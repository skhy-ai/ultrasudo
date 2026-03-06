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
    const analysis = this.analyzeInput(lower);
    this.conversationHistory.push({ input: lower, analysis, timestamp: new Date().toISOString(), state: this.currentState });
    this.navigateDecisionTree(analysis);
  }

  analyzeInput(input){
    const analysis = { primaryCategory: null, symptoms: [], severity: 'unknown', keywords: [] };
    const words = input.replace(/[^\w\s]/g,'').split(/\s+/).filter(Boolean);
    analysis.keywords = words;
    const cat = {
      pain: ['pain','ache','headache','migraine','back','joint','stomach','abdominal','cramp'],
      digestive: ['nausea','vomit','diarrhea','constipation','acid','heartburn','bloating','indigestion'],
      respiratory: ['cough','cold','flu','congestion','sneeze','asthma','breath','wheeze'],
      infection: ['fever','infection','rash','wound','swollen','redness']
    };
    for (const [k, arr] of Object.entries(cat)){
      if (arr.some(t => input.includes(t))) { analysis.primaryCategory = k; break; }
    }
    const patterns = [
      { p:/headache|head pain/, s:'headache' },
      { p:/abdominal|stomach pain|belly|tummy/, s:'abdominal pain' },
      { p:/nausea|queasy/, s:'nausea' },
      { p:/cough/, s:'cough' },
      { p:/fever|high temperature/, s:'fever' },
      { p:/diarrhea|loose stool/, s:'diarrhea' }
    ];
    patterns.forEach(({p,s}) => { if (p.test(input) && !analysis.symptoms.includes(s)) analysis.symptoms.push(s); });
    return analysis;
  }

  navigateDecisionTree(a){
    let response = '';
    let rec = null;
    switch((this.currentState === 'START' && a.primaryCategory) ? a.primaryCategory.toUpperCase() : this.currentState){
      case 'START':
        if (a.primaryCategory){ this.currentState = a.primaryCategory.toUpperCase(); response = this.getCategoryPrompt(a); }
        else { response = this.getClarificationPrompt(); }
        break;
      case 'PAIN': ({ response, recommendations: rec } = this.handlePain(a)); break;
      case 'DIGESTIVE': ({ response, recommendations: rec } = this.handleDigestive(a)); break;
      case 'RESPIRATORY': ({ response, recommendations: rec } = this.handleRespiratory(a)); break;
      case 'INFECTION': ({ response, recommendations: rec } = this.handleInfection(a)); break;
      default: response = this.getClarificationPrompt();
    }
    this.addMessage('assistant', response);
    if (rec) this.showRecommendations(rec);
    this.updateProgress();
  }

  getCategoryPrompt(a){
    const map = {
      pain: `I understand you're experiencing pain. Please share: location, type (sharp/dull), severity (1-10), onset, triggers.`,
      digestive: `Digestive issue detected. Please share: specific symptoms, severity, duration, triggers/foods.`,
      respiratory: `Respiratory symptoms. Please share: cough/runny nose/shortness of breath, duration, known allergies/asthma.`,
      infection: `Possible infection/fever. Please share: temperature, duration, other notable symptoms.`
    };
    return map[a.primaryCategory] || this.getClarificationPrompt();
  }
  getClarificationPrompt(){
    return `Please describe your main symptom with details (body part, severity, duration). Example: "I have a headache and nausea."`;
  }

  handlePain(a){
    let response = 'For pain management, please clarify location/type/severity and triggering factors.';
    let recommendations = null;
    if (a.symptoms.includes('headache')){
      recommendations = { type:'headache', recommendations:['Acetaminophen 500-1000mg','Ibuprofen 400mg'], warnings:['Avoid exceeding labeled dose'], instructions:'Hydration and rest are helpful.' };
      response = 'Headache noted. Any visual changes, nausea, or history of hypertension? Rate pain 1-10.';
    }
    return { response, recommendations };
  }
  handleDigestive(a){
    let response = 'Digestive concern. Please specify (nausea, diarrhea, cramps) and duration.';
    let recommendations = null;
    if (a.symptoms.includes('nausea')){
      recommendations = { type:'nausea', recommendations:['Oral rehydration','Ginger tea'], warnings:['Watch for dehydration'], instructions:'Small sips of clear fluids.' };
      response = 'Nausea noted. Any vomiting/fever? Able to keep fluids?';
    }
    return { response, recommendations };
  }
  handleRespiratory(a){
    let response = 'Respiratory concern. Describe breathing difficulty and duration.';
    let recommendations = null;
    if (a.symptoms.includes('cough')){
      recommendations = { type:'cough', recommendations:['Honey (adults/children >1y)','Steam inhalation'], warnings:['If shortness of breath/chest pain, seek care'], instructions:'Hydration and rest.' };
      response = 'Cough noted. Any fever or shortness of breath?';
    }
    return { response, recommendations };
  }
  handleInfection(a){
    let response = 'Possible infection. Share temperature, duration, and other symptoms.';
    let recommendations = null;
    if (a.symptoms.includes('fever')){
      recommendations = { type:'fever', recommendations:['Acetaminophen per label','Fluids and rest'], warnings:['High fever >103°F needs medical advice'], instructions:'Monitor temperature every 4-6 hours.' };
      response = 'Fever noted. Any rash, sore throat, or cough?';
    }
    return { response, recommendations };
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
    for (let i = this.conversationHistory.length-1; i>=0; i--){ const a=this.conversationHistory[i].analysis; if (a?.symptoms?.length) return a.symptoms[0]; }
    return null;
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
