const EMOTIONS = {
  happy: ['happy', 'good', 'relieved', 'excited', 'proud', 'thankful'],
  sad: ['sad', 'crying', 'unhappy', 'lonely', 'depressed'],
  anxiety: ['anxious', 'worried', 'nervous', 'panic', 'fear'],
  pressure: ['pressure', 'deadline', 'exam stress', 'workload'],
  frustrated: ['frustrated', 'irritated', 'annoyed'],
  angry: ['angry', 'mad', 'hate', 'furious'],
  overwhelmed: ['overwhelmed', 'exhausted', 'drained'],
  calm: ['calm', 'relaxed', 'peaceful', 'fine']
};

const RESTRICTED_CATEGORIES = [
  'self harm', 
  'suicide',
  'kill myself',
  'how to die',
  'suicide method',
  'hurt someone',
  'bomb making',
  'hate group',
  'extreme violence',
  'harm others',
  'drug abuse instructions',
  'die',
  'end my life'
];

/**
 * Executes a zero-latency string heuristic on the message to categorize emotions and catch sensitive behavior without an ML model.
 */
function fastAnalyzeMessage(text) {
  const lowerText = text.toLowerCase();

  // 1. Sensitive Content Restriction logic
  for (const word of RESTRICTED_CATEGORIES) {
    if (lowerText.includes(word)) {
      return {
        isSensitive: true,
        emotion: 'critical',
        risk_flag: true,
        safe_reply: "I’m really sorry that you're feeling this way. I’m not able to help with that request, but you’re not alone. You may consider reaching out to a trusted person or professional for support."
      };
    }
  }

  // 2. Fast Emotion Keyword mapping
  let detectedEmotion = 'neutral';
  
  for (const [emotion, keywords] of Object.entries(EMOTIONS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      detectedEmotion = emotion;
      break;
    }
  }

  return {
    isSensitive: false,
    emotion: detectedEmotion,
    risk_flag: false
  };
}

module.exports = { fastAnalyzeMessage };
