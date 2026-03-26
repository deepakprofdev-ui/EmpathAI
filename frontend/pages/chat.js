// ──────────────────────────────────────────────
function launchApp() {
  document.getElementById('landing-page').classList.add('hidden');
  const layout = document.getElementById('app-layout');
  layout.classList.remove('hidden');
  layout.style.display = 'flex';

  document.getElementById('nav-user-name').textContent = state.user.name;
  document.getElementById('nav-user-role').textContent = state.user.login_type === 'counselor' ? 'Counselor' : 'Member';
  document.getElementById('welcome-name').textContent = state.user.name.split(' ')[0];
  state.voiceOutput = state.user.voice_enabled ?? true;

  if (state.user.login_type === 'counselor') {
    document.querySelectorAll('.counselor-only').forEach(el => el.classList.remove('hidden'));
    switchView('counselor-view');
  } else {
    switchView('chat-view');
  }

  toast(`Welcome, ${state.user.name} 👋`, 'success');
  sendChatMessage(null, true); // trigger initial AI greeting
}

// ──────────────────────────────────────────────
// VIEW SWITCHING
// ──────────────────────────────────────────────
function switchView(viewId) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
  document.getElementById(viewId)?.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === viewId);
  });
  if (viewId === 'dashboard-view') fetchDashboard();
  if (viewId === 'counselor-view') fetchCounselor();
  if (viewId === 'chat-view') document.getElementById('chat-input')?.focus();
  closeMobileSidebar();
}

function setupApp() {
  // Nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => { e.preventDefault(); switchView(item.dataset.view); });
  });
  // Mobile menu
  document.getElementById('btn-menu')?.addEventListener('click', () =>
    document.getElementById('sidebar')?.classList.add('open'));
  document.getElementById('btn-hamburger')?.addEventListener('click', () =>
    document.getElementById('sidebar')?.classList.add('open'));
  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', doLogout);
  // Help
  document.getElementById('btn-help-emergency')?.addEventListener('click', () => showModal('help-modal'));
  // Chat form
  document.getElementById('chat-form')?.addEventListener('submit', e => { e.preventDefault(); handleChatSubmit(); });
  // Mic
  initVoiceInput();
  // Emotion detect button
  setupEmotionDetector();
  // Voice output toggle
  document.getElementById('btn-toggle-voice')?.addEventListener('click', function() {
    state.voiceOutput = !state.voiceOutput;
    this.classList.toggle('active', state.voiceOutput);
    this.setAttribute('aria-pressed', state.voiceOutput);
  });
  // Mood save
  document.getElementById('btn-save-mood')?.addEventListener('click', saveMood);
  // Mood selector
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedMood = btn.dataset.mood;
    });
  });
  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
  });
  document.getElementById('btn-close-crisis')?.addEventListener('click', () => hideModal('crisis-modal'));
  document.getElementById('btn-close-help')?.addEventListener('click',   () => hideModal('help-modal'));
  document.getElementById('btn-contact-counselor')?.addEventListener('click', () => window.open('tel:988'));
  document.getElementById('btn-trusted-contact')?.addEventListener('click', () => { hideModal('crisis-modal'); toast('Trusted contact alerted', 'success'); });
}

function closeMobileSidebar() { document.getElementById('sidebar')?.classList.remove('open'); }
function doLogout() {
  state.user = null; state.token = null; localStorage.removeItem('empathai_token');
  document.getElementById('app-layout').classList.add('hidden');
  document.getElementById('landing-page').classList.remove('hidden');
  document.getElementById('chat-messages').innerHTML = '';
  document.getElementById('chat-empty').style.display = '';
  toast('Signed out successfully', 'info');
}
function showModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hideModal(id) { document.getElementById(id)?.classList.add('hidden'); }

