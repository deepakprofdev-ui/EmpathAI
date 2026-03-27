/**
 * EmpathAI Analytics Layer — frontend/utils/analytics.js
 *
 * Lightweight, pure-JavaScript analytics engine for the Progress Dashboard.
 * - No external API calls
 * - No ML libraries
 * - Executes in < 20ms
 * - Always returns a valid object — never crashes on missing data
 *
 * Usage:
 *   const analytics = computeAnalytics({ moods, emotions, exercises, conversations });
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOOD_SCORES = {
  happy: 5,
  calm: 4,
  neutral: 3,
  sad: 2,
  angry: 1,
  stressed: 1,
  anxious: 1,
  anxiety: 1,
  pressure: 1,
  frustrated: 1,
  overwhelmed: 0,
};

const STRESS_EMOTIONS = new Set([
  'stressed', 'anxiety', 'anxious', 'pressure', 'overwhelmed', 'frustrated'
]);

// ---------------------------------------------------------------------------
// 1. Mood Score Calculation
// ---------------------------------------------------------------------------

function calcAverageMoodScore(moods) {
  if (!Array.isArray(moods) || moods.length === 0) return 0;

  const scores = moods.map(m => {
    const key = (m.mood || m.label || '').toLowerCase();
    return MOOD_SCORES[key] !== undefined ? MOOD_SCORES[key] : 3; // default neutral
  });

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10) / 10; // e.g. 3.4
}

// ---------------------------------------------------------------------------
// 2. Emotion Frequency Counter
// ---------------------------------------------------------------------------

function calcEmotionFrequency(emotions) {
  const freq = {};
  if (!Array.isArray(emotions) || emotions.length === 0) return freq;

  emotions.forEach(e => {
    const key = (e.emotion || e.mood || e.label || '').toLowerCase();
    if (!key) return;
    freq[key] = (freq[key] || 0) + 1;
  });

  return freq; // { happy: 5, sad: 3, anxiety: 4, ... }
}

// ---------------------------------------------------------------------------
// 3. Stress Level Percentage
// ---------------------------------------------------------------------------

function calcStressPercentage(emotions) {
  if (!Array.isArray(emotions) || emotions.length === 0) return 0;

  const stressCount = emotions.filter(e => {
    const key = (e.emotion || e.mood || e.label || '').toLowerCase();
    return STRESS_EMOTIONS.has(key);
  }).length;

  return Math.round((stressCount / emotions.length) * 100); // e.g. 42
}

// ---------------------------------------------------------------------------
// 4. Mood Trend Data  (sorted by timestamp)
// ---------------------------------------------------------------------------

function calcMoodTrend(moods) {
  if (!Array.isArray(moods) || moods.length === 0) return [];

  return moods
    .filter(m => m.timestamp)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(m => {
      const key = (m.mood || m.label || '').toLowerCase();
      return {
        date: new Date(m.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        moodScore: MOOD_SCORES[key] !== undefined ? MOOD_SCORES[key] : 3,
      };
    });
}

// ---------------------------------------------------------------------------
// 5. Exercise Completion Rate
// ---------------------------------------------------------------------------

function calcExerciseCompletion(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) return 0;

  const completed = exercises.filter(ex => ex.completed === true || ex.status === 'done').length;
  return Math.round((completed / exercises.length) * 100); // e.g. 60
}

// ---------------------------------------------------------------------------
// 6. Conversation Activity Count
// ---------------------------------------------------------------------------

function calcTotalMessages(conversations) {
  if (!Array.isArray(conversations)) return 0;
  return conversations.length;
}

// ---------------------------------------------------------------------------
// 7. AI Wellness Insight Generator
// ---------------------------------------------------------------------------

function generateWellnessInsight({ stressPercentage, moodTrend, totalMessages }) {
  if (stressPercentage > 50) {
    return 'You may benefit from relaxation exercises. Try deep breathing or a short mindfulness session.';
  }

  // Detect improving trend — compare first half avg vs second half avg
  if (moodTrend.length >= 4) {
    const mid = Math.floor(moodTrend.length / 2);
    const firstHalf = moodTrend.slice(0, mid);
    const secondHalf = moodTrend.slice(mid);
    const avgFirst = firstHalf.reduce((a, b) => a + b.moodScore, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b.moodScore, 0) / secondHalf.length;
    if (avgSecond > avgFirst + 0.3) {
      return 'Your mood shows positive improvement. Keep going — you\'re doing great! 🌟';
    }
  }

  if (totalMessages < 5) {
    return 'Try chatting regularly to track emotional progress and get better insights.';
  }

  return 'Your emotional insights help improve support quality. Keep tracking your mood!';
}

// ---------------------------------------------------------------------------
// Main Export — computeAnalytics(userData)
// ---------------------------------------------------------------------------

/**
 * Compute the full analytics payload for the dashboard.
 *
 * @param {Object} userData
 * @param {Array}  userData.moods         - mood log entries
 * @param {Array}  userData.emotions      - emotion detection log entries
 * @param {Array}  userData.exercises     - exercise log entries
 * @param {Array}  userData.conversations - conversation/message entries
 *
 * @returns {{
 *   averageMoodScore: number,
 *   stressPercentage: number,
 *   emotionFrequency: Object,
 *   moodTrend: Array,
 *   exerciseCompletion: number,
 *   totalMessages: number,
 *   wellnessInsight: string
 * }}
 */
function computeAnalytics(userData) {
  // Safe defaults for missing input
  const moods         = Array.isArray(userData && userData.moods)         ? userData.moods         : [];
  const emotions      = Array.isArray(userData && userData.emotions)      ? userData.emotions      : [];
  const exercises     = Array.isArray(userData && userData.exercises)     ? userData.exercises     : [];
  const conversations = Array.isArray(userData && userData.conversations) ? userData.conversations : [];

  // Run all calculations — pure sync JS, no awaits, no API calls
  const averageMoodScore   = calcAverageMoodScore(moods);
  const stressPercentage   = calcStressPercentage(emotions);
  const emotionFrequency   = calcEmotionFrequency(emotions);
  const moodTrend          = calcMoodTrend(moods);
  const exerciseCompletion = calcExerciseCompletion(exercises);
  const totalMessages      = calcTotalMessages(conversations);
  const wellnessInsight    = generateWellnessInsight({ stressPercentage, moodTrend, totalMessages });

  return {
    averageMoodScore,
    stressPercentage,
    emotionFrequency,
    moodTrend,
    exerciseCompletion,
    totalMessages,
    wellnessInsight,
  };
}

// Support both module environments (Babel/React) and plain script tags
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { computeAnalytics };
} else if (typeof window !== 'undefined') {
  window.EmpathAnalytics = { computeAnalytics };
}
<<<<<<< HEAD

export { computeAnalytics };
=======
>>>>>>> 436f9e14925a661809128a8df0b61d709422674d
