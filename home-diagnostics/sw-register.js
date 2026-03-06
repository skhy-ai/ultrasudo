(function(){
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./service-worker.js').catch(console.error); });
  }
  let deferredPrompt=null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault(); deferredPrompt=e; const b=document.getElementById('install-button'); if (b) b.style.display='inline-flex';
  });
  window.requestAppInstall = async function(){ if (!deferredPrompt) return; deferredPrompt.prompt(); const { outcome }=await deferredPrompt.userChoice; deferredPrompt=null; const b=document.getElementById('install-button'); if (b) b.style.display='none'; return outcome; };
})();
