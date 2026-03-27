// ================================================================
// EMPATHAI — PREMIUM FRONTEND v2
// ================================================================
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_KEY = 'your-anon-key-here';
let supabase;
// Load supabase dynamically so the file doesn't throw a SyntaxError when loaded as a classic script
import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm').then(({ createClient }) => {
  try { supabase = createClient(SUPABASE_URL, SUPABASE_KEY); } catch (e) { supabase = null; }
}).catch(e => console.error(e));

const API = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';
const CRISIS_WORDS = ['suicide', 'kill myself', 'die', 'end my life', 'hopeless', 'worthless', 'self harm', 'self-harm', 'want to die', 'no reason to live'];

// ── Frontend emotion keyword map (mirrors backend NLP) ────────
const FRONTEND_NLP = {
  happy: [['ecstatic', 'overjoyed', 'thrilled', 'elated', 'on top of the world'], ['happy', 'joyful', 'excited', 'great', 'wonderful', 'fantastic', 'love it'], ['good', 'okay', 'fine', 'nice', 'better', 'positive', 'hopeful', 'grateful']],
  sad: [['devastated', 'heartbroken', 'miserable', 'depressed', 'despair', 'grief'], ['sad', 'unhappy', 'down', 'crying', 'lonely', 'empty', 'hopeless', 'lost'], ['blue', 'gloomy', 'upset', 'hurt', 'not okay', 'missing']],
  angry: [['furious', 'enraged', 'outraged', 'livid', 'seething', 'explode'], ['angry', 'mad', 'hate', 'rage', 'disgusted', 'frustrated', 'irritated'], ['annoyed', 'bothered', 'pissed', 'fed up', 'sick of', 'unfair']],
  anxious: [['panic attack', 'terrified', 'dread', 'can\'t breathe', 'heart racing'], ['anxious', 'anxiety', 'nervous', 'scared', 'afraid', 'fear', 'worry', 'worried', 'panic'], ['uneasy', 'restless', 'tense', 'on edge', 'overthinking']],
  stressed: [['burnout', 'breaking point', 'can\'t cope', 'falling apart'], ['stressed', 'overwhelmed', 'exhausted', 'drained', 'pressure', 'overloaded'], ['tired', 'busy', 'deadline', 'behind', 'struggling', 'hard time']],
};

function detectEmotionFrontend(text) {
  const lower = text.toLowerCase();
  const scores = { happy: 0, sad: 0, angry: 0, anxious: 0, stressed: 0 };
  for (const [emotion, tiers] of Object.entries(FRONTEND_NLP)) {
    tiers.forEach((terms, i) => {
      const weight = 3 - i;
      terms.forEach(term => { if (lower.includes(term)) scores[emotion] += weight; });
    });
  }
  const top = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a);
  return top[1] > 0 ? top[0] : 'neutral';
}
const EMOTION_MAP = {
  happy: { emoji: '😊', color: '#10B981', label: 'Happy' },
  sad: { emoji: '😢', color: '#60A5FA', label: 'Sad' },
  angry: { emoji: '😡', color: '#F87171', label: 'Angry' },
  anxious: { emoji: '😟', color: '#FBBF24', label: 'Anxious' },
  stressed: { emoji: '😰', color: '#F97316', label: 'Stressed' },
  neutral: { emoji: '😐', color: '#94A3B8', label: 'Neutral' },
};
const THERAPY_MAP = {
  sad: ['💙 Try a 5-minute gratitude journal', '🌟 Write down one positive thing today', '🎵 Listen to uplifting music for 10 min'],
  angry: ['🌬️ Try 4-7-8 breathing technique', '🚶 Take a 5-minute walk outside', '✍️ Write how you\'re feeling — then delete it'],
  anxious: ['🧘 Try a 1-minute box breathing exercise', '📱 Put your phone away for 10 minutes', '🌊 Focus on 5 things you can see right now'],
  stressed: ['☕ Take a 10-minute mindful break', '📝 Write tomorrow\'s to-do list tonight', '🏃 Do 10 jumping jacks to release tension'],
  hopeless: ['💪 Remember: you have survived 100% of your hard days', '📞 Reach out to one person you trust today', '🌅 Focus only on the next 5 minutes'],
};