// ──────────────────────────────────────────────
// EMOTION DETECTION BUTTON (MODAL)
// ──────────────────────────────────────────────
function setupEmotionDetector() {
  const btn = document.getElementById('btn-detect-emotion');
  btn?.addEventListener('click', () => {
    // We can detect based on current input text OR the last message
    const input = document.getElementById('chat-input');
    const text = input?.value.trim();
    if (!text) {
      toast('Please type a message first to detect emotion.', 'info');
      return;
    }
    showEmotionModal(text);
  });

  document.getElementById('btn-close-emotion-modal')?.addEventListener('click', () => hideModal('emotion-result-modal'));
  document.getElementById('btn-close-emotion-modal-2')?.addEventListener('click', () => hideModal('emotion-result-modal'));
}

function showEmotionModal(text) {
  const emotion = detectEmotionFrontend(text);
  const em = EMOTION_MAP[emotion] || EMOTION_MAP.neutral;
  
  const orb = document.getElementById('emotion-result-orb');
  const emoji = document.getElementById('emotion-result-emoji');
  const name = document.getElementById('emotion-result-name');
  const desc = document.getElementById('emotion-result-desc');
  const tips = document.getElementById('emotion-tips');

  if (!orb || !emoji || !name || !desc || !tips) return;

  // Append '33' for 20% opacity and '40' for 25% opacity to the hex color
  orb.style.background = `${em.color}33`;
  orb.style.boxShadow = `0 0 40px ${em.color}40`;
  emoji.textContent = em.emoji;
  name.textContent = em.label;
  name.style.color = em.color;

  const descriptions = {
    happy: "Your message radiates positivity. Keep holding onto this good energy!",
    sad: "I sense a heaviness in your words. It's okay to let yourself feel this way.",
    angry: "Your words carry frustration. Let's find a way to safely release this tension.",
    anxious: "There's unease in your message. Let's pause and ground ourselves.",
    stressed: "You sound overwhelmed. Remember to take things one step at a time.",
    neutral: "Your message feels calm and balanced right now."
  };
  desc.textContent = descriptions[emotion] || descriptions.neutral;

  const tipsList = THERAPY_MAP[emotion] || [
    "Take a deep breath and relax your shoulders.",
    "Drink a glass of water.",
    "Acknowledge how you are feeling without judgment."
  ];

  tips.innerHTML = tipsList.map(t => 
    `<div class="emotion-tip-card"><i class="ph ph-sparkle"></i><div>${t}</div></div>`
  ).join('');

  showModal('emotion-result-modal');
}

// ──────────────────────────────────────────────
// CHAT
// ──────────────────────────────────────────────
function handleChatSubmit() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  sendChatMessage(text);
}

window.sendQuick = (btn) => {
  document.getElementById('chat-empty').style.display = 'none';
  const text = btn.textContent.replace(/^[^\s]+\s/, ''); // strip emoji prefix
  sendChatMessage(text);
};

async function sendChatMessage(text, isGreeting = false) {
  if (!isGreeting && text) {
    addMessage(text, 'user');
    document.getElementById('chat-empty').style.display = 'none';
    if (checkCrisis(text)) { showModal('crisis-modal'); markHighRisk(text); return; }
  }
  const typingId = addTyping();
  try {
    const endpoint = isGreeting ? '/chat' : '/chat';
    const userMessage = isGreeting ? `Hello, my name is ${state.user?.name || 'there'}. I'm starting a new session.` : text;
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
      body: JSON.stringify({ message: userMessage, user_id: state.user?.user_id })
    });
    const data = await res.json();
    removeTyping(typingId);
    if (data.reply) {
      const emotion = data.emotion || 'neutral';
      addMessage(data.reply, 'ai', emotion);
      if (state.voiceOutput) speak(data.reply);
      showSuggestions(emotion);
    }
  } catch(err) {
    removeTyping(typingId);
    addMessage("I'm having trouble connecting right now. Please check that the server is running.", 'ai', 'neutral');
  }
}

