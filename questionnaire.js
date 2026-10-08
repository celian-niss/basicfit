(() => {
const $=(s)=>document.querySelector(s), $$=(s)=>[...document.querySelectorAll(s)];
const startedAt=Date.now();
const responseId=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now());
const storedVariant=sessionStorage.getItem("bf_variant");
const variant=storedVariant || (Math.random()<.5?"A":"B");
sessionStorage.setItem("bf_variant",variant);
const initialPrice=variant==="A"?24.99:27.99;
let current=1, initialIntent=null, dynamicPrice=null;

const panels=$$(".q-panel");
function show(step){
  current=step;
  panels.forEach(p=>p.classList.toggle("is-active",Number(p.dataset.step)===step));
  const visibleStep=Math.min(step,6);
  const pct=Math.round(visibleStep/6*100);
  $("#progressLabel").textContent=step===7?"Terminé":`Étape ${visibleStep} sur 6`;
  $("#progressPct").textContent=step===7?"100%":pct+"%";
  $("#progressBar").style.width=(step===7?100:pct)+"%";
  window.scrollTo({top:0,behavior:"smooth"});
}
function radio(name){return document.querySelector(`input[name="${name}"]:checked`)?.value||""}
function error(n,msg=""){$("#error"+n).textContent=msg}
function money(n){return Number(Number(n).toFixed(2))}
$("#displayPrice").textContent=initialPrice.toFixed(2).replace(".",",")+" €";

function validate1(){
  const age=Number($("#age").value), loc=radio("location");
  if(age<18||age>30) return error(1,"Cette étude est réservée aux personnes de 18 à 30 ans."),false;
  if(loc!=="oui") return error(1,"Cette étude cible les personnes qui résident, étudient ou travaillent dans l’agglomération clermontoise."),false;
  if(!$("#consent").checked) return error(1,"Votre consentement est nécessaire pour participer."),false;
  error(1); return true;
}
function validate2(){
  const v=radio("intent1"); if(!v)return error(2,"Sélectionnez votre intention de souscription."),false;
  initialIntent=Number(v);
  dynamicPrice=initialIntent<=2?19.99:29.99;
  $("#branchPrice").textContent=dynamicPrice.toFixed(2).replace(".",",")+" € / 4 semaines";
  $("#branchQuestion").textContent=initialIntent<=2
    ?"Imaginez maintenant que l’abonnement soit proposé à un tarif plus bas. Votre intention change-t-elle ?"
    :"Imaginez maintenant que l’abonnement atteigne le repère tarifaire des concurrents directs. Votre intention change-t-elle ?";
  error(2);return true;
}
function validate3(){if(!radio("intent2"))return error(3,"Sélectionnez votre intention pour ce second scénario."),false;error(3);return true}
function validate4(){
  const vals=[+$("#pTooCheap").value,+$("#pCheap").value,+$("#pExpensive").value,+$("#pTooExpensive").value];
  if(vals.some(v=>!Number.isFinite(v)||v<=0))return error(4,"Renseignez les quatre montants."),false;
  if(!(vals[0]<vals[1]&&vals[1]<vals[2]&&vals[2]<vals[3]))return error(4,"Les montants doivent progresser : trop bon marché < bonne affaire < cher < trop cher."),false;
  error(4);return true;
}
function setReason(){
  const reject=initialIntent<=2;
  $("#reasonReject").classList.toggle("is-hidden",!reject);
  $("#reasonAccept").classList.toggle("is-hidden",reject);
  $$('input[name="reason"]').forEach(x=>x.checked=false);
}
function validate5(){
  if(!radio("controlPrice"))return error(5,"Répondez à la question de contrôle."),false;
  if(!radio("reason"))return error(5,"Sélectionnez la raison principale."),false;
  if(!$("#valuePerceived").value||!$("#qualityPerceived").value||!$("#trustPerceived").value)return error(5,"Répondez aux trois affirmations de perception."),false;
  error(5);return true;
}
function validate6(){if(!radio("status"))return error(6,"Indiquez votre situation principale."),false;error(6);return true}

$$("[data-next]").forEach(btn=>btn.addEventListener("click",()=>{
  const s=Number(btn.dataset.next);
  const ok=s===1?validate1():s===2?validate2():s===3?validate3():s===4?validate4():validate5();
  if(ok){if(s===4)setReason();show(s+1)}
}));
$$("[data-back]").forEach(btn=>btn.addEventListener("click",()=>show(Number(btn.dataset.back)-1)));

async function submit(){
  if(!validate6())return;
  const payload={
    response_id:responseId,
    variant,
    initial_price:initialPrice,
    age:Number($("#age").value),
    location_clermont:true,
    consent:true,
    intent_initial:Number(radio("intent1")),
    followup_price:dynamicPrice,
    intent_followup:Number(radio("intent2")),
    p_too_cheap:money($("#pTooCheap").value),
    p_cheap:money($("#pCheap").value),
    p_expensive:money($("#pExpensive").value),
    p_too_expensive:money($("#pTooExpensive").value),
    control_price:radio("controlPrice"),
    control_correct:radio("controlPrice")===initialPrice.toFixed(2),
    qualitative_reason:radio("reason"),
    perceived_value:Number($("#valuePerceived").value),
    perceived_quality:Number($("#qualityPerceived").value),
    perceived_trust:Number($("#trustPerceived").value),
    status:radio("status"),
    completion_ms:Date.now()-startedAt,
    submitted_at:new Date().toISOString()
  };
  const btn=$("#submitSurvey");btn.disabled=true;btn.textContent="Enregistrement…";
  try{
    if(!window.BF_DB?.url||!window.BF_DB?.key) throw new Error("database_not_configured");
    const res=await fetch(window.BF_DB.url+"/rest/v1/survey_responses",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "apikey":window.BF_DB.key,
        "Prefer":"return=minimal"
      },
      body:JSON.stringify(payload)
    });
    if(!res.ok)throw new Error("db_"+res.status);
    sessionStorage.removeItem("bf_variant");
    show(7);
  }catch(e){
    btn.disabled=false;btn.innerHTML='Envoyer mes réponses <span>→</span>';
    error(6,"L’enregistrement n’est pas encore disponible. Merci de réessayer dans quelques instants.");
    console.error(e);
  }
}
$("#submitSurvey").addEventListener("click",submit);
})();