(() => {
const cfg=window.BF_DB;
const client=supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,detectSessionInUrl:true}});
const $=s=>document.querySelector(s);
let allRows=[];

function avg(arr,key){const v=arr.map(r=>Number(r[key])).filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null}
function fmt(n,d=2){return n==null?"—":Number(n).toFixed(d).replace(".",",")}
function pct(a,b){return b?Math.round(a/b*100):0}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}

async function login(email){
  if(email.toLowerCase()!=="celian.nissen@etu.uca.fr") throw new Error("Adresse non autorisée");
  const redirectTo=location.origin+location.pathname;
  const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo}});
  if(error) throw error;
}
async function logout(){await client.auth.signOut();location.reload()}

async function loadData(){
  const {data,error}=await client.from("survey_responses").select("*").order("created_at",{ascending:false});
  if(error) throw error;
  allRows=data||[];
  render();
}
function render(){
  const rows=allRows, A=rows.filter(r=>r.variant==="A"), B=rows.filter(r=>r.variant==="B");
  $("#kpiTotal").textContent=rows.length;
  $("#kpiA").textContent=A.length; $("#kpiB").textContent=B.length;
  $("#kpiControl").textContent=rows.length?pct(rows.filter(r=>r.control_correct).length,rows.length)+"%":"—";
  $("#kpiIntent").textContent=fmt(avg(rows,"intent_initial"),2);
  $("#kpiAge").textContent=fmt(avg(rows,"age"),1);

  const ma=avg(A,"intent_initial"), mb=avg(B,"intent_initial");
  $("#meanA").textContent=fmt(ma,2); $("#meanB").textContent=fmt(mb,2);
  $("#barA").style.width=((ma||0)/5*100)+"%"; $("#barB").style.width=((mb||0)/5*100)+"%";
  if(ma!=null&&mb!=null){
    const delta=mb-ma;
    $("#abDelta").textContent=`Écart B – A : ${delta>=0?"+":""}${fmt(delta,2)} point(s) d’intention moyenne. À interpréter seulement avec un effectif suffisant.`;
  } else $("#abDelta").textContent="Pas encore assez de réponses dans les deux groupes pour comparer A et B.";

  const metrics=[["Valeur","perceived_value"],["Qualité","perceived_quality"],["Confiance","perceived_trust"]];
  $("#perceptionGrid").innerHTML=metrics.map(([l,k])=>`<div><span>${l}</span><strong>${fmt(avg(rows,k),2)} / 5</strong></div>`).join("");

  const vw=[["Trop bon marché","p_too_cheap"],["Bonne affaire","p_cheap"],["Cher mais acceptable","p_expensive"],["Trop cher","p_too_expensive"]];
  $("#vwList").innerHTML=vw.map(([l,k])=>`<div class="vw-row"><span>${l}</span><b>${fmt(avg(rows,k),2)} €</b></div>`).join("");

  const statuses=["Etudiant","Jeune actif","Autre"];
  $("#statusList").innerHTML=statuses.map(s=>{const n=rows.filter(r=>r.status===s).length;return `<div class="status-row"><span>${s}</span><b>${n} · ${pct(n,rows.length)}%</b></div>`}).join("");
  renderTable();
}
function renderTable(){
  const vf=$("#variantFilter").value,sf=$("#statusFilter").value,q=$("#searchInput").value.toLowerCase();
  const rows=allRows.filter(r=>(!vf||r.variant===vf)&&(!sf||r.status===sf)&&(!q||JSON.stringify(r).toLowerCase().includes(q)));
  $("#responsesBody").innerHTML=rows.map(r=>`<tr>
    <td>${new Date(r.created_at).toLocaleString("fr-FR")}</td><td>${esc(r.variant)}</td><td>${esc(r.initial_price)} €</td><td>${esc(r.age)}</td><td>${esc(r.status)}</td>
    <td>${esc(r.intent_initial)}/5</td><td>${esc(r.followup_price)} €</td><td>${esc(r.intent_followup)}/5</td>
    <td>${esc(r.p_too_cheap)} €</td><td>${esc(r.p_cheap)} €</td><td>${esc(r.p_expensive)} €</td><td>${esc(r.p_too_expensive)} €</td>
    <td>${r.control_correct?"✓":"✕"}</td><td>${esc(r.qualitative_reason)}</td></tr>`).join("");
}
function exportCSV(){
  const cols=["created_at","variant","initial_price","age","status","intent_initial","followup_price","intent_followup","p_too_cheap","p_cheap","p_expensive","p_too_expensive","control_correct","qualitative_reason","perceived_value","perceived_quality","perceived_trust"];
  const csv=[cols.join(";"),...allRows.map(r=>cols.map(c=>`"${String(r[c]??"").replaceAll('"','""')}"`).join(";"))].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="basicfit_reponses.csv";a.click();URL.revokeObjectURL(a.href);
}

$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();$("#loginMsg").textContent="Envoi du lien…";try{await login($("#email").value.trim());$("#loginMsg").textContent="Lien envoyé. Ouvre l’e-mail UCA puis clique sur le lien de connexion."}catch(err){$("#loginMsg").textContent=err.message}});
$("#logoutBtn").addEventListener("click",logout);
$("#refreshBtn").addEventListener("click",loadData);
$("#exportBtn").addEventListener("click",exportCSV);
["variantFilter","statusFilter"].forEach(id=>$("#"+id).addEventListener("change",renderTable));
$("#searchInput").addEventListener("input",renderTable);

client.auth.onAuthStateChange(async(_event,session)=>{
  const email=session?.user?.email?.toLowerCase();
  const ok=email==="celian.nissen@etu.uca.fr";
  $("#loginView").classList.toggle("hidden",ok);
  $("#dashboardView").classList.toggle("hidden",!ok);
  $("#logoutBtn").classList.toggle("hidden",!ok);
  $("#refreshBtn").classList.toggle("hidden",!ok);
  if(ok){try{await loadData()}catch(e){alert("Impossible de charger les réponses : "+e.message)}}
  else if(session){await client.auth.signOut()}
});
})();