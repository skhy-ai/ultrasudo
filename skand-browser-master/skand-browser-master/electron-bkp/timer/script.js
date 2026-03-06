(() => {
  let remaining = 0; // in seconds
  let timerId = null;
  const display = document.getElementById('display');
  const hours = document.getElementById('hours');
  const minutes = document.getElementById('minutes');
  const seconds = document.getElementById('seconds');
  const alertEl = document.getElementById('alert');

  function fmt(n){ return String(n).padStart(2,'0'); }
  function updateDisplay(sec){
    const h = Math.floor(sec/3600);
    const m = Math.floor((sec%3600)/60);
    const s = sec%60;
    display.textContent = `${fmt(h)}:${fmt(m)}:${fmt(s)}`;
  }

  function beep(){
    try{
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type='sine'; o.frequency.value=880; g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime+0.05);
      o.start();
      setTimeout(()=>{ g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.2); o.stop(ctx.currentTime+0.25); }, 250);
    }catch(e){}
  }

  function tick(){
    if (remaining <= 0){
      clearInterval(timerId); timerId=null; remaining=0; updateDisplay(remaining);
      alertEl.hidden=false; beep();
      return;
    }
    remaining--; updateDisplay(remaining);
  }

  function setFromInputs(){
    const h = parseInt(hours.value||'0',10);
    const m = parseInt(minutes.value||'0',10);
    const s = parseInt(seconds.value||'0',10);
    remaining = Math.max(0, (h*3600)+(m*60)+s);
    alertEl.hidden=true;
    updateDisplay(remaining);
  }

  document.getElementById('set').onclick = () => { setFromInputs(); };
  document.getElementById('start').onclick = () => {
    if (timerId) return; // already running
    if (remaining<=0) setFromInputs();
    if (remaining<=0) return;
    alertEl.hidden=true;
    timerId = setInterval(tick, 1000);
  };
  document.getElementById('pause').onclick = () => { if (timerId){ clearInterval(timerId); timerId=null; } };
  document.getElementById('reset').onclick = () => { if (timerId){ clearInterval(timerId); timerId=null; } remaining=0; updateDisplay(remaining); alertEl.hidden=true; };

  document.querySelectorAll('.presets button').forEach(b=>{
    b.onclick = () => { remaining = parseInt(b.dataset.preset,10) || 0; updateDisplay(remaining); alertEl.hidden=true; };
  });

  // init
  updateDisplay(0);
})();
