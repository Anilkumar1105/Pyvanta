import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { PYVANTA_UPI_ID, PYVANTA_PAYEE_NAME, PYVANTA_PLANS, getPyvantaPlan } from "./subscription-config.js";
const plansRoot=document.getElementById('plans'), planSelect=document.getElementById('planSelect');
let currentUser=null;
function renderPlans(){
  plansRoot.innerHTML = PYVANTA_PLANS.map((p) => `
    <div class="col-md-4">
      <article class="pv-plan h-100 d-flex flex-column ${p.id === 'pro' ? 'featured' : ''}">
        <div class="d-flex justify-content-between align-items-center"><span class="pv-eyebrow">${p.label}</span>${p.id === 'pro' ? '<span class="pv-status">Popular</span>' : ''}</div>
        <h2 class="h4 mt-4">${p.name}</h2>
        <div class="pv-price mt-2">₹${p.price}<span class="fs-6 fw-normal pv-muted"> / plan</span></div>
        <p class="pv-muted small mb-1">${p.durationLabel}</p>
        <p class="pv-muted small">Access starts after admin payment approval.</p>
        <hr class="pv-rule">
        <ul class="list-unstyled small d-grid gap-2 flex-grow-1">${p.features.map(f => `<li><i class="bi bi-check2 pv-cyan me-2"></i>${f}</li>`).join('')}</ul>
        <button class="btn ${p.id === 'pro' ? 'btn-mint' : 'btn-outline-mint'} w-100 mt-3" data-plan="${p.id}">Choose ${p.name}</button>
      </article>
    </div>`).join('');
  planSelect.innerHTML = PYVANTA_PLANS.map(p => `<option value="${p.id}">${p.name} — ₹${p.price} · ${p.durationDays} days</option>`).join('');
  plansRoot.querySelectorAll('[data-plan]').forEach(b => b.addEventListener('click', () => { planSelect.value = b.dataset.plan; document.getElementById('paymentForm').scrollIntoView({behavior:'smooth',block:'center'}); buildQr(); }));
}
let adminQrDataUrl = '';
let qrSettingsLoaded = false;
const adminQr = document.getElementById('adminPaymentQr');
const paymentQr = document.getElementById('paymentQr');
const paymentQrWrap = document.getElementById('paymentQrWrap');
const upiLink = document.getElementById('upiLink');
const upiWarning = document.getElementById('upiConfigWarning');
const qrPlaceholder = document.getElementById('paymentQrPlaceholder');

function showAdminQr() {
  if (!adminQrDataUrl) return false;
  if (qrPlaceholder) qrPlaceholder.classList.add('d-none');
  paymentQr.innerHTML = '';
  paymentQr.classList.add('d-none');
  adminQr.classList.remove('d-none');
  adminQr.src = adminQrDataUrl;
  upiLink.classList.add('d-none');
  upiWarning.textContent = 'Scan the QR image uploaded by the administrator. Confirm the payee and exact amount in your UPI app.';
  paymentQrWrap.classList.remove('d-none');
  return true;
}

function buildQr() {
  const p = PYVANTA_PLANS.find(x => x.id === planSelect.value);
  if (!p) return;
  paymentQrWrap.classList.remove('d-none');
  if (qrPlaceholder) qrPlaceholder.classList.add('d-none');
  const amountLabel = document.getElementById('selectedPaymentAmount');
  if (amountLabel) amountLabel.textContent = `Selected amount: ₹${p.price} · ${p.name}`;

  // An admin-uploaded QR is the source of truth and must stay visible
  // when the user changes plans or clicks a plan card.
  if (showAdminQr()) return;

  adminQr.classList.add('d-none');
  paymentQr.classList.remove('d-none');
  paymentQr.innerHTML = '';
  upiLink.classList.remove('d-none');
  if (!PYVANTA_UPI_ID || PYVANTA_UPI_ID === 'YOUR_UPI_ID@BANK') {
    upiWarning.textContent = qrSettingsLoaded
      ? 'Payment QR is not configured yet. Please contact the administrator.'
      : 'Loading payment QR…';
    upiLink.href = '#';
    if (qrPlaceholder) {
      qrPlaceholder.textContent = qrSettingsLoaded ? 'Payment QR unavailable' : 'Loading payment QR…';
      qrPlaceholder.classList.remove('d-none');
    }
    return;
  }
  const uri = `upi://pay?pa=${encodeURIComponent(PYVANTA_UPI_ID)}&pn=${encodeURIComponent(PYVANTA_PAYEE_NAME)}&am=${p.price.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Pyvanta ' + p.name + ' ' + p.durationDays + ' day plan')}`;
  if (typeof QRCode !== 'undefined') new QRCode(paymentQr, { text: uri, width: 180, height: 180 });
  if (qrPlaceholder) qrPlaceholder.classList.add('d-none');
  upiLink.href = uri;
  upiWarning.textContent = `Selected plan: ${p.name} · ₹${p.price}. Confirm the payee and amount before paying.`;
}

