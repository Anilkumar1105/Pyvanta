import { requireRole } from './auth.js';
import { db } from './firebase-config.js';
import { addDoc, collection, getDocs, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function timeOf(value) { try { return value?.toDate ? value.toDate().toLocaleString() : 'Just now'; } catch { return 'Just now'; } }

requireRole('student', (user, profile) => {
  const form = document.getElementById('studentSupportForm');
  const wrap = document.getElementById('studentSupportRequests');
  if (!form || !wrap || form.dataset.wired === 'true') return;
  form.dataset.wired = 'true';

  async function loadRequests() {
    wrap.innerHTML = '<div class="text-muted small">Loading your requests…</div>';
    try {
      const snap = await getDocs(query(collection(db, 'supportRequests'), where('uid', '==', user.uid)));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      if (!items.length) { wrap.innerHTML = '<div class="text-muted small">No support requests yet.</div>'; return; }
      wrap.innerHTML = items.map(item => {
        const status = item.status || 'open';
        const badge = status === 'answered' ? 'bg-success' : status === 'closed' ? 'bg-secondary' : 'bg-warning text-dark';
        return `<article class="border rounded-3 p-3"><div class="d-flex flex-wrap justify-content-between gap-2"><strong>${escapeHtml(item.category || 'Query')}</strong><span class="badge ${badge}">${escapeHtml(status.toUpperCase())}</span></div><div class="small text-muted mt-1">${escapeHtml(timeOf(item.createdAt))}</div><p class="mb-2 mt-2">${escapeHtml(item.message)}</p>${item.adminReply ? `<div class="alert alert-success py-2 mb-0"><strong>Admin response:</strong> ${escapeHtml(item.adminReply)}</div>` : '<div class="small text-muted">Waiting for admin response.</div>'}</article>`;
      }).join('');
    } catch (error) { console.error('Support requests could not load', error); wrap.innerHTML = '<div class="small text-danger">Unable to load support requests. Please refresh later.</div>'; }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('submitSupportBtn');
    const messageEl = document.getElementById('supportFormMessage');
    const category = document.getElementById('supportCategory').value;
    const message = document.getElementById('supportMessage').value.trim();
    if (!category || message.length < 8) { messageEl.textContent = 'Choose a topic and enter at least 8 characters.'; return; }
    button.disabled = true; messageEl.textContent = 'Submitting your query…';
    try {
      await addDoc(collection(db, 'supportRequests'), { uid: user.uid, email: user.email || '', studentName: profile?.name || 'Student', rollNumber: profile?.rollNumber || '', category, message, status: 'open', adminReply: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      form.reset(); messageEl.textContent = 'Query submitted successfully. Track its status below.'; await loadRequests();
    } catch (error) { console.error('Could not submit support query', error); messageEl.textContent = 'Could not submit. Check your connection or Firebase rules and try again.'; }
    finally { button.disabled = false; }
  });
  loadRequests();
});
