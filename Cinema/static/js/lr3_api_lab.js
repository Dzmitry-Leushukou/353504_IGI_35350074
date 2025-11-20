
(function(){
  const geoBtn = document.getElementById("geo-btn");
  const shareBtn = document.getElementById("share-btn");
  const out = document.getElementById("geo-result");
  if(geoBtn){
    geoBtn.onclick = ()=>{
      if(!navigator.geolocation){ out.textContent = "Геолокация не поддерживается."; return; }
      out.textContent = "Определяем координаты...";
      navigator.geolocation.getCurrentPosition(pos=>{
        const {latitude, longitude} = pos.coords;
        out.textContent = `Широта: ${latitude.toFixed(6)}, долгота: ${longitude.toFixed(6)}`;
      }, err=>{ out.textContent = "Не удалось получить координаты: " + err.message; });
    };
  }
  if(shareBtn){
    shareBtn.onclick = async ()=>{
      try{
        if(navigator.share){
          await navigator.share({title:"Лаборатория", text:"Смотри ЛР3 на сайте кинотеатра", url: location.href});
        } else {
          alert("Web Share API не поддерживается — используйте копирование ссылки.");
        }
      } catch(e){}
    };
  }
})();
