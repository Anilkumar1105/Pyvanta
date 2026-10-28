import { requireRole } from './auth.js';
import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

requireRole('student', async (user) => {
  const section = document.getElementById('subscriptionNoticeSection');
  if (!section) return;
  try {
    const [requestsSnap, subSnap] = await Promise.all([
      getDocs(query(collection(db, 'subscriptionRequests'), where('uid', '==', user.uid))),
      getDoc(doc(db, 'subscriptions', user.uid))
    ]);
    const requests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    requests.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    const latest = requests[0];
    const sub = subSnap.exists() ? subSnap.data() : null;
    let title = 'No subscription request yet';
    let message = 'Choose a plan and submit your payment reference. Your status will appear here after submission.';
    let kind = 'secondary', icon = 'bi-info-circle';
    const active = sub?.status === 'active' && (!sub.expiresAt?.toDate || sub.expiresAt.toDate() > new Date());
    if (active) {
      title = 'Subscription approved — access active';
      message = `${sub.planName || sub.planId || 'Your plan'} is active${sub.expiresAt?.toDate ? ` until ${sub.expiresAt.toDate().toLocaleDateString()}` : ''}. You can now use your subscription features.`;
      kind = 'success'; icon = 'bi-check-circle-fill';
    } else if (latest?.status === 'pending') {
      title = 'Payment submitted — waiting for admin approval';
      message = `${latest.planName || latest.planId || 'Your selected plan'} is waiting for admin verification. You do not need to submit the same payment again.`;
      kind = 'warning'; icon = 'bi-hourglass-split';
    } else if (latest?.status === 'rejected') {
      title = 'Subscription request rejected';
      message = 'The admin could not approve this payment request. Check your transaction details or contact support before submitting a new request.';
      kind = 'danger'; icon = 'bi-exclamation-triangle-fill';
    } else if (latest?.status === 'approved') {
      title = 'Subscription approved'; message = 'Your request was approved. Refresh this page if your active plan is not shown yet.'; kind = 'success'; icon = 'bi-check-circle-fill';
    }
    section.className = `alert alert-${kind} mb-4`;
    document.getElementById('subscriptionNoticeTitle').textContent = title;
    document.getElementById('subscriptionNoticeText').textContent = message;
    document.getElementById('subscriptionNoticeIcon').className = `bi ${icon} fs-4`;
  } catch (error) { console.warn('Subscription notification could not load', error); }
});
