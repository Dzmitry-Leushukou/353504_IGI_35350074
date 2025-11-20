
(function(){
  const geoBtn = document.getElementById("geo-btn");
  const speakBtn = document.getElementById("speak-btn");
  const out = document.getElementById("geo-result");

  geoBtn.onclick = ()=>{
    if(!navigator.geolocation){ out.textContent = "Геолокация не поддерживается."; return; }
    out.textContent = "Определяем координаты...";
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude, longitude} = pos.coords;
      out.textContent = `Широта: ${latitude.toFixed(6)}, долгота: ${longitude.toFixed(6)}`;
    }, err=>{
      out.textContent = "Не удалось получить координаты: " + err.message;
    });
  };

  speakBtn.onclick = ()=>{
    const text = "Добро пожаловать в наш кинотеатр!";
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    speechSynthesis.speak(u);
  };
})();
