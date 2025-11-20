
(function(){
  const listEl = document.getElementById("parcels-list");
  const resultEl = document.getElementById("calc-result");
  const form = document.getElementById("parcel-form");
  const modeSel = document.getElementById("oop-mode");
  if(!form) return;
  function dAdd(days){ const d=new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }
  let data = [
    {sender:"Иванов", recipient:"Петров", weight: 1.2, date: dAdd(-5)},
    {sender:"Сидоров", recipient:"Петров", weight: 0.8, date: dAdd(-20)},
    {sender:"Иванов", recipient:"Смирнова", weight: 2.0, date: dAdd(-40)},
    {sender:"Павлов", recipient:"Кузнецов", weight: 3.1, date: dAdd(-3)},
    {sender:"Рогов", recipient:"Петров", weight: 0.5, date: dAdd(-15)},
  ];
  function renderList(){
    listEl.innerHTML = `<table class="table table-sm"><thead><tr>
      <th>Отправитель</th><th>Получатель</th><th>Вес, кг</th><th>Дата</th></tr></thead>
      <tbody>${data.map(r=>`<tr><td>${r.sender}</td><td>${r.recipient}</td><td>${r.weight}</td><td>${r.date}</td></tr>`).join("")}</tbody></table>`;
  }
  function ParcelList(){ this.items = []; }
  ParcelList.prototype.add = function(obj){ this.items.push(obj); };
  ParcelList.prototype._lastMonth = function(){ const now=new Date(); const monthAgo=new Date(now); monthAgo.setMonth(now.getMonth()-1); return this.items.filter(p => new Date(p.date) >= monthAgo); };
  ParcelList.prototype.calc = function(){
    const just = this._lastMonth();
    const map = new Map(); for(const p of just){ map.set(p.recipient, (map.get(p.recipient)||0) + 1); }
    const result=[]; for(const [rec,c] of map.entries()){ if(c>=2){ const tw = just.filter(p=>p.recipient===rec).reduce((s,p)=>s+Number(p.weight||0),0); result.push({recipient:rec, count:c, totalWeight:+tw.toFixed(3)}); } }
    return result;
  };
  class ParcelListBase { constructor(){ this.items=[]; } add(o){ this.items.push(o); } }
  class ParcelListExtended extends ParcelListBase {
    _lastMonth(){ const now=new Date(); const monthAgo=new Date(now); monthAgo.setMonth(now.getMonth()-1); return this.items.filter(p => new Date(p.date) >= monthAgo); }
    calc(){ const just=this._lastMonth(); const byRec = just.reduce((a,p)=>{(a[p.recipient]=a[p.recipient]||[]).push(p); return a;},{}); return Object.entries(byRec).filter(([,arr])=>arr.length>=2).map(([recipient,arr])=>({recipient, count:arr.length, totalWeight:+arr.reduce((s,p)=>s+Number(p.weight||0),0).toFixed(3)})); }
  }
  let store = new ParcelList(); let store2 = new ParcelListExtended();
  data.forEach(x=>{ store.add(x); store2.add(x); });
  renderList();
  form.addEventListener("submit", (e)=>{ e.preventDefault(); const fd=new FormData(form); const row={ sender:fd.get("sender"), recipient:fd.get("recipient"), weight:parseFloat(fd.get("weight")||"0"), date:fd.get("date") }; (modeSel.value==="proto"?store:store2).add(row); data.push(row); renderList(); form.reset(); });
  document.getElementById("calc-btn").onclick = ()=>{ const res=(modeSel.value==="proto"?store:store2).calc(); resultEl.textContent = res.length? res.map(r=>`${r.recipient}: ${r.count} шт., общий вес ${r.totalWeight} кг`).join("\\n") : "Получателей с несколькими посылками за последний месяц не найдено."; };
})();
