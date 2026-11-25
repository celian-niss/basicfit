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
      if(!visible||document.body.classList.contains("chapter-mode"))return;
      links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+(visible.target.id==="recommandation"?"scenario":visible.target.id)));
    },{rootMargin:"-30% 0px -60% 0px",threshold:[0,.15,.4]});
    sections.forEach(s=>observer.observe(s));
  }

  drawVanWestendorp();
  initDecisionSimulator();
  initChapters();
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
  const slider=document.getElementById("vw-price");
  if(slider){
    const guide=el("line",{x1:x(27),x2:x(27),y1:pad.t,y2:H-pad.b,stroke:"#17212d","stroke-width":2,"stroke-dasharray":"4 3"});
    svg.appendChild(guide);
    const update=()=>{
      const p=Number(slider.value),row=data.find(r=>r[0]===p);
      if(!row)return;
      guide.setAttribute("x1",x(p));guide.setAttribute("x2",x(p));
      document.getElementById("vw-selected").textContent=p+" €";
      const target=document.getElementById("vw-reading");target.replaceChildren();
      ["Trop bon marché","Bonne affaire","Cher","Trop cher"].forEach((name,i)=>{const s=document.createElement("span");s.textContent=name+" : "+row[i+1]+" %";target.appendChild(s);});
    };slider.addEventListener("input",update);update();
  }
}

