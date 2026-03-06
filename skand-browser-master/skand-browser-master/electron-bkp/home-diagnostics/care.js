// Nearby specialist helper
(function(){
  function categoryToQuery(c){
    switch((c||'').toLowerCase()){
      case 'pain': return 'pain clinic near me';
      case 'digestive': return 'gastroenterologist near me';
      case 'respiratory': return 'pulmonologist near me';
      case 'infection': return 'urgent care near me';
      default: return 'primary care physician near me';
    }
  }
  function openMapsSearch(query, lat, lng){ const q=encodeURIComponent(query); if(lat!=null&&lng!=null){ window.open(`https://www.google.com/maps/search/?api=1&query=${q}&center=${lat},${lng}`,'_blank'); } else { window.open(`https://www.google.com/maps/search/${q}`,'_blank'); } }
  function findSpecialistNearby(category){ const q=categoryToQuery(category); if (navigator.geolocation){ navigator.geolocation.getCurrentPosition(p=>openMapsSearch(q,p.coords.latitude,p.coords.longitude),()=>openMapsSearch(q)); } else { openMapsSearch(q); } }
  window.findCare = { findSpecialistNearby };
})();
