import sys

with open('/home/hriday/intuitive-simple-apps/src-tauri/src/home-diagnostics/script.js', 'r') as f:
    lines = f.readlines()

new_logic = """
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
"""

new_latest_symptom = """
  getLatestSymptom(){
    for (let i = this.conversationHistory.length-1; i>=0; i--){
      const input = this.conversationHistory[i].input;
      if (input.includes('headache') || input.includes('pain') || input.includes('nausea') || input.includes('fever')) return input;
    }
    return 'headache';
  }
"""

# Original code has `processInput` starting at line 86 (index 85).
# `handleInfection` ends at line 185 (index 184).
lines_to_keep_before = lines[:85]
lines_to_keep_after_1 = lines[185:280]
lines_to_keep_after_2 = lines[284:]

new_content = "".join(lines_to_keep_before) + new_logic + "".join(lines_to_keep_after_1) + new_latest_symptom + "".join(lines_to_keep_after_2)

with open('/home/hriday/intuitive-simple-apps/src-tauri/src/home-diagnostics/script.js', 'w') as f:
    f.write(new_content)
print("Pached successfully!")
