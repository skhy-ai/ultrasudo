// Natural remedies dataset
(function(){
  const remedies = {
    'headache': [
      { title:'Hydration', detail:'Drink 1-2 glasses of water.' },
      { title:'Ginger tea', detail:'Grated ginger steeped in hot water may reduce nausea.' },
      { title:'Peppermint oil', detail:'Dilute and apply to temples for tension relief.' }
    ],
    'abdominal pain': [
      { title:'Warm compress', detail:'Apply warm compress for 15-20 minutes.' },
      { title:'Chamomile tea', detail:'May relax digestive muscles and reduce cramps.' }
    ],
    'nausea': [
      { title:'Ginger', detail:'Ginger tea or small ginger candies.' },
      { title:'Mint tea', detail:'Peppermint may soothe the stomach.' }
    ],
    'cough': [
      { title:'Honey', detail:'A spoon of honey can soothe cough (not for <1 year).'},
      { title:'Steam inhalation', detail:'Steam loosens mucus.'}
    ]
  };
  function getRemediesFor(symptom){ if(!symptom) return []; const s=symptom.toLowerCase(); for(const k of Object.keys(remedies)){ if (s.includes(k) || k.includes(s)) return remedies[k]; } return []; }
  window.naturalRemedies = { getRemediesFor };
})();
