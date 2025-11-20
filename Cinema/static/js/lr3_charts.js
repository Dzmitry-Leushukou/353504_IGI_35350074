
(function(){
  const canvas = document.getElementById("chart");
  if(!canvas) return;
  let chart;
  const ctx = canvas.getContext("2d");
  function parseCoefs(str){ return (str||"").split(",").map(s=>{ try{ return eval(s.trim()); }catch{ return 0; } }); }
  function seriesValue(x, coefs, terms=coefs.length){ let s=0, pow=1; for(let k=0;k<terms;k++){ s += (coefs[k]||0) * pow; pow *= x; } return s; }
  function build(){
    const fnExpr = document.getElementById("fn-expr").value;
    const f = new Function("x", `return (${fnExpr});`);
    const coefs = parseCoefs(document.getElementById("series-coefs").value);
    const xmin = parseFloat(document.getElementById("xmin").value)||-3.14;
    const xmax = parseFloat(document.getElementById("xmax").value)||3.14;
    const N = 200;
    const xs = Array.from({length:N}, (_,i)=> xmin + (xmax-xmin)*i/(N-1));
    const fnY = xs.map(x=> f(x));
    const serY = xs.map(x=> seriesValue(x, coefs));
    if(chart) chart.destroy();
    chart = new Chart(ctx, { type: "line",
      data: { labels: xs, datasets: [ {label:"Math F(x)", data: fnY, fill:false, borderWidth:2}, {label:"F(x) — сумма ряда", data: serY, fill:false, borderWidth:2} ] },
      options: { animation:{duration:800}, plugins:{ legend:{display:true}, title:{display:true, text:"Функция и разложение в ряд"}}, scales:{ x:{title:{display:true,text:"x"}}, y:{title:{display:true,text:"y"}} } } });
  }
  document.getElementById("plot-btn").onclick = build;
  document.getElementById("save-btn").onclick = ()=>{ if(!chart) return; const url = chart.toBase64Image(); const a = document.createElement("a"); a.href = url; a.download = "chart.png"; a.click(); };
  document.getElementById("copy-btn").onclick = ()=>{
    const params = {
      fn: document.getElementById("fn-expr").value,
      coefs: document.getElementById("series-coefs").value,
      xmin: document.getElementById("xmin").value,
      xmax: document.getElementById("xmax").value,
    };
    navigator.clipboard?.writeText(JSON.stringify(params)).then(()=>{
      alert("Параметры скопированы в буфер обмена.");
    }).catch(()=>{});
  };
  build();
})();
