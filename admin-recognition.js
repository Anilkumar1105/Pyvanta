import { auth, db } from "./firebase-config.js";
import { requireRole, wireLogoutButtons } from "./auth.js";
import {
  collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today = new Date().toISOString().slice(0,10);
$("certDate").value = today; $("promoStart").value = today;
$("promoEnd").value = new Date(Date.now()+7*86400000).toISOString().slice(0,10);
let students = [];

function notify(message, type="success") {
  const el=$("status"); el.className=`alert alert-${type}`; el.textContent=message; el.classList.remove("d-none");
  window.scrollTo({top:0,behavior:"smooth"});
}
function optionLabel(s) { return `${s.name || s.email || "Student"}${s.rollNumber ? " · "+s.rollNumber : ""}`; }
async function loadStudents() {
  const snap=await getDocs(collection(db,"users"));
  students=snap.docs.map(d=>({uid:d.id,...d.data()})).filter(s=>s.role==="student");
  for (const id of ["certStudent","storyStudent"]) {
    $(id).innerHTML='<option value="">Select a student</option>'+students.map(s=>`<option value="${esc(s.uid)}">${esc(optionLabel(s))}</option>`).join("");
  }
}
async function loadCertificateRequests() {
  const snap=await getDocs(collection(db,"certificateRequests"));
  const rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.issuedAt?.seconds||b.requestedAt?.seconds||0)-(a.issuedAt?.seconds||a.requestedAt?.seconds||0));
  $("certificateRequestRows").innerHTML=rows.length?rows.map(r=>`<tr><td>${esc(r.studentName||students.find(s=>s.uid===r.uid)?.name||"Student")}</td><td>${esc(r.course)}</td><td class="small">${esc(r.reason||"Automatic performance check")}</td><td class="small">${esc(r.requestDate||"—")}</td><td><span class="badge ${r.status==="issued"?"text-bg-success":"text-bg-secondary"}">${esc((r.status||"issued").toUpperCase())}</span><div class="small muted mt-1">${Number(r.completedExamCount)||0} exams · ${Number(r.performanceAverage)||0}% average</div></td><td>${r.certificateId?`<code>${esc(r.certificateId)}</code>`:"—"}</td></tr>`).join(""):'<tr><td colspan="6" class="muted">No certificate requests yet.</td></tr>';
}
async function loadCertificates() {
  const snap=await getDocs(query(collection(db,"certificates"),orderBy("issuedAt","desc")));
  $("certificateRows").innerHTML=snap.empty?'<tr><td colspan="5" class="muted">No certificates issued yet.</td></tr>':snap.docs.map(d=>{
    const x=d.data(); return `<tr><td>${esc(x.studentName)}</td><td>${esc(x.course)}</td><td><code>${esc(d.id)}</code></td><td><span class="badge ${x.status==="issued"?"text-bg-success":"text-bg-secondary"}">${esc(x.status)}</span></td><td>${x.status==="issued"?`<button class="btn btn-sm btn-outline-warning" data-revoke="${esc(d.id)}">Revoke</button>`:"—"}</td></tr>`;
  }).join("");
  document.querySelectorAll("[data-revoke]").forEach(b=>b.addEventListener("click",()=>revokeCertificate(b.dataset.revoke)));
}
async function revokeCertificate(id) {
  if(!confirm("Revoke this certificate? Its public verification will show as revoked.")) return;
  await updateDoc(doc(db,"certificates",id),{status:"revoked",revokedAt:serverTimestamp()});
  await setDoc(doc(db,"publicCertificates",id),{status:"revoked",updatedAt:serverTimestamp()},{merge:true});
  notify("Certificate revoked."); await loadCertificates();
}
async function loadPromotions() {
  const snap=await getDocs(query(collection(db,"promotions"),orderBy("createdAt","desc")));
  $("promotionRows").innerHTML=snap.empty?"No promotions created yet.":snap.docs.map(d=>{
    const x=d.data(); return `<article class="story-preview"><div class="d-flex justify-content-between gap-2"><strong>${esc(x.title)}</strong><span class="badge ${x.published?"text-bg-success":"text-bg-secondary"}">${x.published?"Published":"Draft"}</span></div><div class="small muted">${esc(x.course)} · ${esc(x.startDate)} to ${esc(x.endDate)}</div><p class="small mb-2 mt-2">${esc(x.description)}</p><div class="d-flex justify-content-between align-items-center"><span class="small muted">Reward: ${esc(x.reward||"Recognition")}</span><button class="btn btn-sm btn-outline-light" data-toggle-promo="${esc(d.id)}" data-published="${x.published?"true":"false"}">${x.published?"Unpublish":"Publish"}</button></div></article>`;
  }).join("");
  document.querySelectorAll("[data-toggle-promo]").forEach(b=>b.addEventListener("click",async()=>{
    const id=b.dataset.togglePromo,makePublic=b.dataset.published!=="true";
    const privateSnap=await getDoc(doc(db,"promotions",id));
    if(!privateSnap.exists()) return notify("Promotion record was not found.","warning");
    const data=privateSnap.data();
    await updateDoc(doc(db,"promotions",id),{published:makePublic,updatedAt:serverTimestamp()});
    if(makePublic) await setDoc(doc(db,"publicPromotions",id),{title:data.title,description:data.description,course:data.course,reward:data.reward||"",metric:data.metric||"none",targetValue:Number(data.targetValue)||1,startDate:data.startDate,endDate:data.endDate,published:true});
    else await deleteDoc(doc(db,"publicPromotions",id));
    await loadPromotions(); notify("Promotion visibility updated.");
  }));
}
async function loadStories() {
  const snap=await getDocs(query(collection(db,"studentSuccessStories"),orderBy("createdAt","desc")));
  $("storyRows").innerHTML=snap.empty?"No student stories added yet.":snap.docs.map(d=>{
    const x=d.data(); return `<article class="story-preview"><div class="d-flex justify-content-between"><strong>${esc(x.studentName)} · ${esc(x.course)}</strong><span class="badge ${x.published?"text-bg-success":"text-bg-secondary"}">${x.published?"Published":"Draft"}</span></div><div class="small muted">Assessment ${x.beforeScore}% → ${x.afterScore}% · Problems ${x.beforeProblems} → ${x.afterProblems}</div>${x.quote?`<p class="small mt-2 mb-2">“${esc(x.quote)}”</p>`:""}<button class="btn btn-sm btn-outline-light mt-2" data-toggle-story="${esc(d.id)}" data-published="${x.published?"true":"false"}">${x.published?"Unpublish":"Publish"}</button></article>`;
  }).join("");
  document.querySelectorAll("[data-toggle-story]").forEach(b=>b.addEventListener("click",async()=>{
    const id=b.dataset.toggleStory,makePublic=b.dataset.published!=="true";
    const privateSnap=await getDoc(doc(db,"studentSuccessStories",id));
    if(!privateSnap.exists()) return notify("Student story record was not found.","warning");
    const data=privateSnap.data();
    await updateDoc(doc(db,"studentSuccessStories",id),{published:makePublic,updatedAt:serverTimestamp()});
    if(makePublic) await setDoc(doc(db,"publicStudentSuccessStories",id),{studentName:data.studentName,course:data.course,beforeScore:data.beforeScore,afterScore:data.afterScore,beforeProblems:data.beforeProblems,afterProblems:data.afterProblems,quote:data.quote||"",published:true});
    else await deleteDoc(doc(db,"publicStudentSuccessStories",id));
    await loadStories(); notify("Student story visibility updated.");
  }));
}
$("certificateForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const uid=$("certStudent").value, student=students.find(s=>s.uid===uid);
  if(!student) return notify("Select a valid student.", "warning");
  if(!$("certConsent").checked) return notify("Confirm that the student agreed to receive the certificate.", "warning");
  if(!$("certEligibility").checked) return notify("Confirm that course completion eligibility has been verified.", "warning");
  const requestId=$("activeCertificateRequest").value;
  const id=`PV-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll("-","").slice(0,10).toUpperCase()}`;
  const record={uid,studentName:student.name||student.email||"Student",course:$("certCourse").value,level:$("certLevel").value,completionDate:$("certDate").value,note:$("certNote").value.trim(),status:"issued",eligibilityVerified:true,studentConsentConfirmed:true,issuedAt:serverTimestamp(),issuedBy:auth.currentUser.uid};
  try {
    if(requestId){
      const requestSnap=await getDoc(doc(db,"certificateRequests",requestId));
      if(!requestSnap.exists()||requestSnap.data().status!=="pending") return notify("This request is no longer pending. Refresh the requests list.","warning");
      if(requestSnap.data().uid!==uid||requestSnap.data().course!==record.course) return notify("The selected student and course must match the certificate request.","warning");
    }
    await setDoc(doc(db,"certificates",id),record);
    await setDoc(doc(db,"publicCertificates",id),{certificateId:id,studentName:record.studentName,course:record.course,level:record.level,completionDate:record.completionDate,status:"issued",issuedAt:serverTimestamp()});
    if(requestId){await updateDoc(doc(db,"certificateRequests",requestId),{status:"approved",certificateId:id,reviewedAt:serverTimestamp(),reviewedBy:auth.currentUser.uid});$("activeCertificateRequest").value="";$("selectedRequestNotice").classList.add("d-none");}
    e.target.reset(); $("certDate").value=today; notify(`Certificate ${id} issued successfully${requestId?" and the student request was approved":""}.`); await Promise.all([loadCertificates(),loadCertificateRequests()]);
  } catch(err){console.error(err);notify(err.message||"Could not issue certificate.","danger");}
});
$("promotionForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const start=$("promoStart").value,end=$("promoEnd").value;
  if(end<start) return notify("End date must be on or after the start date.","warning");
  try{
    const promotion={title:$("promoTitle").value.trim(),description:$("promoDescription").value.trim(),course:$("promoCourse").value,reward:$("promoReward").value.trim(),metric:$("promoMetric").value,targetValue:Math.max(1,Number($("promoTarget").value)||1),startDate:start,endDate:end,published:$("promoPublish").checked,createdAt:serverTimestamp(),createdBy:auth.currentUser.uid};
    const created=await addDoc(collection(db,"promotions"),promotion);
    if(promotion.published) await setDoc(doc(db,"publicPromotions",created.id),{title:promotion.title,description:promotion.description,course:promotion.course,reward:promotion.reward,metric:promotion.metric,targetValue:promotion.targetValue,startDate:promotion.startDate,endDate:promotion.endDate,published:true});
    e.target.reset(); $("promoStart").value=today; $("promoEnd").value=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    await loadPromotions();notify("Promotion created.");
  }catch(err){console.error(err);notify(err.message||"Could not create promotion.","danger");}
});
$("storyForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const uid=$("storyStudent").value,student=students.find(s=>s.uid===uid);
  const before=Number($("storyBefore").value),after=Number($("storyAfter").value);
  if(!student||before<0||before>100||after<0||after>100)return notify("Enter valid student and assessment scores from 0 to 100.","warning");
  if(!$("storyConsent").checked)return notify("Student permission is required before publishing identifying information.","warning");
  try{
    const course=$("storyCourse").value;
    const baselineId=`${uid}_${course.toLowerCase()}_${today}`;
    await setDoc(doc(db,"courseBaselines",baselineId),{uid,course,beforeScore:before,afterScore:after,beforeProblems:Number($("storyBeforeProblems").value)||0,afterProblems:Number($("storyAfterProblems").value)||0,recordedAt:serverTimestamp(),recordedBy:auth.currentUser.uid,source:"admin_verified_assessment_entry"});
    const story={uid,studentName:student.name||"Student",course,beforeScore:before,afterScore:after,beforeProblems:Number($("storyBeforeProblems").value)||0,afterProblems:Number($("storyAfterProblems").value)||0,baselineId,quote:$("storyQuote").value.trim(),consentConfirmed:true,published:$("storyPublish").checked,createdAt:serverTimestamp(),createdBy:auth.currentUser.uid};
    const createdStory=await addDoc(collection(db,"studentSuccessStories"),story);
    if(story.published) await setDoc(doc(db,"publicStudentSuccessStories",createdStory.id),{studentName:story.studentName,course:story.course,beforeScore:story.beforeScore,afterScore:story.afterScore,beforeProblems:story.beforeProblems,afterProblems:story.afterProblems,quote:story.quote,published:true});
    e.target.reset();await loadStories();notify("Student transformation and assessment comparison saved.");
  }catch(err){console.error(err);notify(err.message||"Could not save story.","danger");}
});
$("refreshCertificates").addEventListener("click",loadCertificates);
$("refreshCertificateRequests").addEventListener("click",loadCertificateRequests);
$("logoutBtn").addEventListener("click",async()=>{await signOut(auth);location.href="login.html";});
requireRole("admin",async(user,profile)=>{
  $("adminIdentity").textContent=profile.name||user.email||"Admin";
  try{await loadStudents();await Promise.all([loadCertificates(),loadCertificateRequests(),loadPromotions(),loadStories()]);}
  catch(err){console.error(err);notify(err.message||"Unable to load recognition data.","danger");}
});
