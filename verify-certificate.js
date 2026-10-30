import {db} from "./firebase-config.js";
import {doc,getDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const id=new URLSearchParams(location.search).get("id"),root=document.getElementById("verifyResult");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
if(!id){root.innerHTML='<div class="alert alert-warning">No certificate ID was supplied.</div>';}
else try{
 const snap=await getDoc(doc(db,"publicCertificates",id));
 if(!snap.exists()){root.innerHTML='<div class="alert alert-danger">Certificate not found. This ID is not present in the Pyvanta verification registry.</div>';}
 else {const x=snap.data(),valid=x.status==="issued";root.innerHTML=`<div class="alert ${valid?"alert-success":"alert-danger"}"><strong>${valid?"Valid certificate":"Certificate revoked"}</strong></div><dl class="row"><dt class="col-5 muted">Certificate ID</dt><dd class="col-7">${esc(id)}</dd><dt class="col-5 muted">Student</dt><dd class="col-7">${esc(x.studentName)}</dd><dt class="col-5 muted">Course</dt><dd class="col-7">${esc(x.course)}</dd><dt class="col-5 muted">Level</dt><dd class="col-7">${esc(x.level)}</dd><dt class="col-5 muted">Completion date</dt><dd class="col-7">${esc(x.completionDate)}</dd></dl>`;}
}catch(e){console.error(e);root.innerHTML='<div class="alert alert-warning">Verification is temporarily unavailable. Please try again later.</div>';}
