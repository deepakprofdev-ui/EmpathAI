/**
 * EmpathAI — Chat Fix Plugin (chatFix.js)
 *
 * Patches the existing chat rendering pipeline to:
 * 1. Properly display the structured 3-part AI response (Acknowledge / Support / Suggest)
 * 2. Render the "Emotion: 😊 Happy" line as a styled pill instead of plain text
 * 3. Ensure the userId is always resolved correctly before sending chat requests
 *
 * No existing files are modified.
 */

(function () {
  'use strict';

  // ── Emotion color map (mirrors backend labels) ──────────────────────────────
  const EMOTION_PILL = {
    'happy':      { color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
    'sad':        { color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
    'neutral':    { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)'},
    'anxiety':    { color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
    'stress':     { color: '#f87171', bg: 'rgba(248,113,113,0.15)'},
    'lonely':     { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)'},
    'angry':      { color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
    'tired':      { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
    'sick':       { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
    'overwhelmed':{ color: '#c084fc', bg: 'rgba(192,132,252,0.15)'},
    'motivated':  { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  };

  function getEmotionStyle(label) {
    return EMOTION_PILL[(label || '').toLowerCase()] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };
  }

  // ── Style injection ──────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .ai-response-body { display: flex; flex-direction: column; gap: 8px; }
    .ai-response-text { line-height: 1.65; font-size: 0.92rem; white-space: pre-wrap; }
    .ai-emotion-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 12px; border-radius: 50px;
      font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em;
      border: 1px solid currentColor; opacity: 0.9;
      align-self: flex-start; margin-top: 4px;
    }
    .ai-suggestion-block {
      padding: 8px 12px;
      border-radius: 10px;
      background: rgba(255,255,255,0.05);
      border-left: 3px solid var(--primary, #00d4ff);
      font-size: 0.82rem;
      color: var(--text-muted, #94a3b8);
      font-style: italic;
    }
  `;
  document.head.appendChild(style);

  // ── Parse and render structured AI response ──────────────────────────────────
  function renderStructuredAIMessage(rawText) {
    // Match the "Emotion: 😊 Happy" line at the end
    const emotionMatch = rawText.match(/Emotion:\s*([\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE0F\u200D\u{1F900}-\u{1F9FF}]*)\s*(\w+)/u);

    let bodyText = rawText;
    let emotionPill = '';

    if (emotionMatch) {
      const fullEmotionLine = emotionMatch[0];
      const emoji = emotionMatch[1].trim();
      const label = emotionMatch[2].trim();
      bodyText = rawText.replace(fullEmotionLine, '').trim();

      const style = getEmotionStyle(label);
      emotionPill = `<span class="ai-emotion-pill" style="color:${style.color};background:${style.bg};border-color:${style.color}44;">
        ${emoji} ${label}
      </span>`;
    }

    // Detect suggestion lines (3rd structural part — usually starts with "Try", "You could", "Consider")
    const lines = bodyText.split('\n').filter(l => l.trim());
    let mainText = '';
    let suggestionLine = '';

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      if ((l.startsWith('Try') || l.startsWith('You could') || l.startsWith('Consider') || l.startsWith('You might')) && i >= 1) {
        suggestionLine = l;
        mainText = lines.slice(0, i).join('\n');
      }
    }
    if (!suggestionLine) mainText = bodyText;

    const suggestionHtml = suggestionLine
      ? `<div class="ai-suggestion-block">💡 ${escSafe(suggestionLine)}</div>`
      : '';

    return `<div class="ai-response-body">
      <div class="ai-response-text">${escSafe(mainText)}</div>
      ${suggestionHtml}
      ${emotionPill}
    </div>`;
  }

  function escSafe(t) {
    return (t || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Intercept the addMessage function once the page is ready ─────────────────
  function patchAddMessage() {
    // addMessage is defined in the global scope by chat.js
    // We wrap it so AI messages go through our renderer
    if (typeof window.addMessage !== 'function' && typeof addMessage !== 'function') {
      // Not yet available — retry
      setTimeout(patchAddMessage, 200);
      return;
    }

    // Use a MutationObserver on chat-messages to post-process newly added AI bubbles
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) { setTimeout(patchAddMessage, 200); return; }

    const msgObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          if (!node.classList.contains('message') || !node.classList.contains('ai')) return;
          // It's a new AI message bubble
          const contentEl = node.querySelector('.message-content');
          if (!contentEl || contentEl.classList.contains('typing-bubble')) return;
          // Check if it contains an Emotion: line
          const rawText = contentEl.textContent || '';
          if (!rawText.includes('Emotion:')) return;
          // Replace with structured rendering
          contentEl.innerHTML = renderStructuredAIMessage(rawText);
        });
      });
    });

    msgObserver.observe(chatMessages, { childList: true });
  }

  // ── Fix userId resolution in fetch requests ─────────────────────────────────
  // Patch the global fetch to inject userId when sending to /api/chat if missing
  const originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    try {
      if (options && options.body && typeof url === 'string' && url.includes('/chat')) {
        const parsed = JSON.parse(options.body);
        if (!parsed.userId && !parsed.user_id) {
          // Try to resolve from localStorage or state
          const storedId = localStorage.getItem('empathai_user_id');
          if (storedId) {
            parsed.userId = storedId;
            options = { ...options, body: JSON.stringify(parsed) };
          }
        }
      }
    } catch (_) { /* never crash the original request */ }
    return originalFetch.call(this, url, options);
  };

  // ── Initialize ────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchAddMessage);
  } else {
    patchAddMessage();
  }

})();
