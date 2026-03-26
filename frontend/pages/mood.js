  utt.rate = 0.95; utt.pitch = 1; utt.volume = 0.8;
  window.speechSynthesis.speak(utt);
}

// ──────────────────────────────────────────────
// MOOD TRACKER
// ──────────────────────────────────────────────
async function saveMood() {
  if (!state.selectedMood) { toast('Please select a mood first', 'warning'); return; }
  const note = document.getElementById('mood-note').value.trim();
  try {
    const res = await fetch(`${API}/mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
      body: JSON.stringify({ userId: state.user?.id || state.user?.user_id, mood: state.selectedMood, note })
    });
    const data = await res.json();
    if (data.success) {
      toast('Mood saved! 🌟', 'success');
      appendMoodEntry({ mood: state.selectedMood, note, timestamp: new Date().toISOString() });
      document.getElementById('mood-note').value = '';
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      state.selectedMood = null;
    }
  } catch(e) { toast('Could not save mood', 'error'); }
}

function appendMoodEntry(entry) {
  const list = document.getElementById('mood-history-list');
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
// DASHBOARD
// ──────────────────────────────────────────────
async function fetchDashboard() {
  showEl('dashboard-skeleton'); showEl('chart-skeleton');
  hideEl('dashboard-stats');    hideEl('dashboard-charts');
  try {
    const res = await fetch(`${API}/dashboard/${state.user?.user_id}`);
    const data = await res.json();
    // Stats
    document.getElementById('stat-conversations').textContent = data.totalConversations ?? 0;
    const histories = data.moodHistory || [];
    document.getElementById('stat-mood-entries').textContent = histories.length;
    let dominant = 'None'; let max = 0;