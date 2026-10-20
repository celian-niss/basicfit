document.addEventListener("DOMContentLoaded",()=>{const points=[...document.querySelectorAll(".plot-point")],filters=[...document.querySelectorAll(".chart-filter")],name=document.getElementById("detailName"),price=document.getElementById("detailPrice"),score=document.getElementById("detailScore"),text=document.getElementById("detailText");if(!points.length)return;function show(p){points.forEach(x=>x.classList.toggle("selected",x===p));name.textContent=p.dataset.name;price.textContent=p.dataset.price;score.textContent=p.dataset.score;text.textContent=p.dataset.detail}function filter(brand){filters.forEach(b=>b.classList.toggle("active",b.dataset.brand===brand));points.forEach(p=>{const keep=brand==="all"||p.dataset.brand===brand;p.classList.toggle("dimmed",!keep);p.classList.toggle("hidden-label",!keep)});if(brand!=="all"){const p=points.find(x=>x.dataset.brand===brand);if(p)show(p)}}points.forEach(p=>{p.addEventListener("mouseenter",()=>show(p));p.addEventListener("focus",()=>show(p));p.addEventListener("click",()=>show(p))});filters.forEach(b=>b.addEventListener("click",()=>filter(b.dataset.brand)));});
document.addEventListener("DOMContentLoaded",()=>{
  const toggle=document.querySelector(".nav-toggle");
  const nav=document.querySelector(".main-nav");
  const groups=[...document.querySelectorAll(".nav-group")];
  if(!toggle||!nav)return;

  const closeGroups=(except=null)=>{
    groups.forEach(g=>{
      if(g!==except){
        g.classList.remove("is-open");
        g.querySelector(".nav-group-trigger")?.setAttribute("aria-expanded","false");
      }
    });
  };

  toggle.addEventListener("click",()=>{
    const open=nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded",String(open));
    if(!open)closeGroups();
  });

  groups.forEach(group=>{
    const trigger=group.querySelector(".nav-group-trigger");
    trigger?.addEventListener("click",(e)=>{
      e.stopPropagation();
      const willOpen=!group.classList.contains("is-open");
      closeGroups(group);
      group.classList.toggle("is-open",willOpen);
      trigger.setAttribute("aria-expanded",String(willOpen));
    });
  });

  nav.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener("click",()=>{
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded","false");
    closeGroups();
  }));

  document.addEventListener("click",(e)=>{
    if(!e.target.closest(".nav")) closeGroups();
  });

  window.addEventListener("resize",()=>{
    if(window.innerWidth>980){
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded","false");
      closeGroups();
    }
  });
});