const state = {
  user: null, token: null, mode: 'login',
  voiceEnabled: true, voiceOutput: false,
  selectedMood: null, recognition: null,
  chartEmotion: null, chartTrend: null,
  voiceSample: null, // Holds baseline Base64 recording
};

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initDarkMode();
  setupLanding();
  setupAuth();
  setupApp();
  setupModals();


});

// ──────────────────────────────────────────────
// DARK MODE
// ──────────────────────────────────────────────
function initDarkMode() {
  if (localStorage.getItem('empathai_theme') === 'dark') document.body.classList.add('dark');
  document.querySelectorAll('#btn-dark-mode').forEach(btn =>
    btn.addEventListener('click', () => {
      const dark = document.body.classList.toggle('dark');
      localStorage.setItem('empathai_theme', dark ? 'dark' : 'light');
      toast(dark ? 'Dark mode on' : 'Light mode on', 'info');
    })
  );
}

// ──────────────────────────────────────────────
// LANDING PAGE
// ──────────────────────────────────────────────
function setupLanding() {
  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
  });
  // CTA buttons → open auth modal
  ['btn-start-talking', 'btn-nav-login', 'btn-nav-signup', 'btn-cta-start'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => showAuth('login'));
  });
  document.getElementById('btn-learn-more')?.addEventListener('click', () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// ──────────────────────────────────────────────
// AUTH MODAL
// ──────────────────────────────────────────────
function showAuth(mode = 'login') {
  state.mode = mode;
  const modal = document.getElementById('auth-modal');
  modal.classList.remove('hidden');
  document.getElementById('auth-title').textContent = mode === 'register' ? 'Create your account' : 'Welcome to EmpathAI';
  document.getElementById('btn-auth-submit').querySelector('.btn-label').textContent = mode === 'register' ? 'Create account' : 'Sign in securely';
  document.getElementById('name-group').style.display = mode === 'register' ? '' : 'none';
  const voiceGroup = document.getElementById('voice-sample-group');
  if (voiceGroup) voiceGroup.style.display = mode === 'register' ? '' : 'none';
  const deafGroup = document.getElementById('deaf-group');
  if (deafGroup) deafGroup.style.display = mode === 'register' ? '' : 'none';
  document.getElementById('btn-toggle-auth').textContent = mode === 'register' ? 'Already have an account? Sign in' : 'Need an account? Sign up';
}
function hideAuth() { document.getElementById('auth-modal').classList.add('hidden'); }

function setupAuth() {
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: '717532709855-33rtcrs1vofahrifss1te786ej378l9b.apps.googleusercontent.com',
      callback: window.handleGoogleCredential
    });
    const googleBtnContainer = document.getElementById('btn-google-login');
    if (googleBtnContainer) {
      window.google.accounts.id.renderButton(googleBtnContainer, { theme: 'outline', size: 'large', type: 'standard' });
    }
  }

  document.getElementById('btn-auth-close')?.addEventListener('click', hideAuth);
  document.getElementById('auth-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) hideAuth(); });
  document.getElementById('btn-toggle-auth')?.addEventListener('click', e => {
    e.preventDefault(); showAuth(state.mode === 'register' ? 'login' : 'register');
  });
  document.getElementById('auth-form')?.addEventListener('submit', async e => {
    e.preventDefault(); await handleEmailAuth();
  });
  document.getElementById('btn-anonymous')?.addEventListener('click', doAnonymous);
  document.getElementById('btn-counselor-login')?.addEventListener('click', () => doCounselorLogin());
  document.getElementById('btn-record-sample')?.addEventListener('click', captureVoiceSample);
}

// Global recording references
let mediaRecorder;
let audioChunks = [];

