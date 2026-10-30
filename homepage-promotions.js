import {db} from "./firebase-config.js";
import {collection,getDocs,query,where,limit} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today=new Date().toISOString().slice(0,10);
async function loadStories(){
 const target=document.getElementById("homepageTransformations");if(!target)return;
 try{
  const snap=await getDocs(query(collection(db,"publicStudentSuccessStories"),where("published","==",true),limit(6)));
  const rows=snap.docs.map(d=>d.data());
  if(!rows.length)return;
  target.innerHTML=rows.map(x=>{const delta=Number(x.afterScore)-Number(x.beforeScore);return `<div class="col-md-6 col-lg-4"><article class="roadmap-card h-100"><div class="d-flex justify-content-between align-items-center"><span class="roadmap-tag">${esc(x.course)} journey</span><i class="bi bi-patch-check-fill text-info"></i></div><h3 class="h5 mt-3">${esc(x.studentName)}</h3><div class="small pv-muted">Assessment score</div><div class="d-flex align-items-end gap-3 my-3"><div><div class="small pv-muted">Before</div><strong class="fs-3">${Number(x.beforeScore)||0}%</strong></div><i class="bi bi-arrow-right text-info fs-4 mb-1"></i><div><div class="small pv-muted">After</div><strong class="fs-3 text-info">${Number(x.afterScore)||0}%</strong></div></div><div class="small text-success fw-semibold">${delta>=0?"+":""}${delta} percentage points</div><div class="small pv-muted mt-2">Problems solved: ${Number(x.beforeProblems)||0} → ${Number(x.afterProblems)||0}</div>${x.quote?`<p class="small mt-3 mb-0">“${esc(x.quote)}”</p>`:""}</article></div>`}).join("");
 }catch(e){console.warn("Public student stories are not available yet.",e);}
}
async function loadPromotions(){
 const target=document.getElementById("homepagePromotions");if(!target)return;
 try{
  const snap=await getDocs(query(collection(db,"publicPromotions"),where("published","==",true),limit(8)));
  const rows=snap.docs.map(d=>d.data()).filter(p=>p.startDate<=today&&p.endDate>=today);
  if(!rows.length)return;
  target.innerHTML=rows.map(p=>`<div class="col-md-6 col-lg-4"><article class="roadmap-card h-100"><div class="roadmap-icon"><i class="bi bi-stars"></i></div><span class="roadmap-tag">${esc(p.course)} challenge</span><h3 class="h5 mt-3">${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="small pv-muted">Reward: ${esc(p.reward||"Recognition")}</div><div class="small pv-muted mt-2">${esc(p.startDate)} – ${esc(p.endDate)}</div><a href="login.html" class="btn btn-outline-mint btn-sm mt-3">Join in Pyvanta</a></article></div>`).join("");
 }catch(e){console.warn("Public promotions are not available yet.",e);}
}
loadStories();loadPromotions();
