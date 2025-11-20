
(function(){
  const API = "/api/movies/";
  const grid = document.getElementById("catalog");
  const pager = document.getElementById("catalog-pager");
  const perSel = document.getElementById("per-page");

  let items = [];
  let page = 1;
  function perPage(){ return Number(perSel.value)||3; }

  function card(m){
    return `
    <div class="col-sm-6 col-lg-4">
      <div class="card card-3d h-100">
        <div class="inner card-body d-flex flex-column">
          <img src="${m.poster||'https://placehold.co/400x600'}" class="img-fluid mb-2 rounded" alt="Постер">
          <h5 class="card-title"><a href="/movies/${m.id}/" class="stretched-link text-decoration-none">${m.title}</a></h5>
          <p class="flex-grow-1" style="color:var(--card-text)">${m.desc||''}</p>
          <div class="mt-auto"><span class="badge bg-primary">от ${Number(m.price||0).toFixed(2)} BYN</span></div>
        </div>
      </div>
    </div>`;
  }

  function render(){
    const start = (page-1)*perPage();
    const chunk = items.slice(start, start+perPage());
    grid.innerHTML = chunk.map(card).join("");
    const pages = Math.max(1, Math.ceil(items.length / perPage()));
    pager.innerHTML = "";
    for(let i=1;i<=pages;i++){
      const li = document.createElement("li");
      li.className = "page-item"+(i===page?" active":"");
      li.innerHTML = `<a href="#" class="page-link">${i}</a>`;
      li.onclick = (e)=>{ e.preventDefault(); page=i; render(); };
      pager.appendChild(li);
    }
  }

  async function load(){
    const res = await fetch(API);
    const data = await res.json();
    items = data.movies || [];
    if(items.length < 10){
      const need = 10 - items.length;
      for(let i=0;i<need;i++){
        items.push({id:1000+i, title:`Фильм ${i+1}`, price:10+i, poster:'', desc:'Заполнитель'});
      }
    }
    render();
  }

  perSel.onchange = ()=>{ page=1; render(); };
  load();
})();