async function captureVoiceSample() {
  const btn = document.getElementById('btn-record-sample');
  const status = document.getElementById('voice-status-text');
  
  if (mediaRecorder && mediaRecorder.state === 'recording') return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        state.voiceSample = reader.result;
        status.textContent = 'Sample saved! ✓';
        status.style.color = '#10B981';
        btn.innerHTML = '<i class="ph ph-microphone"></i> Retake';
        btn.disabled = false;
        stream.getTracks().forEach(t => t.stop()); // Kill mic
      };
    };

    mediaRecorder.start();
    status.textContent = 'Recording (5s)... 🔴';
    status.style.color = '#EF4444';
    btn.disabled = true;

    setTimeout(() => {
      if (mediaRecorder.state === 'recording') mediaRecorder.stop();
    }, 5000);

  } catch (err) {
    status.textContent = 'Mic access denied';
    status.style.color = '#EF4444';
  }
}

async function handleEmailAuth() {
  const email = document.getElementById('f-email').value.trim();
  const password = document.getElementById('f-password').value;
  const name = document.getElementById('f-name')?.value.trim() || email.split('@')[0];
  if (!email || !password) { toast('Please fill all fields', 'error'); return; }
  const ep = state.mode === 'register' ? '/auth/register' : '/auth/login';
  
  const payload = { email, password, name };
  if (state.mode === 'register') {
    if (state.voiceSample) payload.voice_sample = state.voiceSample;
    payload.is_deaf = document.getElementById('f-is-deaf')?.checked || false;
  }
  
  await doLogin(ep, payload);
}

async function doLogin(endpoint, payload) {
  setAuthLoading(true);
  try {
    const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!data.success) { toast(data.message || 'Login failed', 'error'); showAuthError(data.message); return; }
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('empathai_token', data.token);
    // Explicitly set the user ID so the Dashboard can fetch analytics
    if (data.user && data.user.user_id) {
      localStorage.setItem('empathai_user_id', data.user.user_id);
    }
    hideAuth();

    // ── VOICE ATTESTATION GATE ────────────────────────────────────
    // Only for email-registered users who have a stored voice baseline.
    // Deaf users can skip, but the popup still shows for them to choose.
    // Anonymous, counselor go straight.
    if (data.user && data.user.login_type === 'email' && data.user.has_voice_sample) {
      showVoiceAttest();
    } else {
      launchApp();
    }
  } catch (err) {
    toast('Cannot connect to server', 'error');
  } finally { setAuthLoading(false); }
}

async function doAnonymous() {
  const prefs = { voice_enabled: document.getElementById('pref-voice')?.checked ?? true, language: document.getElementById('pref-lang')?.value || 'English' };
  await doLogin('/auth/anonymous', prefs);
}

