import sys
import json

CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "want to die", 
    "give up", "hopeless", "hurt myself", "better off dead", 
    "cut myself", "overdose", "no reason to live"
]

def analyze_crisis(text):
    text_lower = text.lower()
    for kw in CRISIS_KEYWORDS:
        if kw in text_lower:
            return {"isCrisis": True, "trigger": kw}
    return {"isCrisis": False, "trigger": None}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        message = sys.argv[1]
        print(json.dumps(analyze_crisis(message)))
    else:
        print(json.dumps({"error": "No input provided"}))
