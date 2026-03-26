import sys
import json
import re

EMOTION_KEYWORDS = {
    'sad': ['sad', 'depressed', 'crying', 'unhappy', 'lonely', 'miserable', 'grief', 'heartbroken'],
    'angry': ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'rage', 'hate'],
    'anxious': ['anxious', 'nervous', 'scared', 'worried', 'panic', 'fear', 'overwhelmed'],
    'stressed': ['stress', 'pressure', 'exhausted', 'tired', 'burnt out', 'overworked'],
    'happy': ['happy', 'joy', 'excited', 'good', 'great', 'awesome', 'wonderful']
}

def detect_emotion(text):
    text_lower = text.lower()
    scores = {emo: 0 for emo in EMOTION_KEYWORDS}
    
    words = re.findall(r'\b\w+\b', text_lower)
    
    for word in words:
        for emotion, keywords in EMOTION_KEYWORDS.items():
            if word in keywords:
                scores[emotion] += 1
                
    top_emotion = max(scores, key=scores.get)
    if scores[top_emotion] > 0:
        return {"emotion": top_emotion, "confidence": scores[top_emotion]}
    return {"emotion": "neutral", "confidence": 0}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        message = sys.argv[1]
        print(json.dumps(detect_emotion(message)))
    else:
        print(json.dumps({"error": "No input provided"}))
