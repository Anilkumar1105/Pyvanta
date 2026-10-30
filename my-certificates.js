import { db } from "./firebase-config.js";
import { requireRole } from "./auth.js";
import { getActiveSubscription } from "./subscription-access.js";
import { getStudentSubmissions, getExamsByIds } from "./student.js";
import { collection, getDocs, query, where, doc, addDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MIN_EXAMS=5,MIN_AVERAGE=70;
const localWalletKey=uid=>`pyvanta_local_certificates_${uid}`;
function readLocalCertificates(uid){try{return JSON.parse(localStorage.getItem(localWalletKey(uid))||"[]");}catch{return [];}}
function saveLocalCertificate(uid,certificate){const rows=readLocalCertificates(uid).filter(x=>!(x.course===certificate.course));rows.unshift(certificate);localStorage.setItem(localWalletKey(uid),JSON.stringify(rows.slice(0,20)));}
function achievementLevel(avg){if(avg>=95)return "Platinum";if(avg>=90)return "Gold";if(avg>=80)return "Silver";return "Bronze";}
function makeLocalCertificateId(){const token=globalThis.crypto?.randomUUID?.().replaceAll("-","").slice(0,10).toUpperCase()||Math.random().toString(36).slice(2,12).toUpperCase();return `PV-LOCAL-${new Date().getFullYear()}-${token}`;}
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
  if(Number.isFinite(Number(x.performanceAverage)))pdf.setFontSize(10),pdf.text(`Exam average: ${Number(x.performanceAverage)}%  |  Completed exams: ${Number(x.completedExamCount)||0}`,148.5,139,{align:"center"});
  pdf.setFontSize(10);pdf.text(`Completion date: ${x.completionDate||"—"}`,148.5,150,{align:"center"});
  pdf.text(`Certificate ID: ${id}`,148.5,160,{align:"center"});
  if(x.localOnly){
    pdf.setTextColor(255,190,90);pdf.setFont("helvetica","bold");pdf.setFontSize(9);
    pdf.text("BROWSER-GENERATED COPY - NOT PUBLICLY VERIFIED",148.5,176,{align:"center"});
    pdf.setTextColor(205,214,230);pdf.setFont("helvetica","normal");pdf.setFontSize(8);
    pdf.text("Generated from the student's visible Pyvanta exam records. This copy is not an independently verified credential.",148.5,183,{align:"center"});
  } else {
    const verify=new URL(`verify-certificate.html?id=${encodeURIComponent(id)}`,location.href).href;
    pdf.setFontSize(8);pdf.text(`Verify: ${verify}`,148.5,174,{align:"center"});
    try {
      const holder=document.createElement("div");holder.style.cssText="position:absolute;left:-9999px;top:-9999px";
      document.body.appendChild(holder);new QRCode(holder,{text:verify,width:128,height:128,correctLevel:QRCode.CorrectLevel.M});
      await new Promise(resolve=>setTimeout(resolve,80));
      const canvas=holder.querySelector("canvas");if(canvas)pdf.addImage(canvas.toDataURL("image/png"),"PNG",252,163,24,24);
      holder.remove();
    } catch(error){console.warn("QR image could not be added to certificate PDF.",error);}
  }
  pdf.save(`${id}.pdf`);
}
async function loadCertificateRequests(uid){
 const snap=await getDocs(query(collection(db,"certificateRequests"),where("uid","==",uid)));
 const rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.requestedAt?.seconds||0)-(a.requestedAt?.seconds||0));
 $("certificateRequestList").innerHTML=rows.length?rows.map(r=>`<div class="col-md-6"><article class="cert py-3"><div class="d-flex justify-content-between gap-2"><strong>${esc(r.course)} certificate</strong><span class="badge text-bg-success">${esc((r.status||"issued").toUpperCase())}</span></div><div class="small muted mt-2">${Number(r.completedExamCount)||0} completed exams · Average ${Number(r.performanceAverage)||0}%</div>${r.certificateId?`<a class="btn btn-sm btn-outline-info mt-2" href="verify-certificate.html?id=${encodeURIComponent(r.certificateId)}">Verify certificate</a>`:""}</article></div>`).join(" "):'<div class="col-12 muted">No certificate requests yet.</div>';
}
async function submitCertificateRequest(uid,user){
 const course=$("requestCourse").value;
 const button=$("certificateRequestForm").querySelector('button[type="submit"]');
 button.disabled=true;button.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Checking subscription & performance…';
 try{
  const subscription=await getActiveSubscription(uid);
  if(!subscription||!subscription.plan)throw new Error("An active paid Pyvanta subscription is required to generate a certificate.");
  const submissions=await getStudentSubmissions(uid);
  const examIds=[...new Set(submissions.map(s=>s.examId).filter(Boolean))];
  const exams=await getExamsByIds(examIds);
  const examMap=new Map(exams.map(e=>[e.id,e]));
  const eligibleResults=new Map();
  for(const sub of submissions){
   const status=String(sub.status||"").toLowerCase();
   if(sub.percentage===null||sub.percentage===undefined||sub.percentage==="")continue;
   const percentage=Number(sub.percentage);
   const exam=examMap.get(sub.examId);
   const mappedCourse=String(exam?.course||exam?.subject||"").trim().toLowerCase();
   if(!exam||!['submitted','auto-submitted'].includes(status)||!Number.isFinite(percentage)||mappedCourse!==course.toLowerCase())continue;
   eligibleResults.set(sub.examId,{percentage});
  }
  const results=[...eligibleResults.values()];
  if(results.length<MIN_EXAMS)throw new Error(`You need at least ${MIN_EXAMS} completed ${course} exams. Your current eligible count is ${results.length}.`);
  const average=Math.round(results.reduce((sum,r)=>sum+r.percentage,0)/results.length*100)/100;
  if(average<MIN_AVERAGE)throw new Error(`Your ${course} exam average is ${average}%. You need at least ${MIN_AVERAGE}% to qualify.`);
  const profileSnap=await getDoc(doc(db,"users",uid));
  const profile=profileSnap.exists()?profileSnap.data():{};
  const studentName=profile.name||profile.fullName||user?.displayName||user?.email||"Student";
  const certificate={id:makeLocalCertificateId(),uid,studentName,course,level:achievementLevel(average),completionDate:new Date().toISOString().slice(0,10),status:"local-copy",performanceAverage:average,completedExamCount:results.length,localOnly:true,generatedAt:new Date().toISOString()};
  let savedInThisBrowser=true;
  try{saveLocalCertificate(uid,certificate);}catch(storageError){savedInThisBrowser=false;console.warn("Browser storage unavailable; certificate will download but will not remain in this browser wallet.",storageError);}
  await downloadCertificate(certificate.id,certificate);
  $("certStatus").className="alert alert-success";
  $("certStatus").textContent=`Congratulations! You qualified for ${course}. Your certificate PDF download has started. Average: ${average}%. Completed exams: ${results.length}. ${savedInThisBrowser?"Saved in this browser wallet.":"Browser storage was unavailable, so keep the downloaded PDF."} This browser-generated copy is not publicly verified.`;
  $("certStatus").classList.remove("d-none");
  await renderCertificateWallet(uid);
 }catch(err){
  console.error("Spark-compatible certificate generation failed",err);
  showError((err?.message||"Could not generate your certificate.").replace(/^Firebase: /,""));
 }finally{button.disabled=false;button.innerHTML='<i class="bi bi-award me-1"></i>Check eligibility &amp; download';}
}
async function renderCertificateWallet(uid){
 const snap=await getDocs(query(collection(db,"certificates"),where("uid","==",uid)));
 const official=snap.docs.map(d=>({id:d.id,...d.data(),localOnly:false})).filter(x=>x.status==="issued");
 const local=readLocalCertificates(uid);
 const rows=[...local,...official];
 $("certificateList").innerHTML=rows.length?rows.map(x=>`<div class="col-md-6"><article class="cert h-100"><div class="d-flex justify-content-between"><span class="text-info small">${x.localOnly?"BROWSER-GENERATED COPY":"PYVANTA VERIFIED CERTIFICATE"}</span><i class="bi bi-award fs-3 text-warning"></i></div><h3 class="h4 mt-3">${esc(x.course)}</h3><div class="muted">${esc(x.level)} achievement</div><div class="small text-info mt-1">Average ${Number(x.performanceAverage)||0}% · ${Number(x.completedExamCount)||0} exams</div><div class="mt-3 fw-semibold">${esc(x.studentName)}</div><div class="small muted mt-1">Completed: ${esc(x.completionDate)}</div><div class="small muted">ID: ${esc(x.id)}</div>${x.localOnly?'<div class="small text-warning mt-2">Saved only in this browser. Not publicly verifiable.</div>':''}<div class="d-flex flex-wrap gap-2 mt-4"><button class="btn btn-pv btn-sm" data-download="${esc(x.id)}">Download PDF</button>${!x.localOnly?`<a class="btn btn-outline-light btn-sm" href="verify-certificate.html?id=${encodeURIComponent(x.id)}">Verify certificate</a><a class="btn btn-outline-info btn-sm" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(new URL(`verify-certificate.html?id=${encodeURIComponent(x.id)}`,location.href).href)}">Share</a>`:''}</div></article></div>`).join(""):'<div class="col-12"><div class="cert muted">No certificates yet. Complete at least five exams with a 70% average in Python or SQL while your paid subscription is active.</div></div>';
 document.querySelectorAll("[data-download]").forEach(b=>b.addEventListener("click",()=>{const x=rows.find(r=>r.id===b.dataset.download);if(x)downloadCertificate(x.id,x);}));
}

async function render(uid,user){
 $("certificateRequestForm").addEventListener("submit",async e=>{e.preventDefault();await submitCertificateRequest(uid,user);});
 await loadCertificateRequests(uid);
 await renderCertificateWallet(uid);
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
requireRole("student",async(user)=>{try{await render(user.uid,user)}catch(e){console.error(e);showError(e.message||"Unable to load certificates.");}});
