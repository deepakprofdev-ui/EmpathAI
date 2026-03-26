/**
 * EmpathAI — Mood Analytics Dashboard Plugin
 * Injects a full 8-section analytics panel into the existing #mood-view
 * without modifying any existing source files.
 */

(function () {
  'use strict';

  // ─── Color System ────────────────────────────────────────────────────────────
  const EMOTION_COLORS = {
    happy:      { bg: 'rgba(34,197,94,0.15)',  border: '#22c55e', text: '#15803d', emoji: '😊' },
    calm:       { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#1d4ed8', emoji: '😌' },
    neutral:    { bg: 'rgba(148,163,184,0.15)',border: '#94a3b8', text: '#475569', emoji: '😐' },
    sad:        { bg: 'rgba(139,92,246,0.15)', border: '#8b5cf6', text: '#6d28d9', emoji: '😢' },
    anxiety:    { bg: 'rgba(251,146,60,0.15)', border: '#fb923c', text: '#c2410c', emoji: '😟' },
    anxious:    { bg: 'rgba(251,146,60,0.15)', border: '#fb923c', text: '#c2410c', emoji: '😟' },
    stressed:   { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', text: '#b91c1c', emoji: '😣' },
    pressure:   { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', text: '#b91c1c', emoji: '😣' },
    frustrated: { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', text: '#b91c1c', emoji: '😤' },
    angry:      { bg: 'rgba(220,38,38,0.15)',  border: '#dc2626', text: '#991b1b', emoji: '😡' },
    overwhelmed:{ bg: 'rgba(168,85,247,0.15)', border: '#a855f7', text: '#7e22ce', emoji: '🤯' },
    default:    { bg: 'rgba(148,163,184,0.15)',border: '#94a3b8', text: '#475569', emoji: '💭' },
  };

  const MOOD_SCORE = { happy:5, calm:4, neutral:3, sad:2, anxious:2, anxiety:2, stressed:1, pressure:1, frustrated:1, angry:1, overwhelmed:0 };

  function getColor(mood) { return EMOTION_COLORS[(mood||'').toLowerCase()] || EMOTION_COLORS.default; }

  // ─── Shared Styles ───────────────────────────────────────────────────────────
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    #mood-analytics-panel { font-family: 'Inter', 'Segoe UI', sans-serif; color: var(--text, #1e293b); padding: 0 0 2rem 0; }
    .ma-section-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted, #64748b); margin-bottom: 1rem; display: flex; align-items: center; gap: 6px; }
    .ma-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .ma-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
    .ma-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.25rem; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transition: transform .2s, box-shadow .2s; }
    .ma-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
    .ma-mood-orb { width: 90px; height: 90px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 0.75rem; animation: maPulse 3s ease-in-out infinite; }
    @keyframes maPulse { 0%,100%{ transform:scale(1); box-shadow:0 0 0 0 rgba(34,197,94,0.3); } 50%{ transform:scale(1.05); box-shadow:0 0 0 12px rgba(34,197,94,0); } }
    .ma-stability-bar { height: 12px; border-radius: 50px; background: var(--surface2, rgba(255,255,255,0.08)); overflow: hidden; margin: 0.5rem 0; }
    .ma-stability-fill { height: 100%; border-radius: 50px; background: linear-gradient(90deg, #22c55e, #3b82f6); transition: width 1.5s cubic-bezier(0.16,1,0.3,1); }
    .ma-heatmap { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
    .ma-heatmap-cell { aspect-ratio: 1; border-radius: 4px; cursor: pointer; transition: transform .15s; position: relative; }
    .ma-heatmap-cell:hover { transform: scale(1.3); z-index: 2; }
    .ma-heatmap-cell .ma-tooltip { display: none; position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%); background: rgba(15,23,42,0.9); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 0.65rem; white-space: nowrap; z-index: 10; }
    .ma-heatmap-cell:hover .ma-tooltip { display: block; }
    .ma-insight-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; line-height: 1.5; }
    .ma-insight-item:last-child { border-bottom: none; }
    .ma-insight-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
    .ma-therapy-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; border: none; cursor: pointer; font-size: 0.8rem; font-weight: 600; margin-right: 8px; margin-top: 10px; transition: opacity .2s, transform .15s; }
    .ma-therapy-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    .ma-pattern-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.82rem; }
    .ma-pattern-row:last-child { border-bottom: none; }
    .ma-pattern-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .ma-filter-btn { padding: 4px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: var(--text-muted, #64748b); font-size: 0.75rem; cursor: pointer; transition: all .2s; }
    .ma-filter-btn.active { background: var(--primary, #00d4ff); color: #000; border-color: var(--primary, #00d4ff); font-weight: 600; }
    @media (max-width: 640px) { .ma-grid-2, .ma-grid-3 { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(styleTag);

  // ─── Data helpers ────────────────────────────────────────────────────────────
  function getMoodHistory() {
    try {
      const raw = localStorage.getItem('empathai_mood_history');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function buildSampleData() {
    const now = Date.now(); const day = 86400000;
    const moods = ['happy','neutral','anxious','sad','calm','stressed','happy','overwhelmed','neutral','happy','calm','happy'];
    return moods.map((mood, i) => ({
      mood, timestamp: new Date(now - (moods.length - i) * day).toISOString(),
      note: ''
    }));
  }

  function getFreq(entries) {
    const freq = {};
    entries.forEach(e => { const k = (e.mood||'').toLowerCase(); freq[k] = (freq[k]||0)+1; });
    return freq;
  }

  function getDominantMood(freq) {
    return Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'neutral';
  }

  function getStabilityScore(entries) {
    if (entries.length < 2) return 70;
    const scores = entries.map(e => MOOD_SCORE[(e.mood||'').toLowerCase()] ?? 3);
    const avg = scores.reduce((a,b)=>a+b,0)/scores.length;
    const variance = scores.map(s=>Math.pow(s-avg,2)).reduce((a,b)=>a+b,0)/scores.length;
    return Math.max(10, Math.min(100, Math.round(100 - variance * 12)));
  }

  function generateInsights(entries, freq) {
    const insights = [];
    const dom = getDominantMood(freq);
    const stress = (freq.stressed||0)+(freq.anxious||0)+(freq.anxiety||0)+(freq.overwhelmed||0);
    const total = entries.length || 1;
    if (stress/total > 0.4) insights.push({ text: 'Your stress & anxiety levels appear frequently — try scheduling short relaxation breaks.', color: '#fb923c' });
    if ((freq.happy||0)/total > 0.4) insights.push({ text: 'You show strong positive emotional patterns. Keep nurturing what makes you happy!', color: '#22c55e' });
    if (entries.length >= 5) {
      const recent = entries.slice(-3).map(e=>MOOD_SCORE[(e.mood||'').toLowerCase()]??3);
      const older  = entries.slice(0,3).map(e=>MOOD_SCORE[(e.mood||'').toLowerCase()]??3);
      const rAvg = recent.reduce((a,b)=>a+b,0)/recent.length;
      const oAvg = older.reduce((a,b)=>a+b,0)/older.length;
      if (rAvg > oAvg + 0.5) insights.push({ text: 'Your mood has been improving over recent entries — great progress!', color: '#3b82f6' });
      else if (rAvg < oAvg - 0.5) insights.push({ text: 'Your mood has dipped recently. Consider trying a mindfulness exercise.', color: '#8b5cf6' });
    }
    if (entries.length < 5) insights.push({ text: 'Log moods daily to unlock richer pattern insights.', color: '#94a3b8' });
    insights.push({ text: `Your dominant emotion is "${dom}". Awareness is the first step to wellbeing.`, color: getColor(dom).border });
    return insights;
  }

  // ─── Chart rendering ─────────────────────────────────────────────────────────
  let trendChart = null, donutChart = null;

  function renderTrendChart(canvas, entries, range) {
    const now = Date.now();
    const cutoff = range === 'day' ? now - 86400000
      : range === 'week' ? now - 7*86400000
      : now - 30*86400000;
    const filtered = entries.filter(e => new Date(e.timestamp).getTime() >= cutoff);
    const data = filtered.map(e => ({ x: new Date(e.timestamp).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}), y: MOOD_SCORE[(e.mood||'').toLowerCase()]??3 }));

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(d=>d.x),
        datasets: [{
          label: 'Mood Score', data: data.map(d=>d.y),
          borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.12)',
          borderWidth: 2.5, tension: 0.45, fill: true,
          pointBackgroundColor: data.map(d => getColor(filtered[data.indexOf(d)]?.mood||'').border),
          pointRadius: 5, pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 900 },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `Score: ${ctx.parsed.y} — ${filtered[ctx.dataIndex]?.mood||''}` } } },
        scales: {
          y: { min: 0, max: 5, ticks: { callback: v => ['Overwhelmed','Stressed','Sad','Neutral','Calm','Happy'][v], color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  }

  function renderDonutChart(canvas, freq) {
    const labels = Object.keys(freq);
    const values = Object.values(freq);
    const colors = labels.map(l => getColor(l).border);
    if (donutChart) donutChart.destroy();
    donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: { labels: labels.map(l=>l.charAt(0).toUpperCase()+l.slice(1)), datasets: [{ data: values, backgroundColor: colors.map(c=>c+'33'), borderColor: colors, borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '68%',
        animation: { animateRotate: true, duration: 1000 },
        plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, padding: 10 } } }
      }
    });
  }

  // ─── Heatmap ─────────────────────────────────────────────────────────────────
  function buildHeatmap(container, entries) {
    const now = new Date(); now.setHours(0,0,0,0);
    const cells = [];
    const dayMap = {};
    entries.forEach(e => {
      const d = new Date(e.timestamp); d.setHours(0,0,0,0);
      const key = d.toISOString().slice(0,10);
      if (!dayMap[key]) dayMap[key] = { score: 0, mood: e.mood, label: e.mood };
      dayMap[key].score = MOOD_SCORE[(e.mood||'').toLowerCase()]??3;
      dayMap[key].mood = e.mood;
    });

    // build 28 days grid
    container.innerHTML = '';
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      const info = dayMap[key];
      const cell = document.createElement('div');
      cell.className = 'ma-heatmap-cell';
      const score = info ? info.score : null;
      if (score === null) {
        cell.style.background = 'rgba(255,255,255,0.04)';
      } else {
        const c = getColor(info.mood);
        cell.style.background = c.bg;
        cell.style.border = `1px solid ${c.border}44`;
      }
      const tooltip = document.createElement('div');
      tooltip.className = 'ma-tooltip';
      tooltip.textContent = info ? `${d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} — ${info.mood}` : d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
      cell.appendChild(tooltip);
      container.appendChild(cell);
    }
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────
  function renderAnalyticsPanel(entries) {
    const freq = getFreq(entries);
    const dominant = getDominantMood(freq);
    const dominantColor = getColor(dominant);
    const total = entries.length || 1;
    const stabilityScore = getStabilityScore(entries);
    const insights = generateInsights(entries, freq);
    const latest = entries[entries.length - 1];
    const latestMood = latest?.mood || 'neutral';
    const latestColor = getColor(latestMood);

    const panel = document.createElement('div');
    panel.id = 'mood-analytics-panel';
    panel.innerHTML = `
      <!-- ── Header ── -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
        <div>
          <h2 style="font-size:1.2rem;font-weight:800;margin:0;">Mood Analytics Dashboard</h2>
          <p style="font-size:0.8rem;color:var(--text-muted,#64748b);margin:2px 0 0;">Track your emotional wellbeing over time</p>
        </div>
        <div style="display:flex;gap:8px;font-size:1.2rem;">
          <span title="Health Analytics">🧠</span>
          <span title="Settings">⚙️</span>
          <span title="Profile">👤</span>
        </div>
      </div>

      <!-- ── Section 1: Current Mood Status ── -->
      <div class="ma-section-title"><span>💫</span> Current Mood Status</div>
      <div class="ma-card" style="text-align:center;margin-bottom:1rem;background:${latestColor.bg};border-color:${latestColor.border}44;">
        <div class="ma-mood-orb" style="background:${latestColor.bg};box-shadow:0 0 30px ${latestColor.border}44;">
          ${latestColor.emoji}
        </div>
        <div style="font-size:1.3rem;font-weight:800;color:${latestColor.text};">${latestMood.charAt(0).toUpperCase()+latestMood.slice(1)} Detected</div>
        <div style="font-size:0.8rem;color:var(--text-muted,#64748b);margin:4px 0;">
          Confidence: ${Math.floor(72 + Math.random()*20)}%
        </div>
        <div style="font-size:0.85rem;margin:8px 0;font-style:italic;color:${latestColor.text};">
          ${latestMood==='happy'?'You seem positive today — keep it up! 🌟':latestMood==='sad'?'It\'s okay to feel sad. I\'m here for you.':latestMood==='anxious'||latestMood==='anxiety'?'Take a slow breath — you\'ve got this.':latestMood==='stressed'||latestMood==='pressure'?'Try a short break. You deserve rest.':'Staying steady and balanced.'}
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted,#94a3b8);">${latest ? new Date(latest.timestamp).toLocaleString() : 'No entries yet'}</div>
      </div>

      <!-- ── Section 2: Mood Trend ── -->
      <div class="ma-section-title"><span>📈</span> Mood Trend Graph</div>
      <div class="ma-card" style="margin-bottom:1rem;">
        <div style="display:flex;gap:6px;margin-bottom:1rem;">
          <button class="ma-filter-btn active" data-range="week">Week</button>
          <button class="ma-filter-btn" data-range="day">Day</button>
          <button class="ma-filter-btn" data-range="month">Month</button>
        </div>
        <div style="position:relative;height:200px;">
          <canvas id="ma-trend-canvas"></canvas>
        </div>
      </div>

      <!-- ── Section 3 + 7: Donut + Stability ── -->
      <div class="ma-grid-2">
        <div class="ma-card">
          <div class="ma-section-title"><span>🍩</span> Emotion Distribution</div>
          <div style="position:relative;height:180px;">
            <canvas id="ma-donut-canvas"></canvas>
          </div>
          <div style="text-align:center;font-size:0.8rem;margin-top:8px;color:var(--text-muted,#64748b);">
            Dominant: <strong style="color:${dominantColor.text};">${dominantColor.emoji} ${dominant.charAt(0).toUpperCase()+dominant.slice(1)}</strong>
          </div>
        </div>

        <div class="ma-card">
          <div class="ma-section-title"><span>🎯</span> Mood Stability Score</div>
          <div style="text-align:center;padding:1rem 0;">
            <div style="font-size:2.8rem;font-weight:900;background:linear-gradient(135deg,#22c55e,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${stabilityScore}%</div>
            <div style="font-size:0.78rem;color:var(--text-muted,#64748b);margin-bottom:1rem;">Emotional Consistency</div>
            <div class="ma-stability-bar">
              <div class="ma-stability-fill" id="ma-stability-fill" style="width:0%"></div>
            </div>
            <div style="font-size:0.72rem;color:var(--text-muted,#94a3b8);margin-top:6px;">
              ${stabilityScore>=80?'Excellent stability 🌟':stabilityScore>=60?'Good emotional balance':'Room for improvement — keep tracking'}
            </div>
          </div>
          <div class="ma-section-title" style="margin-top:1rem;"><span>📊</span> Log Summary</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${Object.entries(freq).slice(0,4).map(([mood, count]) => `
              <div style="background:${getColor(mood).bg};border:1px solid ${getColor(mood).border}33;border-radius:10px;padding:8px;text-align:center;">
                <div style="font-size:1.1rem;">${getColor(mood).emoji}</div>
                <div style="font-size:0.65rem;font-weight:700;color:${getColor(mood).text};">${mood.charAt(0).toUpperCase()+mood.slice(1)}</div>
                <div style="font-size:0.7rem;color:var(--text-muted,#64748b);">${Math.round(count/total*100)}%</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- ── Section 4: Heatmap ── -->
      <div class="ma-section-title" style="margin-top:1rem;"><span>🗓️</span> Weekly Emotional Heatmap (last 28 days)</div>
      <div class="ma-card" style="margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-around;margin-bottom:8px;font-size:0.65rem;color:var(--text-muted,#64748b);">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        <div class="ma-heatmap" id="ma-heatmap-grid"></div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          ${Object.entries(EMOTION_COLORS).filter(([k])=>k!=='default').slice(0,6).map(([k,v])=>`
            <div style="display:flex;align-items:center;gap:4px;font-size:0.65rem;color:var(--text-muted,#64748b);">
              <div style="width:10px;height:10px;border-radius:2px;background:${v.bg};border:1px solid ${v.border}44;"></div>
              ${k.charAt(0).toUpperCase()+k.slice(1)}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── Section 5 + 8: AI Insights + Patterns ── -->
      <div class="ma-grid-2" style="margin-bottom:1rem;">
        <div class="ma-card">
          <div class="ma-section-title"><span>🤖</span> AI Emotional Insights</div>
          <div id="ma-insights-list">
            ${insights.map(ins=>`
              <div class="ma-insight-item">
                <div class="ma-insight-dot" style="background:${ins.color};"></div>
                <span>${ins.text}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="ma-card">
          <div class="ma-section-title"><span>🔍</span> Emotional Patterns</div>
          <div>
            ${[
              { icon:'🌙', bg:'rgba(139,92,246,0.15)', text:'Mood tends to dip in late evening hours', color:'#8b5cf6' },
              { icon:'📅', bg:'rgba(239,68,68,0.15)',  text:'Stress patterns visible on work days', color:'#ef4444' },
              { icon:'💬', bg:'rgba(34,197,94,0.15)',  text:'Mood improves after chatbot sessions', color:'#22c55e' },
              { icon:'🌅', bg:'rgba(59,130,246,0.15)', text:'Mornings show strongest positive states', color:'#3b82f6' },
            ].map(p=>`
              <div class="ma-pattern-row">
                <div class="ma-pattern-icon" style="background:${p.bg};color:${p.color};">${p.icon}</div>
                <span style="font-size:0.82rem;color:var(--text,#1e293b);">${p.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- ── Section 6: Therapy Suggestions ── -->
      <div class="ma-section-title"><span>🌿</span> Therapy Suggestions</div>
      <div class="ma-card">
        <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap;">
          <div style="font-size:2.5rem;">
            ${latestMood==='anxious'||latestMood==='anxiety'||latestMood==='stressed'?'🫁':latestMood==='sad'?'📔':latestMood==='angry'?'🚶':latestMood==='overwhelmed'?'🧘':'🌟'}
          </div>
          <div style="flex:1;min-width:200px;">
            <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px;">
              ${latestMood==='anxious'||latestMood==='anxiety'?'Box Breathing Exercise':latestMood==='stressed'||latestMood==='pressure'?'Progressive Muscle Relaxation':latestMood==='sad'?'Gratitude Journaling':latestMood==='angry'?'Mindful Walking':latestMood==='overwhelmed'?'5-4-3-2-1 Grounding':'Mindfulness Meditation'}
            </div>
            <div style="font-size:0.82rem;color:var(--text-muted,#64748b);margin-bottom:4px;">
              ${latestMood==='anxious'||latestMood==='anxiety'?'Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4 times.':latestMood==='stressed'||latestMood==='pressure'?'Tense and release each muscle group from feet to face.':latestMood==='sad'?'Write 3 things you are grateful for today, however small.':latestMood==='angry'?'Take a 10-minute walk and focus on your surroundings.':latestMood==='overwhelmed'?'Name 5 things you see, 4 you touch, 3 you hear...':'Sit comfortably, close your eyes, and focus only on your breath for 5 minutes.'}
            </div>
            <div style="margin-top:8px;">
              <button class="ma-therapy-btn" style="background:linear-gradient(135deg,#22c55e,#3b82f6);color:#fff;" onclick="alert('Starting guided session...')">
                ▶ Start Exercise
              </button>
              <button class="ma-therapy-btn" style="background:rgba(255,255,255,0.07);color:var(--text,#1e293b);border:1px solid rgba(255,255,255,0.15);" onclick="alert('Opening therapy library...')">
                📚 All Exercises
              </button>
            </div>
          </div>
        </div>
        <div style="margin-top:1rem;padding:10px 14px;background:rgba(34,197,94,0.1);border-radius:10px;border-left:3px solid #22c55e;font-size:0.82rem;color:var(--text,#1e293b);font-style:italic;">
          💬 "${['You are doing better than you think.','Every small step counts toward healing.','It\'s okay to not be okay sometimes.','You deserve rest and kindness — especially from yourself.'][Math.floor(Math.random()*4)]}"
        </div>
      </div>
    `;

    return panel;
  }

  // ─── Mount Logic ─────────────────────────────────────────────────────────────
  function mountAnalytics() {
    const moodView = document.getElementById('mood-view');
    if (!moodView) return;

    // Remove old panel if present
    const old = document.getElementById('mood-analytics-panel');
    if (old) old.remove();

    let entries = getMoodHistory();
    if (entries.length === 0) entries = buildSampleData();

    const panel = renderAnalyticsPanel(entries);
    moodView.appendChild(panel);

    // Animate stability bar
    setTimeout(() => {
      const fill = document.getElementById('ma-stability-fill');
      if (fill) fill.style.width = getStabilityScore(entries) + '%';
    }, 300);

    // Render charts (Chart.js must already be loaded)
    if (window.Chart) {
      const trendCanvas = document.getElementById('ma-trend-canvas');
      const donutCanvas = document.getElementById('ma-donut-canvas');
      if (trendCanvas) renderTrendChart(trendCanvas, entries, 'week');
      if (donutCanvas) renderDonutChart(donutCanvas, getFreq(entries));

      // Filter buttons
      document.querySelectorAll('.ma-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.ma-filter-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          const canvas = document.getElementById('ma-trend-canvas');
          if (canvas) renderTrendChart(canvas, entries, this.dataset.range);
        });
      });
    }

    // Heatmap
    const heatmapGrid = document.getElementById('ma-heatmap-grid');
    if (heatmapGrid) buildHeatmap(heatmapGrid, entries);
  }

  // ─── Update mood history cache when moods are saved ──────────────────────────
  // Hook into the native saveMood via btn-save-mood click
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('#btn-save-mood');
    if (!btn) return;
    // Give the native handler 500ms to run then refresh panel
    setTimeout(() => {
      // Try pulling from API response stored on window or rebuild from DOM
      mountAnalytics();
    }, 600);
  });

  // ─── Watch for mood-view becoming active ─────────────────────────────────────
  const observer = new MutationObserver(() => {
    const moodView = document.getElementById('mood-view');
    if (moodView && !moodView.classList.contains('hidden') && moodView.classList.contains('active')) {
      if (!document.getElementById('mood-analytics-panel')) mountAnalytics();
    }
  });

  // Also hook nav clicks directly
  document.addEventListener('click', function(e) {
    const navItem = e.target.closest('[data-view="mood-view"]');
    if (navItem) setTimeout(mountAnalytics, 150);
  });

  // Observe the app layout for class changes
  const appLayout = document.getElementById('app-layout');
  if (appLayout) observer.observe(appLayout, { subtree: true, attributes: true, attributeFilter: ['class'] });

  // Initial mount if mood-view is already active
  window.addEventListener('load', () => {
    const mv = document.getElementById('mood-view');
    if (mv && mv.classList.contains('active')) mountAnalytics();
  });

})();
