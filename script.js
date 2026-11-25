document.addEventListener("DOMContentLoaded",()=>{
  const nav=document.getElementById("mainNav");
  const toggle=document.querySelector(".nav-toggle");
  const links=[...(nav?.querySelectorAll('a[href^="#"]')||[])];

  if(toggle&&nav){
    toggle.addEventListener("click",()=>{
      const open=nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded",String(open));
    });
    links.forEach(a=>a.addEventListener("click",()=>{
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded","false");
    }));
    document.addEventListener("click",e=>{
      if(!e.target.closest(".nav")){
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded","false");
      }
    });
    window.addEventListener("resize",()=>{
      if(window.innerWidth>900){
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded","false");
      }
    });
  }

  const progress=document.getElementById("scrollProgress");
  const updateProgress=()=>{
    if(!progress)return;
    const max=document.documentElement.scrollHeight-window.innerHeight;
    const pct=max>0?(window.scrollY/max)*100:0;
    progress.style.width=Math.min(100,Math.max(0,pct))+"%";
  };
  updateProgress();
  window.addEventListener("scroll",updateProgress,{passive:true});
  window.addEventListener("resize",updateProgress);

  const sections=["entreprise","marche","mesure","scenario","recommandation","sources"]
    .map(id=>document.getElementById(id)).filter(Boolean);
  if("IntersectionObserver" in window && sections.length){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting)
        .sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+(visible.target.id==="recommandation"?"scenario":visible.target.id)));
    },{rootMargin:"-30% 0px -60% 0px",threshold:[0,.15,.4]});
    sections.forEach(s=>observer.observe(s));
  }

  drawVanWestendorp();
  initDecisionSimulator();
});

