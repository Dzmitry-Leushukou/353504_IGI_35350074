
(function(){
  const btn = document.getElementById("age-btn");
  const out = document.getElementById("age-result");
  if(!btn) return;
  const days = ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"];
  function calcAge(d){
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }
  btn.onclick = ()=>{
    const v = document.getElementById("birth").value;
    if(!v){ out.textContent = "Введите дату."; return; }
    const d = new Date(v+"T00:00:00");
    const age = calcAge(d);
    if(age < 18){
      alert("Вам нет 18. Необходимо разрешение родителей на использование сайта.");
      out.textContent = "";
      return;
    }
    out.textContent = `Вам ${age} лет. День недели: ${days[d.getDay()]}.`;
  };
})();
