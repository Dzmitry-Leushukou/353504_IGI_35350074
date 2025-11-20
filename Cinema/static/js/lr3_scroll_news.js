
(function(){
  const els = document.querySelectorAll("#trophy-stage .trophy");
  if(!els.length) return;
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();
  function onScroll(){
    const h = window.innerHeight;
    els.forEach((el, idx)=>{
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height/2;
      const t = 1 - Math.abs(center - h/2)/(h/2); // 0..1
      const scale = 0.8 + t*0.8 + idx*0.05;
      const rot = (window.scrollY/5 + (idx*120)) % 360;
      el.style.transform = `translateY(${(1-t)*-60}px) scale(${scale}) rotate(${rot}deg)`;
    });
  }
})();