async function loadAdminPaymentQr() {
  try {
    const snap = await getDoc(doc(db, 'appSettings', 'payment'));
    if (snap.exists() && snap.data().qrDataUrl) {
      adminQrDataUrl = snap.data().qrDataUrl;
      adminQr.onload = () => {
        adminQr.classList.remove('d-none');
        paymentQr.classList.add('d-none');
        paymentQrWrap.classList.remove('d-none');
      };
      adminQr.onerror = () => {
        adminQrDataUrl = '';
        adminQr.classList.add('d-none');
        buildQr();
      };
      // Assign src and render in one place so a plan selection cannot hide it.
      adminQr.src = adminQrDataUrl;
      showAdminQr();
    }
  } catch (e) {
    console.warn('Admin QR could not be loaded', e);
  } finally {
    qrSettingsLoaded = true;
    buildQr();
  }
}
planSelect.addEventListener('change',buildQr);renderPlans();loadAdminPaymentQr();onAuthStateChanged(auth,async u=>{currentUser=u;if(!u){document.getElementById('paymentMessage').textContent='Please log in or create an account before submitting payment.';return;}try{const snap=await getDoc(doc(db,'subscriptions',u.uid));if(snap.exists()){const d=snap.data(),plan=getPyvantaPlan(d.planId),exp=d.expiresAt?.toDate?.(),days=exp?Math.max(0,Math.ceil((exp-Date.now())/86400000)):0,active=d.status==='active'&&days>0;const card=document.getElementById('currentPlanCard');if(card){card.classList.remove('d-none');document.getElementById('currentPlanTitle').textContent=active?(plan?.name||d.planName||d.planId||'Active plan'):'Subscription expired';document.getElementById('currentPlanMeta').textContent=active?`${plan?.durationLabel||d.planName||'Active plan'} · Expires ${exp.toLocaleDateString()}`:'Choose a plan to restore premium access.';document.getElementById('remainingDays').textContent=days+' days';document.getElementById('upgradePlanBtn').textContent=active?'Upgrade / Extend plan':'Choose a plan';document.getElementById('upgradePlanBtn').onclick=()=>{document.getElementById('plans').scrollIntoView({behavior:'smooth',block:'start'});};}if(active){document.getElementById('paymentMessage').textContent='Your plan is active. Select a longer plan below to request an upgrade or extension when allowed.';}}}catch(err){console.error('Could not load current subscription',err);}});
document.getElementById('paymentForm').addEventListener('submit',async e=>{e.preventDefault();const msg=document.getElementById('paymentMessage'),btn=document.getElementById('submitPayment');msg.className='small ms-2';if(!currentUser){msg.textContent='Please log in first.';return;}if(!currentUser.emailVerified){try{await sendEmailVerification(currentUser);msg.textContent='Email not verified. We sent a verification link; verify it, sign in again, then submit payment.';}catch(e){msg.textContent='Please verify your email before requesting activation. '+(e.code||'');}return;}const p=PYVANTA_PLANS.find(x=>x.id===planSelect.value),ref=document.getElementById('transactionRef').value.trim();if(!p||ref.length<6){msg.textContent='Choose a plan and enter a valid transaction reference.';return;}btn.disabled=true;try{const existing=await getDoc(doc(db,'subscriptions',currentUser.uid));await addDoc(collection(db,'subscriptionRequests'),{uid:currentUser.uid,email:currentUser.email,planId:p.id,planName:p.name,durationDays:p.durationDays,durationLabel:p.durationLabel,amount:p.price,transactionRef:ref,payerNote:document.getElementById('payerNote').value.trim(),status:'pending',createdAt:serverTimestamp()});msg.textContent='Request submitted. Access activates after admin verification.';document.getElementById('transactionRef').value='';}catch(err){console.error(err);msg.textContent='Could not submit. Check Firebase rules/deployment and try again.';}finally{btn.disabled=false;}});
