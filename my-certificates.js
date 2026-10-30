import { db } from "./firebase-config.js";
import { requireRole } from "./auth.js";
import { collection, getDocs, query, where, doc, addDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function showError(msg){$("certStatus").className="alert alert-danger";$("certStatus").textContent=msg;$("certStatus").classList.remove("d-none");}
async function downloadCertificate(id,x){
  if(!window.jspdf?.jsPDF)return alert("Certificate PDF library is unavailable. Please reload and try again.");
  const {jsPDF}=window.jspdf, pdf=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
  pdf.setFillColor(11,13,18);pdf.rect(0,0,297,210,"F");pdf.setDrawColor(139,92,246);pdf.setLineWidth(1.5);pdf.rect(9,9,279,192);
  pdf.setTextColor(34,211,238);pdf.setFont("helvetica","bold");pdf.setFontSize(15);pdf.text("PYVANTA",148.5,35,{align:"center"});
  pdf.setTextColor(245,247,255);pdf.setFontSize(28);pdf.text("CERTIFICATE OF ACHIEVEMENT",148.5,58,{align:"center"});
  pdf.setFont("helvetica","normal");pdf.setFontSize(13);pdf.text("This certificate is proudly presented to",148.5,78,{align:"center"});
  pdf.setFont("helvetica","bold");pdf.setFontSize(25);pdf.text(String(x.studentName||"Student"),148.5,96,{align:"center"});
  pdf.setFont("helvetica","normal");pdf.setFontSize(14);pdf.text(`For successfully completing ${x.course}`,148.5,113,{align:"center"});
  pdf.setFontSize(12);pdf.text(`${x.level||"Achievement"} Level`,148.5,128,{align:"center"});
  pdf.setFontSize(10);pdf.text(`Completion date: ${x.completionDate||"—"}`,148.5,148,{align:"center"});
  pdf.text(`Certificate ID: ${id}`,148.5,160,{align:"center"});
  const verify=new URL(`verify-certificate.html?id=${encodeURIComponent(id)}`,location.href).href;
  pdf.setFontSize(8);pdf.text(`Verify: ${verify}`,148.5,174,{align:"center"});
  try {
    const holder=document.createElement("div");holder.style.cssText="position:absolute;left:-9999px;top:-9999px";
    document.body.appendChild(holder);new QRCode(holder,{text:verify,width:128,height:128,correctLevel:QRCode.CorrectLevel.M});
    await new Promise(resolve=>setTimeout(resolve,80));
    const canvas=holder.querySelector("canvas");if(canvas)pdf.addImage(canvas.toDataURL("image/png"),"PNG",252,163,24,24);
    holder.remove();
  } catch(error){console.warn("QR image could not be added to certificate PDF.",error);}
  pdf.save(`${id}.pdf`);
}
async function render(uid){
 const snap=await getDocs(query(collection(db,"certificates"),where("uid","==",uid)));
 const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.status==="issued");
 $("certificateList").innerHTML=rows.length?rows.map(x=>`<div class="col-md-6"><article class="cert h-100"><div class="d-flex justify-content-between"><span class="text-info small">PYVANTA CERTIFICATE</span><i class="bi bi-award fs-3 text-warning"></i></div><h3 class="h4 mt-3">${esc(x.course)}</h3><div class="muted">${esc(x.level)} achievement</div><div class="mt-3 fw-semibold">${esc(x.studentName)}</div><div class="small muted mt-1">Completed: ${esc(x.completionDate)}</div><div class="small muted">ID: ${esc(x.id)}</div><div class="d-flex flex-wrap gap-2 mt-4"><button class="btn btn-pv btn-sm" data-download="${esc(x.id)}">Download PDF</button><a class="btn btn-outline-light btn-sm" href="verify-certificate.html?id=${encodeURIComponent(x.id)}">Verify certificate</a><a class="btn btn-outline-info btn-sm" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(new URL(`verify-certificate.html?id=${encodeURIComponent(x.id)}`,location.href).href)}">Share</a></div></article></div>`).join(""):'<div class="col-12"><div class="cert muted">No certificates have been issued to your account yet. Keep learning and check back here.</div></div>';
 document.querySelectorAll("[data-download]").forEach(b=>b.addEventListener("click",()=>{const x=rows.find(r=>r.id===b.dataset.download);downloadCertificate(x.id,x);}));
 const ps=await getDocs(query(collection(db,"publicPromotions"),where("published","==",true)));
 const pointsSnap=await getDoc(doc(db,"studentPoints",uid));
 const pointsData=pointsSnap.exists()?pointsSnap.data():{};
 const points=Number(pointsData.points||0),codingCount=Array.isArray(pointsData.completedCodingQuestionIds)?pointsData.completedCodingQuestionIds.length:0;
 const now=new Date().toISOString().slice(0,10),active=ps.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.startDate<=now&&p.endDate>=now);
 $("promotionList").innerHTML=active.length?active.map(p=>{
  const current=p.metric==="points"?points:p.metric==="codingProblems"?codingCount:0;
  const target=Math.max(1,Number(p.targetValue)||1),progress=p.metric==="none"?null:Math.min(100,Math.round(current/target*100)),eligible=progress!==null&&current>=target;
  const progressMarkup=p.metric==="none"?"<div class='small muted mt-2'>Reward eligibility is reviewed by the Pyvanta admin.</div>":`<div class="small mt-2">${esc(p.metric==="points"?"Learning Points":"Coding problems")}: ${current} / ${target}</div><div class="progress mt-2" style="height:7px;background:#30394b"><div class="progress-bar" style="width:${progress}%;background:linear-gradient(90deg,#8b5cf6,#22d3ee)"></div></div><div class="small ${eligible?"text-success":"muted"} mt-1">${eligible?"Target reached · pending admin reward approval":"Keep going to reach the reward target"}</div>`;
  return `<div class="col-md-6"><article class="cert h-100"><span class="small text-info">${esc(p.course)} CHALLENGE</span><h3 class="h5 mt-2">${esc(p.title)}</h3><p class="muted">${esc(p.description)}</p><div class="small">Reward: ${esc(p.reward||"Recognition")}</div>${progressMarkup}<div class="small muted mt-2">${esc(p.startDate)} – ${esc(p.endDate)}</div><button class="btn btn-outline-info btn-sm mt-3" data-join="${esc(p.id)}">Join challenge</button></article></div>`;
 }).join(""):'<div class="col-12 muted">No active promotions right now. New challenges will appear here.</div>';
 document.querySelectorAll("[data-join]").forEach(b=>b.addEventListener("click",async()=>{try{
  const existing=await getDocs(query(collection(db,"promotionEntries"),where("promotionId","==",b.dataset.join),where("uid","==",uid)));
  if(existing.empty) await addDoc(collection(db,"promotionEntries"),{promotionId:b.dataset.join,uid,status:"joined",joinedAt:serverTimestamp()});
  b.disabled=true;b.textContent="Joined";
 }catch(e){if(e.code==="permission-denied")alert("Could not join. Please refresh and try again.");else alert(e.message);}}));
}
requireRole("student",async(user)=>{try{await render(user.uid)}catch(e){console.error(e);showError(e.message||"Unable to load certificates.");}});
