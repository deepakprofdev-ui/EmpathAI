function escHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function speak(text) {
  if (!state.voiceOutput) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95; utt.pitch = 1; utt.volume = 0.8;
  window.speechSynthesis.speak(utt);
}

// ──────────────────────────────────────────────
// MOOD TRACKER
// ──────────────────────────────────────────────
async function saveMood() {
  if (!state.selectedMood) { toast('Please select a mood first', 'warning'); return; }
  const note = document.getElementById('mood-note').value.trim();
  const uid = state.user?.user_id || state.user?.id;
  if (!uid) { toast('Please log in to save mood', 'warning'); return; }
  try {
    const res = await fetch(`${API}/mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
      body: JSON.stringify({ userId: uid, mood: state.selectedMood, note })
    });
    const data = await res.json();
    if (data.success) {
      toast('Mood saved! 🌟', 'success');
      appendMoodEntry({ mood: state.selectedMood, note, timestamp: new Date().toISOString() });
      document.getElementById('mood-note').value = '';
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      state.selectedMood = null;
    } else {
      toast(data.error || 'Could not save mood', 'error');
    }
  } catch(e) { toast('Could not save mood', 'error'); }
}

function appendMoodEntry(entry) {
  const list = document.getElementById('mood-history-list');
  if (!list) return;
  list.querySelector('.mood-empty-state')?.remove();
  const em = EMOTION_MAP[entry.mood] || EMOTION_MAP.neutral;
  const li = document.createElement('li');
  li.className = 'mood-history-item';
  li.innerHTML = `
    <span class="mood-emoji">${em.emoji}</span>
    <div class="mood-item-content">
      <div class="mood-item-label" style="color:${em.color}">${em.label}</div>
      ${entry.note ? `<div class="mood-item-note">${escHtml(entry.note)}</div>` : ''}
    </div>
    <div class="mood-item-time">${new Date(entry.timestamp).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>`;
  list.prepend(li);
  const count = list.querySelectorAll('.mood-history-item').length;
  document.getElementById('entry-count').textContent = `${count} entr${count === 1 ? 'y' : 'ies'}`;
}

// ──────────────────────────────────────────────
// DASHBOARD — event bridge to React component
// ──────────────────────────────────────────────
async function fetchDashboard() {
  // The React component (dashboard.js) handles full rendering.
  // We dispatch a custom event so it re-fetches for the current user.
  const uid = state.user?.user_id || localStorage.getItem('empathai_user_id');
  window.dispatchEvent(new CustomEvent('empathai:dashboard:refresh', { detail: { userId: uid } }));
}

// ──────────────────────────────────────────────
// COUNSELOR PORTAL
// ──────────────────────────────────────────────
async function fetchCounselor() {
  try {
    const res = await fetch(`${API}/counselor`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // ── Crisis Alerts table ──
    const alertBody = document.getElementById('crisis-table-body');
    const alertCount = document.getElementById('alert-count');
    const alerts = data.alerts || [];
    if (alertCount) alertCount.textContent = `${alerts.length} alert${alerts.length !== 1 ? 's' : ''}`;
    if (alertBody) {
      if (alerts.length === 0) {
        alertBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:1.5rem">No crisis alerts recorded yet.</td></tr>`;
      } else {
        alertBody.innerHTML = alerts.map(a => `
          <tr>
            <td>${new Date(a.timestamp || Date.now()).toLocaleString()}</td>
            <td>${escHtml(a.user_id || '—')}</td>
            <td>${escHtml(a.message || '—')}</td>
            <td><span class="badge-pill danger">High Risk</span></td>
            <td><button class="btn-ghost" style="font-size:.8rem;padding:.25rem .6rem">Review</button></td>
          </tr>`).join('');
      }
    }

    // ── Registered Users table ──
    const usersBody = document.getElementById('users-table-body');
    const userCount = document.getElementById('user-count');
    const users = (data.users || []).filter(u => u.login_type !== 'anonymous');
    if (userCount) userCount.textContent = `${users.length} user${users.length !== 1 ? 's' : ''}`;
    if (usersBody) {
      if (users.length === 0) {
        usersBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:1.5rem">No registered users yet.</td></tr>`;
      } else {
        usersBody.innerHTML = users.map(u => {
          const riskAlerts = alerts.filter(a => a.user_id === u.user_id);
          const risk = riskAlerts.length > 0 ? 'High' : 'Low';
          const riskCls = risk === 'High' ? 'danger' : 'success';
          return `<tr>
            <td>${escHtml(u.user_id || '—')}</td>
            <td>${escHtml(u.name || '—')}</td>
            <td>${escHtml(u.email || '—')}</td>
            <td>${escHtml(u.login_type || '—')}</td>
            <td><span class="badge-pill ${riskCls}">${risk}</span></td>
          </tr>`;
        }).join('');
      }
    }

    toast('Counselor data loaded', 'success');
  } catch (err) {
    console.error('fetchCounselor error:', err);
    toast('Could not load counselor data', 'error');
  }
}

// --- GLOBAL EXPORTS ---
window.saveMood = saveMood;
window.fetchDashboard = fetchDashboard;
window.fetchCounselor = fetchCounselor;