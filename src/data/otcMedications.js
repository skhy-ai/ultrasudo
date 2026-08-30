/**
 * Centralized OTC Medications & Symptom Triage Data Module
 * Source: Home Diagnostics / symptoms and medicines.txt
 */
export const OTC_MEDICATIONS = [
    { name: "Paracetamol (Acetaminophen)", brand: "Tylenol / Panadol", use: "Pain reliever / fever reducer", symptom: "Headache, fever, minor aches", sideEffects: "Rare liver damage in high doses", warnings: "Avoid with severe liver disease / alcohol use", timing: "With or without food" },
    { name: "Naproxen", brand: "Aleve / Naprosyn", use: "NSAID pain reliever", symptom: "Joint pain, inflammation, menstrual cramps", sideEffects: "Stomach upset, bleeding risk", warnings: "Avoid in 3rd trimester pregnancy, heart disease, ulcers", timing: "Take with food" },
    { name: "Orphenadrine Citrate", brand: "Norflex", use: "Muscle relaxant", symptom: "Muscle spasms, muscle pain", sideEffects: "Drowsiness, dry mouth, blurred vision", warnings: "Caution with glaucoma, urinary retention, elderly", timing: "Take with food" },
    { name: "Hyoscine Butylbromide", brand: "Buscopan", use: "Antispasmodic", symptom: "Abdominal cramps, IBS", sideEffects: "Dry mouth, constipation", warnings: "Avoid with glaucoma, myasthenia gravis, enlarged prostate", timing: "Take 20 mins before meals" },
    { name: "Esomeprazole", brand: "Nexium", use: "Proton pump inhibitor", symptom: "Acid reflux, heartburn, ulcers", sideEffects: "Headache, nausea, B12 deficiency", warnings: "Long-term osteoporosis risk", timing: "Take 30 mins before first meal" },
    { name: "Aluminum / Magnesium Hydroxide", brand: "Maalox / Mylanta", use: "Antacid", symptom: "Heartburn, indigestion", sideEffects: "Constipation or diarrhea", warnings: "Avoid in severe kidney disease", timing: "Take 1-3 hours after meals" },
    { name: "Mefenamic Acid", brand: "Ponstel", use: "NSAID pain reliever", symptom: "Menstrual pain, arthritis", sideEffects: "GI bleeding, kidney stress", warnings: "Avoid in pregnancy, heart disease, bleeding disorders", timing: "Take with food" },
    { name: "Loperamide", brand: "Imodium", use: "Anti-diarrheal", symptom: "Diarrhea", sideEffects: "Constipation, abdominal pain", warnings: "Do not use in bacterial dysentery or high fever", timing: "With or without food" },
    { name: "Simeticone", brand: "Gas-X / Infacol", use: "Anti-gas", symptom: "Bloating, gas pressure", sideEffects: "Rarely any side effects", warnings: "Generally safe for all ages", timing: "Take with meals" },
    { name: "Domperidone", brand: "Motilium", use: "Anti-nausea", symptom: "Nausea, vomiting, slow gastric emptying", sideEffects: "Heart rhythm changes (rare)", warnings: "Avoid in heart conditions or liver disease", timing: "Take 15-30 mins before meals" },
    { name: "Loratadine", brand: "Claritin", use: "Non-drowsy antihistamine", symptom: "Allergies, runny nose, sneezing", sideEffects: "Rare drowsiness, dry mouth", warnings: "Reduce dose in liver disease", timing: "With or without food" },
    { name: "Levocetirizine", brand: "Xyzal", use: "Antihistamine", symptom: "Allergies, hives", sideEffects: "Mild drowsiness", warnings: "Caution in kidney disease", timing: "With or without food" },
    { name: "Dimenhydrinate", brand: "Dramamine", use: "Anti-motion sickness", symptom: "Motion sickness, vertigo, nausea", sideEffects: "Drowsiness, dry mouth", warnings: "Avoid with glaucoma, enlarged prostate", timing: "Take 30 mins before travel" },
    { name: "Tranexamic Acid", brand: "Lysteda", use: "Anti-bleeding", symptom: "Heavy menstrual bleeding", sideEffects: "Nausea, mild cramping", warnings: "Contraindicated in history of blood clots", timing: "Take with food" },
    { name: "Prochlorperazine", brand: "Compazine", use: "Anti-nausea", symptom: "Nausea, severe vertigo", sideEffects: "Drowsiness, movement stiffness", warnings: "Avoid in Parkinson's disease", timing: "With or without food" },
    { name: "Montelukast", brand: "Singulair", use: "Leukotriene receptor antagonist", symptom: "Asthma maintenance, allergic rhinitis", sideEffects: "Mood changes (rare)", warnings: "Monitor for neuropsychiatric changes", timing: "Take in evening" },
    { name: "Chlorpheniramine", brand: "Chlor-Trimeton", use: "Antihistamine", symptom: "Allergies, hay fever", sideEffects: "Drowsiness, dry mouth", warnings: "Avoid while driving or operating machinery", timing: "With or without food" },
    { name: "Eperisone HCl", brand: "Myonal", use: "Muscle relaxant", symptom: "Stiff shoulders, muscle spasticity", sideEffects: "Drowsiness, lightheadedness", warnings: "Caution in liver impairment", timing: "Take after meals" },
    { name: "Norfloxacin", brand: "Noroxin", use: "Fluoroquinolone antibiotic", symptom: "Bacterial UTIs / enteric infections", sideEffects: "Tendon pain, nerve sensations", warnings: "Avoid in pregnancy & young children", timing: "Take on empty stomach" },
    { name: "Enhancin", brand: "Augmentin", use: "Penicillin antibiotic", symptom: "Bacterial respiratory / ear / skin infections", sideEffects: "Mild diarrhea, upset stomach", warnings: "Do not use if allergic to penicillin", timing: "Take at start of meal" },
    { name: "Celecoxib", brand: "Celebrex", use: "COX-2 inhibitor NSAID", symptom: "Arthritis, acute joint pain", sideEffects: "GI discomfort, CV risk", warnings: "Avoid in heart failure / ulcers", timing: "With or without food" },
    { name: "Rabeprazole", brand: "Aciphex", use: "Proton pump inhibitor", symptom: "Acid reflux, GERD, gastric ulcers", sideEffects: "Headache, bowel changes", warnings: "Use short-term for acid suppression", timing: "Take 30 mins before first meal" },
    { name: "Azithromycin", brand: "Zithromax", use: "Macrolide antibiotic", symptom: "Bacterial throat / chest / skin infections", sideEffects: "GI discomfort, mild diarrhea", warnings: "Caution in QT prolongation", timing: "With or without food" },
    { name: "Fluconazole", brand: "Diflucan", use: "Antifungal", symptom: "Fungal / yeast infections", sideEffects: "Headache, elevated liver enzymes", warnings: "Avoid in pregnancy without MD clearance", timing: "With or without food" },
    { name: "Bromhexine", brand: "Bisolvon", use: "Mucolytic expectorant", symptom: "Chest congestion, thick mucus", sideEffects: "Mild stomach irritation", warnings: "Caution with peptic ulcer history", timing: "Take after meals" },
    { name: "Quinodochlor", brand: "Vioform", use: "Topical antiseptic", symptom: "Skin fungal / bacterial infections", sideEffects: "Mild skin irritation", warnings: "Do not apply on open bleeding wounds", timing: "External topical use" },
    { name: "Activated Charcoal", brand: "Charcocaps", use: "Adsorbent", symptom: "Gas, bloating, accidental ingestion", sideEffects: "Black stools, constipation", warnings: "Separate from other meds by 2 hours", timing: "Between meals" },
    { name: "Norethisterone", brand: "Aygestin", use: "Progestin hormone", symptom: "Menstrual delay / irregular bleeding", sideEffects: "Spotting, breast tenderness", warnings: "Avoid in blood clot history or pregnancy", timing: "Take with food" },
    { name: "Prednisolone", brand: "Deltasone", use: "Corticosteroid", symptom: "Severe inflammation / allergic reactions", sideEffects: "Increased appetite, mood elevation", warnings: "Avoid abrupt cessation; consult doctor", timing: "Take with morning food" },
    { name: "Metformin", brand: "Glucophage", use: "Anti-diabetic", symptom: "Blood sugar management", sideEffects: "GI upset, B12 lowering", warnings: "Avoid in severe renal failure", timing: "Take with meals" },
    { name: "Omeprazole", brand: "Prilosec", use: "Proton pump inhibitor", symptom: "Heartburn, acid indigestion", sideEffects: "Headache, flatulence", warnings: "Avoid prolonged unmonitored use", timing: "Take 30 mins before breakfast" }
];

export const COMMON_SYMPTOMS = [
    { label: "Headache & Fever", category: "headache", protocol: "Paracetamol 500-1000mg, Naproxen 250mg, Ibuprofen 400mg" },
    { label: "Muscle Spasms & Back Pain", category: "muscle", protocol: "Orphenadrine 100mg, Eperisone 50mg, Paracetamol" },
    { label: "Acid Reflux & Heartburn", category: "acid", protocol: "Esomeprazole 20mg, Omeprazole, Maalox antacid" },
    { label: "Allergies & Sneezing", category: "allergy", protocol: "Loratadine 10mg, Levocetirizine 5mg, Cetirizine" },
    { label: "Nausea & Motion Sickness", category: "nausea", protocol: "Domperidone 10mg, Dimenhydrinate 50mg, Prochlorperazine" },
    { label: "Diarrhea & Stomach Cramps", category: "digestive", protocol: "Loperamide 2mg, Hyoscine Butylbromide 10mg, ORS" },
    { label: "Bacterial / Skin Infection", category: "infection", protocol: "Azithromycin, Augmentin, Quinodochlor cream" }
];