function doCounselorLogin() {
  document.getElementById('f-email').value = 'admin@empathai.clinic';
  document.getElementById('f-password').value = 'password';
  handleEmailAuth();
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg; el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function setAuthLoading(v) {
  const btn = document.getElementById('btn-auth-submit');
  btn?.classList.toggle('loading', v);
  if (btn) btn.disabled = v;
}

window.handleGoogleCredential = async (response) => {
  setAuthLoading(true);
  try {
    const res = await fetch(`${API}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: response.credential })
    });
    const data = await res.json();
    if (!data.success) { 
      toast(data.message || 'Google login failed', 'error'); 
      showAuthError(data.message); 
      return; 
    }
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('empathai_token', data.token);
    hideAuth();
    launchApp(); // Assuming launchApp is in scope from index.html scripts
  } catch (err) {
    toast('Cannot connect to server', 'error');
  } finally { setAuthLoading(false); }
};

window.handleGoogleLogin = (e) => {
  if (e) e.preventDefault();
};



// ──────────────────────────────────────────────
// VOICE ATTESTATION  (post-login identity check)
// ──────────────────────────────────────────────
let attestRecorder = null;
let attestChunks   = [];
let attestCountdownInterval = null;

function showVoiceAttest() {
  const modal = document.getElementById('voice-attest-modal');
  if (!modal) { launchApp(); return; } // safety fallback
  modal.classList.remove('hidden');

  // Reset UI to initial state
  _vaSetStatus('Press the button below and speak naturally for 5 seconds.', '');
  const recordBtn = document.getElementById('btn-attest-record');
  const submitBtn = document.getElementById('btn-attest-submit');
  const timerEl   = document.getElementById('va-timer');
  const confEl    = document.getElementById('va-confidence');
  const waveEl    = document.getElementById('va-waveform');
  const ringEl    = document.getElementById('va-icon-ring');

  if (recordBtn)  { recordBtn.disabled = false; document.getElementById('attest-record-label').textContent = 'Record 5s'; recordBtn.classList.remove('recording'); }
  if (submitBtn)  { submitBtn.classList.add('hidden'); submitBtn.disabled = true; }
  if (timerEl)    { timerEl.classList.add('hidden'); }
  if (confEl)     { confEl.classList.add('hidden'); }
  if (waveEl)     { waveEl.classList.remove('active'); }
  if (ringEl)     { ringEl.classList.remove('recording'); }
  state.attestSample = null;

  // Wire buttons (once per show using one-shot flag)
  document.getElementById('btn-attest-record')?.addEventListener('click', recordAttestSample, { once: false });
  document.getElementById('btn-attest-submit')?.addEventListener('click', submitAttestation,  { once: false });
  
  const skipBtn = document.getElementById('btn-attest-skip');
  if (state.user?.is_deaf) {
    if (skipBtn) skipBtn.style.display = 'flex';
  } else {
    if (skipBtn) skipBtn.style.display = 'none'; // Lock access for non-deaf users
  }

  skipBtn?.addEventListener('click', () => {
    toast('Session started', 'success');
    document.getElementById('voice-attest-modal').classList.add('hidden');
    launchApp();
  }, { once: false });
}

async function recordAttestSample() {
  if (attestRecorder && attestRecorder.state === 'recording') return;
  const recordBtn = document.getElementById('btn-attest-record');
  const submitBtn = document.getElementById('btn-attest-submit');
  const timerEl   = document.getElementById('va-timer');
  const countEl   = document.getElementById('va-countdown');
  const waveEl    = document.getElementById('va-waveform');
  const ringEl    = document.getElementById('va-icon-ring');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    attestRecorder = new MediaRecorder(stream);
    attestChunks   = [];

    attestRecorder.ondataavailable = e => { if (e.data.size > 0) attestChunks.push(e.data); };
    attestRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob   = new Blob(attestChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        state.attestSample = reader.result;
        _vaSetStatus('Recording saved ✓ — click Verify Identity when ready.', 'success');
        if (recordBtn) { recordBtn.disabled = false; document.getElementById('attest-record-label').textContent = 'Retake'; recordBtn.classList.remove('recording'); }
        if (submitBtn) { submitBtn.classList.remove('hidden'); submitBtn.disabled = false; }
        if (waveEl)    { waveEl.classList.remove('active'); }
        if (ringEl)    { ringEl.classList.remove('recording'); }
        if (timerEl)   { timerEl.classList.add('hidden'); }
      };
    };

    // Start recording
    attestRecorder.start();
    _vaSetStatus('Recording… speak naturally 🎙️', '');
    if (recordBtn) { recordBtn.disabled = true; recordBtn.classList.add('recording'); document.getElementById('attest-record-label').textContent = 'Recording…'; }
    if (waveEl)    { waveEl.classList.add('active'); }
    if (ringEl)    { ringEl.classList.add('recording'); }
    if (timerEl)   { timerEl.classList.remove('hidden'); }

    // Countdown
    let remaining = 5;
    if (countEl) countEl.textContent = remaining;
    clearInterval(attestCountdownInterval);
    attestCountdownInterval = setInterval(() => {
      remaining--;
      if (countEl) countEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(attestCountdownInterval);
        if (attestRecorder.state === 'recording') attestRecorder.stop();
      }
    }, 1000);

  } catch (err) {
    _vaSetStatus('Microphone access denied. Please allow mic and try again.', 'error');
  }
}

async function submitAttestation() {
  if (!state.attestSample) { _vaSetStatus('Please record a voice sample first.', 'error'); return; }
  const submitBtn = document.getElementById('btn-attest-submit');
  if (submitBtn) { submitBtn.disabled = true; }
  _vaSetStatus('Analysing voice pattern…', '');

  try {
    const res = await fetch(`${API}/auth/verify-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
      body: JSON.stringify({ user_id: state.user.user_id, voice_sample: state.attestSample })
    });
    const data = await res.json();

    // Show confidence bar
    const confEl    = document.getElementById('va-confidence');
    const confBar   = document.getElementById('va-conf-bar');
    const confPct   = document.getElementById('va-conf-pct');
    const pct = data.confidence !== undefined ? Math.max(0, Math.min(100, data.confidence)) : 0;
    if (confEl)  { confEl.classList.remove('hidden'); }
    if (confBar) { setTimeout(() => { confBar.style.width = pct + '%'; }, 80); }
    if (confPct) { confPct.textContent = pct + '%'; }

    if (data.match) {
      _vaSetStatus('Successfully Verified ✓', 'success');
      toast('Identity verified ✓', 'success');
      setTimeout(() => {
        document.getElementById('voice-attest-modal').classList.add('hidden');
        launchApp();
      }, 1500);
    } else {
      _vaSetStatus('Access Denied ❌', 'error');
      toast('Voice mismatch — Access Denied', 'error');
      
      // Auto-logout and redirect after 2s
      setTimeout(() => {
        document.getElementById('voice-attest-modal').classList.add('hidden');
        doLogout();
        showAuth('login');
        startLoginTimer(10);
      }, 2000);
    }
  } catch (err) {
    _vaSetStatus('Server error during verification. You may skip and continue.', 'error');
    if (submitBtn) submitBtn.disabled = false;
  }
}