function drawVanWestendorp(){
  const svg=document.getElementById("vwChart");
  if(!svg)return;

  const data=[
    [10,95,99,1,1],[11,88,99,1,1],[12,81,99,1,1],[13,69,98,1,1],[14,57,98,1,1],
    [15,47,98,1,1],[16,24,94,2,1],[17,14,92,2,1],[18,10,86,2,1],[19,4,75,2,1],
    [20,4,64,2,1],[21,1,37,2,2],[22,1,26,2,2],[23,1,15,2,2],[24,1,7,3,2],
    [25,1,3,9,2],[26,0,1,16,2],[27,0,1,22,2],[28,0,0,26,2],[29,0,0,37,2],
    [30,0,0,62,4],[31,0,0,70,6],[32,0,0,75,7],[33,0,0,82,10],[34,0,0,85,12],
    [35,0,0,94,15],[36,0,0,97,23],[37,0,0,98,28],[38,0,0,98,37],[39,0,0,98,45],
    [40,0,0,99,61],[41,0,0,100,73],[42,0,0,100,80],[43,0,0,100,83],[44,0,0,100,87],[45,0,0,100,93]
  ];

  const W=760,H=420,pad={l:46,r:20,t:24,b:32};
  const x=p=>pad.l+(p-10)/(45-10)*(W-pad.l-pad.r);
  const y=v=>pad.t+(100-v)/100*(H-pad.t-pad.b);
  const ns="http://www.w3.org/2000/svg";
  const el=(name,attrs={})=>{
    const n=document.createElementNS(ns,name);
    Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));
    return n;
  };

  while(svg.firstChild)svg.removeChild(svg.firstChild);

  const bg=el("rect",{x:pad.l,y:pad.t,width:W-pad.l-pad.r,height:H-pad.t-pad.b,rx:10,fill:"#faf8f5"});
  svg.appendChild(bg);

  [0,25,50,75,100].forEach(v=>{
    const line=el("line",{x1:pad.l,y1:y(v),x2:W-pad.r,y2:y(v),stroke:"#e4dfd8","stroke-width":"1"});
    svg.appendChild(line);
    const txt=el("text",{x:pad.l-10,y:y(v)+4,"text-anchor":"end",fill:"#8b847d","font-size":"11"});
    txt.textContent=v+"%";svg.appendChild(txt);
  });

  [10,20,30,40,45].forEach(v=>{
    const line=el("line",{x1:x(v),y1:pad.t,x2:x(v),y2:H-pad.b,stroke:"#efeae4","stroke-width":"1"});
    svg.appendChild(line);
  });

  const zone=el("rect",{x:x(21),y:pad.t,width:x(25.5)-x(21),height:H-pad.t-pad.b,fill:"rgba(243,111,33,.08)"});
  svg.appendChild(zone);

  const series=[
    {idx:1,color:"#d87b45"},
    {idx:2,color:"#e3aa2c"},
    {idx:3,color:"#4a7188"},
    {idx:4,color:"#943d31"}
  ];
  series.forEach(s=>{
    const d=data.map((r,i)=>(i?"L":"M")+x(r[0]).toFixed(1)+" "+y(r[s.idx]).toFixed(1)).join(" ");
    svg.appendChild(el("path",{d,fill:"none",stroke:s.color,"stroke-width":"3","stroke-linejoin":"round","stroke-linecap":"round"}));
  });

  [
    {p:21,label:"≈ 21 €",sub:"borne basse"},
    {p:24,label:"≈ 24 €",sub:"repère"},
    {p:25.5,label:"≈ 25,5 €",sub:"borne haute"}
  ].forEach((m,i)=>{
    const gx=x(m.p);
    svg.appendChild(el("line",{x1:gx,y1:pad.t,x2:gx,y2:H-pad.b,stroke:"#f36f21","stroke-width":"1.5","stroke-dasharray":"5 5"}));
    const box=el("rect",{x:gx-36,y:30+i*33,width:72,height:28,rx:8,fill:"#181818"});
    svg.appendChild(box);
    const t=el("text",{x:gx,y:48+i*33,"text-anchor":"middle",fill:"#fff","font-size":"10","font-weight":"700"});
    t.textContent=m.label;svg.appendChild(t);
  });

  [
    {p:24.99,label:"24,99 €",y:338},
    {p:27.99,label:"27,99 €",y:366}
  ].forEach(m=>{
    const gx=x(m.p);
    svg.appendChild(el("line",{x1:gx,y1:pad.t,x2:gx,y2:H-pad.b,stroke:"#181818","stroke-width":"1","stroke-dasharray":"2 5",opacity:".6"}));
    const t=el("text",{x:gx+5,y:m.y,fill:"#181818","font-size":"11","font-weight":"800"});
    t.textContent=m.label;svg.appendChild(t);
  });
}

function initDecisionSimulator(){
  const ids=["price","drop","cost","budget"];
  const controls=Object.fromEntries(ids.map(id=>[id,document.getElementById("sim-"+id)]));
  if(ids.some(id=>!controls[id]))return;
  const eur=new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"});
  const pct=new Intl.NumberFormat("fr-FR",{maximumFractionDigits:2});
  const set=(id,value)=>{const el=document.getElementById("sim-"+id);if(el)el.textContent=value;};
  function update(){
    const price=Number(controls.price.value),drop=Number(controls.drop.value),cost=Number(controls.cost.value),budget=Number(controls.budget.value);
    const base=100*13*(24.99/1.2-cost),capacity=100*13*(price/1.2-cost);
    const net=capacity*(1-drop/100)-base-budget;
    const threshold=100*(1-(base+budget)/capacity);
    set("drop-label",pct.format(drop)+" %");set("cost-label",eur.format(cost));set("budget-label",eur.format(budget));
    set("net",(net>0?"+":"")+eur.format(net));set("base",eur.format(base));
    set("threshold",threshold<0?"Aucune (volume en hausse requis)":pct.format(threshold)+" %");
    const verdict=document.getElementById("sim-verdict");
    verdict.textContent=net>=0?"Scénario favorable ou à l’équilibre selon ces hypothèses.":"Scénario défavorable : contribution nette inférieure à la référence.";
    verdict.classList.toggle("sim-positive",net>=0);verdict.classList.toggle("sim-negative",net<0);
    document.getElementById("sim-net").className=net>=0?"sim-positive":"sim-negative";
  }
  ids.forEach(id=>controls[id].addEventListener("input",update));update();
}
