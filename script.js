(function(){
  const FRAME_COUNT = 122;
  const FPS = 30;

  const video = document.getElementById('scrubVideo');
  const wrapper = document.getElementById('scrollVideo');
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPct = document.getElementById('loaderPct');
  const scrollHint = document.getElementById('scrollHint');
  const heroStill = document.getElementById('heroStill');
  const panels = Array.from(document.querySelectorAll('.panel'));
  const panelState = panels.map(() => -1);

  let ready = false;
  let ticking = false;
  let scrollMax = 1;
  let duration = 0;
  let lastFrame = -1;
  let seeking = false;
  let pendingFrame = -1;
  let stillOn = true;

  function setLoader(pct, text){
    if(loaderFill) loaderFill.style.width = pct + '%';
    if(loaderPct) loaderPct.textContent = text || `A carregar a cabana… ${pct}%`;
  }

  function measure(){
    scrollMax = Math.max(1, wrapper.offsetHeight - window.innerHeight);
    duration = video.duration || FRAME_COUNT / FPS;
  }

  function getProgress(){
    return Math.min(1, Math.max(0, window.scrollY / scrollMax));
  }

  function showStill(on){
    if(on === stillOn) return;
    stillOn = on;
    if(heroStill) heroStill.style.visibility = on ? 'visible' : 'hidden';
  }

  function seekTo(frame){
    const t = Math.min(duration - 0.001, Math.max(0, frame / FPS));
    if(seeking){
      pendingFrame = frame;
      return;
    }
    lastFrame = frame;
    seeking = true;
    video.currentTime = t;
  }

  function applyScrub(progress){
    if(progress < 0.012){
      showStill(true);
      lastFrame = 0;
      return;
    }
    showStill(false);
    const frame = Math.min(FRAME_COUNT - 1, (progress * (FRAME_COUNT - 1) + 0.5) | 0);
    if(frame === lastFrame) return;
    seekTo(frame);
  }

  function updatePanels(progress){
    panels.forEach((p, i) => {
      const start = parseFloat(p.dataset.start);
      const end = parseFloat(p.dataset.end);
      const fade = 0.04;
      let opacity = 0;
      if(progress >= start && progress <= end){
        const fadeIn = start <= 0 ? 1 : Math.min(1, (progress - start) / fade);
        const fadeOut = Math.min(1, (end - progress) / fade);
        opacity = Math.min(fadeIn, fadeOut);
      }
      const key = (opacity * 40) | 0;
      if(panelState[i] === key) return;
      panelState[i] = key;
      p.style.opacity = opacity;
      p.classList.toggle('is-on', opacity > 0.45);
    });
    if(scrollHint) scrollHint.style.opacity = progress < 0.03 ? 1 : 0;
  }

  function onScroll(){
    if(ticking || !ready) return;
    ticking = true;
    requestAnimationFrame(() => {
      const progress = getProgress();
      applyScrub(progress);
      updatePanels(progress);
      ticking = false;
    });
  }

  function openScrub(){
    if(ready) return;
    ready = true;
    video.pause();
    measure();
    video.style.opacity = '1';
    showStill(true);
    setLoader(100);
    if(loader){
      loader.classList.add('hidden');
      setTimeout(() => loader && loader.remove(), 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    onScroll();
  }

  video.addEventListener('seeked', () => {
    seeking = false;
    if(pendingFrame >= 0 && pendingFrame !== lastFrame){
      const f = pendingFrame;
      pendingFrame = -1;
      seekTo(f);
    } else {
      pendingFrame = -1;
    }
  });
  video.addEventListener('progress', () => {
    if(!video.duration) return;
    let end = 0;
    for(let i = 0; i < video.buffered.length; i++) end = Math.max(end, video.buffered.end(i));
    setLoader(Math.min(99, Math.round((end / video.duration) * 100)));
  });
  video.addEventListener('loadeddata', openScrub, { once: true });
  video.addEventListener('error', () => setLoader(0, 'Não foi possível carregar a cabana.'));

  setLoader(8);
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = 'images/scrub.mp4';
  video.load();
})();
