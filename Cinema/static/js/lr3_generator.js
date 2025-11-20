
(function(){
  const STORAGE_KEY = "lr3_gen_text_inputs_v16";
  const toggle = document.getElementById("toggle-create");
  const list = document.getElementById("generated-list");

  function uid(){ return "el_"+Math.random().toString(36).slice(2); }
  function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||[];}catch{ return []; } }
  function save(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

  function render(){
    const items = load();
    list.innerHTML = "";
    items.forEach((cfg, idx)=> list.appendChild(renderCard(cfg, idx)));
  }

  function renderCard(cfg, idx){
    const col = document.createElement("div");
    col.className = "col-md-6";
    const ro = cfg.readonly ? "checked":"";
    const de = cfg.disabled ? "checked":"";
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <div class="mb-2"><input class="form-control preview" ${cfg.readonly?"readonly":""} ${cfg.disabled?"disabled":""}
               name="${cfg.name||""}" placeholder="${cfg.placeholder||""}" maxlength="${cfg.maxlength||""}" value="${cfg.value||""}"></div>

          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label">name</label><input class="form-control in-name" value="${cfg.name||""}"></div>
            <div class="col-6"><label class="form-label">placeholder</label><input class="form-control in-placeholder" value="${cfg.placeholder||""}"></div>
            <div class="col-6"><label class="form-label">maxlength</label><input type="number" min="1" class="form-control in-maxlength" value="${cfg.maxlength||""}"></div>
            <div class="col-6"><label class="form-label">value</label><input class="form-control in-value" value="${cfg.value||""}"></div>
          </div>

          <div class="form-check form-switch mb-2">
            <input class="form-check-input in-readonly" type="checkbox" ${ro} id="${cfg.id}_ro">
            <label class="form-check-label" for="${cfg.id}_ro">readonly</label>
          </div>
          <div class="form-check form-switch mb-3">
            <input class="form-check-input in-disabled" type="checkbox" ${de} id="${cfg.id}_dis">
            <label class="form-check-label" for="${cfg.id}_dis">disabled</label>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-apply">Применить</button>
            <button class="btn btn-outline-danger btn-remove">Удалить</button>
          </div>
        </div>
      </div>
    `;

    const preview = col.querySelector(".preview");
    const inName = col.querySelector(".in-name");
    const inPh = col.querySelector(".in-placeholder");
    const inMax = col.querySelector(".in-maxlength");
    const inVal = col.querySelector(".in-value");
    const inRO = col.querySelector(".in-readonly");
    const inDis = col.querySelector(".in-disabled");

    function apply(){
      const items = load();
      const cur = items.find(x=>x.id===cfg.id);
      if(!cur) return;
      cur.name = inName.value;
      cur.placeholder = inPh.value;
      cur.maxlength = inMax.value;
      cur.value = inVal.value;
      cur.readonly = inRO.checked;
      cur.disabled = inDis.checked;
      save(items);
      preview.name = cur.name||"";
      preview.placeholder = cur.placeholder||"";
      preview.maxLength = Number(cur.maxlength||0) || 524288;
      preview.value = cur.value||"";
      preview.toggleAttribute("readonly", !!cur.readonly);
      preview.toggleAttribute("disabled", !!cur.disabled);
    }

    col.querySelector(".btn-apply").onclick = apply;
    col.querySelector(".btn-remove").onclick = ()=>{
      const items = load().filter(x=>x.id!==cfg.id);
      save(items); render();
    };

    return col;
  }

  toggle.addEventListener("change", ()=>{
    if(toggle.checked){
      const items = load();
      items.push({id: uid(), name:"", placeholder:"", maxlength:"", value:"", readonly:false, disabled:false});
      save(items);
      toggle.checked = false;
      render();
    }
  });

  render();
})();