function initDecisionSimulator(){
  const price=document.getElementById("sim-price"),drop=document.getElementById("sim-drop"),svg=document.getElementById("riskChart");
  if(!price||!drop||!svg)return;
  const eur=new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}),num=new Intl.NumberFormat("fr-FR",{maximumFractionDigits:2});
  const set=(id,value)=>{const el=document.getElementById("sim-"+id);if(el)el.textContent=value;};
  function update(){
    const p=Number(price.value),d=Number(drop.value),q=100-d,base=100*13*24.99/1.2,next=q*13*p/1.2,delta=next-base,threshold=100*(1-24.99/p);
    set("drop-label","−"+num.format(d)+" %");set("net",(delta>0?"+":"")+eur.format(delta));set("threshold",num.format(threshold)+" %");set("volume",num.format(q)+" / 100");set("base",eur.format(base));set("new",eur.format(next));set("new-formula",num.format(q)+" × 13 × ("+num.format(p)+" / 1,20)");set("difference",eur.format(delta));set("threshold-formula","(1 − 24,99 / "+num.format(p)+") × 100");set("threshold-detail",num.format(threshold)+" %");
    const verdict=document.getElementById("sim-verdict");
    verdict.textContent=delta>=0?"Le revenu récurrent est préservé dans ce scénario.":"Le revenu récurrent diminue dans ce scénario.";
    verdict.classList.toggle("sim-positive",delta>=0);verdict.classList.toggle("sim-negative",delta<0);document.getElementById("sim-net").className=delta>=0?"sim-positive":"sim-negative";
    document.querySelectorAll("[data-drop]").forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.drop)===d)));
    const f=v=>100*(1-v/100)*13*p/1.2-base,lo=Math.min(-1000,f(50)*1.08),hi=Math.max(1000,f(0)*1.18),x=v=>66+v/50*550,y=v=>15+(hi-v)/(hi-lo)*244;
    const ns="http://www.w3.org/2000/svg";svg.replaceChildren();const el=(tag,attrs,txt)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(txt!=null)n.textContent=txt;svg.appendChild(n);return n;};
    el("rect",{x:66,y:15,width:550,height:y(0)-15,fill:"#edf7f1",rx:3});el("rect",{x:66,y:y(0),width:550,height:259-y(0),fill:"#fff1ed",rx:3});
    [0,10,20,30,40,50].forEach(v=>{el("line",{x1:x(v),x2:x(v),y1:15,y2:259,stroke:"#dce1e8"});el("text",{x:x(v),y:281,"text-anchor":"middle","font-size":12,fill:"#56616e"},v+" %");});
    [Math.ceil(lo/1000)*1000,0,Math.floor(hi/1000)*1000].filter((v,i,a)=>a.indexOf(v)===i).forEach(v=>{el("line",{x1:66,x2:616,y1:y(v),y2:y(v),stroke:v===0?"#526171":"#dce1e8","stroke-dasharray":v===0?"4 3":"none"});el("text",{x:61,y:y(v)+4,"text-anchor":"end","font-size":11,fill:"#56616e"},num.format(v)+" €");});
    el("path",{d:"M "+x(0)+" "+y(f(0))+" L "+x(50)+" "+y(f(50)),stroke:"#e96319","stroke-width":3,fill:"none"});el("line",{x1:x(threshold),x2:x(threshold),y1:15,y2:259,stroke:"#526171","stroke-dasharray":"4 4"});el("circle",{cx:x(threshold),cy:y(0),r:5,fill:"#526171"});el("circle",{cx:x(d),cy:y(delta),r:7,fill:delta>=0?"#146747":"#a33f25",stroke:"white","stroke-width":2});
    svg.setAttribute("aria-label","Écart de revenu "+eur.format(delta)+" pour "+num.format(d)+" % de baisse. Seuil "+num.format(threshold)+" %.");
  }
  price.addEventListener("change",update);drop.addEventListener("input",update);document.querySelectorAll("[data-drop]").forEach(b=>b.addEventListener("click",()=>{drop.value=b.dataset.drop;update();}));update();
}
function initChapters(){
  const main=document.querySelector("main"),rail=document.querySelector(".chapter-rail"),all=document.getElementById("read-all");
  if(!main||!rail||!all)return;
  const panels=[...main.children].filter(x=>x.tagName==="SECTION");
  const ids=["top","entreprise","marche","mesure","scenario","sources"],labels=["Accueil","Finances","Concurrence","Prix psychologique","Proposition","Sources"];
  let full=false;
  function targetId(){const id=decodeURIComponent(location.hash.slice(1))||"top";if(id==="recommandation")return "scenario";if(ids.includes(id))return id;const target=document.getElementById(id);return target?.closest("main > section")?.id||"top";}
  function render(){
    const id=targetId();document.body.classList.toggle("chapter-mode",!full);document.body.classList.remove("home-view");
    panels.forEach((p,i)=>{const pid=p.id||"top";p.hidden=!full&&!(pid===id||(id==="scenario"&&pid==="recommandation"));});
    rail.querySelectorAll("[data-chapter]").forEach(a=>{if(a.dataset.chapter===id)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});document.querySelectorAll("#mainNav a[href^='#']").forEach(a=>{const active=a.getAttribute("href")==="#"+id;a.classList.toggle("active",active);if(active)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
    all.textContent=full?"Lire par chapitre":"Afficher tout le dossier";
    if(!full){const anchor=location.hash.slice(1);requestAnimationFrame(()=>{if(anchor==="recommandation"||(!ids.includes(anchor)&&anchor)){document.getElementById(anchor)?.scrollIntoView();}else window.scrollTo(0,0);});}
  }
  panels.forEach(p=>{
    const id=p.id||"top";if(id==="scenario"||id==="top")return;
    const i=ids.indexOf(id==="recommandation"?"scenario":id),wrap=p.querySelector(":scope > .wrap:last-child");if(i<0||!wrap)return;
    const nav=document.createElement("nav");nav.className="chapter-next";nav.setAttribute("aria-label","Navigation entre chapitres");
    if(i>0){const a=document.createElement("a");a.href="#"+ids[i-1];a.textContent="← "+labels[i-1];nav.appendChild(a);}
    if(i<ids.length-1){const a=document.createElement("a");a.href="#"+ids[i+1];a.textContent=labels[i+1]+" →";nav.appendChild(a);}
    wrap.appendChild(nav);
  });
  all.addEventListener("click",()=>{full=!full;render();});window.addEventListener("hashchange",render);render();
}