function _vaSetStatus(msg, cls) {
  const el = document.getElementById('va-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'va-status' + (cls ? ' ' + cls : '');
}

// ──────────────────────────────────────────────
// LAUNCH APP
// MODALS SETUP
// ──────────────────────────────────────────────
function setupModals() { }

// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────
const ICONS = { success: 'ph-check-circle', error: 'ph-x-circle', warning: 'ph-warning', info: 'ph-info' };
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const el = document.getElementById('toast-el');
  const ic = document.getElementById('toast-icon');
  const m = document.getElementById('toast-message');
  if (!c || !el || !m) return;
  el.className = `toast toast-${type}`;
  if (ic) ic.className = `ph ${ICONS[type] || 'ph-info'} toast-icon`;
  m.textContent = msg;
  c.classList.remove('hidden');
  clearTimeout(c._t);
  c._t = setTimeout(() => c.classList.add('hidden'), 3500);
}

// ──────────────────────────────────────────────
// UTILS
// ──────────────────────────────────────────────
function showEl(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hideEl(id) { document.getElementById(id)?.classList.add('hidden'); }

function startLoginTimer(seconds) {
  const btn = document.getElementById('btn-auth-submit');
  const container = document.getElementById('login-timer-container');
  const text = document.getElementById('login-timer-text');
  if (!btn || !container || !text) return;

  btn.disabled = true;
  container.classList.remove('hidden');
  
  let remaining = seconds;
  text.textContent = `Try again in ${remaining}s`;
  
  const interval = setInterval(() => {
    remaining--;
    text.textContent = `Try again in ${remaining}s`;
    if (remaining <= 0) {
      clearInterval(interval);
      btn.disabled = false;
      container.classList.add('hidden');
    }
  }, 1000);
}
// --- GLOBAL EXPORTS ---
window.showAuth = showAuth;
window.hideModal = hideModal;
window.logout = doLogout;
window.hideEl = hideEl;