// Global Polling mechanism for incoming backend messages (like Counselor replies)
setInterval(async () => {
  // Only poll if on chat view, logged in, and not a counselor.
  if (!state.user || state.user.login_type === 'counselor' || !document.getElementById('chat-view').classList.contains('active')) return;
  
  try {
    const res = await fetch(`${API}/chat/${state.user.user_id}/history`);
    const data = await res.json();
    if (data.success && data.history) {
        // Find visible messages in the UI. Exclude optimistic user messages briefly hanging?
        // Let's just track a global known backend total message count.
        if (state.knownBackendMsgCount === undefined) {
             state.knownBackendMsgCount = data.history.length;
        } else if (data.history.length > state.knownBackendMsgCount) {
             const newMsgs = data.history.slice(state.knownBackendMsgCount);
             state.knownBackendMsgCount = data.history.length;
             
             newMsgs.forEach(msg => {
                 // Only render if it's a counselor injection (standard AI replies are handled instantly on send)
                 if (msg.role === 'counselor') {
                     document.getElementById('chat-empty').style.display = 'none';
                     addMessage(msg.content, 'ai', 'neutral');
                     if (state.voiceOutput) speak(msg.content);
                 }
             });
        }
    }
  } catch(e) { /* ignore polling errors */ }
}, 3000);

function addMessage(text, role, emotion = null) {
  const container = document.getElementById('chat-messages');
  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;
  const em = emotion ? EMOTION_MAP[emotion] || EMOTION_MAP.neutral : null;
  const badge = em && role === 'ai' ? `<span class="emotion-badge" style="color:${em.color}">${em.emoji} ${em.label}</span>` : '';
  const userEm = role === 'user' && emotion ? (EMOTION_MAP[emotion]?.emoji || '') : '';
  wrap.innerHTML = `
    <div class="msg-ava"><i class="ph ph-${role === 'ai' ? 'robot' : 'user'}"></i></div>
    <div class="message-body">
      <div class="message-content">${escHtml(text)} ${userEm}</div>
      ${badge}
      <div class="message-time">${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
    </div>`;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function addTyping() {
  const id = 'typing-' + Date.now();
  const container = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = 'message ai'; el.id = id;
  el.innerHTML = `<div class="msg-ava"><i class="ph ph-robot"></i></div>
    <div class="message-body"><div class="message-content typing-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return id;
}
function removeTyping(id) { document.getElementById(id)?.remove(); }

function showSuggestions(emotion) {
  const strip = document.getElementById('chat-suggestions');
  const tips = THERAPY_MAP[emotion] || THERAPY_MAP.stressed;
  if (!tips) { strip.classList.add('hidden'); return; }
  strip.innerHTML = tips.map(t => `<button class="suggestion-chip" onclick="sendQuick(this)">${t}</button>`).join('');
  strip.classList.remove('hidden');
}

function checkCrisis(text) {
  return CRISIS_WORDS.some(w => text.toLowerCase().includes(w));
}

async function markHighRisk(message) {
  try {
    await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
      body: JSON.stringify({ message, user_id: state.user?.user_id, crisis: true })
    });
  } catch(e) {}
}

function escHtml(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ──────────────────────────────────────────────
// VOICE INPUT
// ──────────────────────────────────────────────
function initVoiceInput() {
  const btn = document.getElementById('btn-mic');
  if (!btn) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { btn.style.opacity = '.4'; btn.title = 'Speech recognition not supported'; return; }
  state.recognition = new SR();
  state.recognition.continuous = false;
  state.recognition.interimResults = false;
  state.recognition.lang = 'en-US';
  state.recognition.onresult = e => {
    document.getElementById('chat-input').value = e.results[0][0].transcript;
    btn.classList.remove('listening'); btn.setAttribute('aria-pressed','false');
  };
  state.recognition.onerror = () => { btn.classList.remove('listening'); };
  state.recognition.onend = () => { btn.classList.remove('listening'); };
  btn.addEventListener('click', () => {
    const isListening = btn.classList.contains('listening');
    if (isListening) { state.recognition.stop(); }
    else { state.recognition.start(); btn.classList.add('listening'); btn.setAttribute('aria-pressed','true'); }
  });
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}