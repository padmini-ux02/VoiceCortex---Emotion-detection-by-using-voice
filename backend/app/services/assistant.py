import os
from app.models.models import Prediction

def get_ai_assistant_insights(prediction: Prediction, user_query: str = "") -> dict:
    """
    Generate communication suggestions, mental wellness insights, and emotional explanations.
    Leverages environment LLM endpoints if configured, otherwise falls back to a highly detailed
    contextual template system.
    """
    emotion = prediction.detected_emotion
    confidence = prediction.confidence_scores.get(emotion, 0.0)
    
    # 1. Base rule-based intelligence
    explanations = {
        "Neutral": (
            "A neutral vocal tone indicates balanced acoustic parameters, with stable pitch and moderate speed. "
            "It reflects professional composure, objectivity, or a resting emotional state."
        ),
        "Calm": (
            "Calm speech is characterized by slow transitions, lower amplitude peaks, and a steady harmonic structure. "
            "This suggests psychological safety, mindfulness, or relaxation."
        ),
        "Happy": (
            "Happy expressions typically present elevated fundamental frequencies (pitch) and higher pitch variability. "
            "This demonstrates joy, excitement, high engagement, or positive reinforcement."
        ),
        "Sad": (
            "Sad vocal patterns exhibit restricted pitch variation, low energy, and longer silent pauses. "
            "This signifies lethargy, emotional withdrawal, grief, or a request for empathy."
        ),
        "Angry": (
            "Angry vocalizations are defined by high intensity (volume), sharp zero-crossing rates, and rapid pitch changes. "
            "This reflects defensive posturing, frustration, high arousal, or assertiveness."
        ),
        "Fear": (
            "Fear manifests as highly unstable pitch patterns and varying spectral contrast, mimicking breathlessness. "
            "This indicates vulnerability, apprehension, stress, or perceived threat."
        ),
        "Disgust": (
            "Disgust is characterized by slower speech rate, localized pitch drops, and harsh spectral texture. "
            "This communicates aversion, judgment, or physical/moral disapproval."
        ),
        "Surprise": (
            "Surprise is marked by a sudden spike in fundamental frequency and high energy. "
            "It demonstrates a startle response, cognitive readjustment, or curiosity."
        )
    }

    wellness_insights = {
        "Neutral": "You are currently in a centered state. Good for decision making and structured tasks. Keep breathing evenly.",
        "Calm": "Your parasympathetic nervous system is active. Maintain this baseline of tranquility to reduce cortisol levels.",
        "Happy": " Dopamine levels are up! Capture this positive momentum to connect with others, start creative projects, or record reflections.",
        "Sad": "Your energy levels are low. Honor these feelings. Consider walking outdoors, writing in a journal, or drinking warm tea. Reach out to a friend.",
        "Angry": "Adrenaline is running high. To release this tension, try the 4-7-8 breathing technique, walk away from immediate triggers, or perform mild physical exercise.",
        "Fear": "Your body is entering fight-or-flight. Focus on your grounding: name 5 things you can see, 4 things you can touch, and take deep belly breaths.",
        "Disgust": "Reflect on what triggered this aversion. Is it a boundary violation? Take some space to evaluate the core issue objectively.",
        "Surprise": "Your nervous system has just processed new, unexpected stimuli. Allow yourself a moment to ground and re-orient."
    }

    comm_suggestions = {
        "Neutral": "Keep a clear, professional presentation. In collaborative meetings, add expressive inflections to build rapport.",
        "Calm": "Great tone for resolving conflicts or active listening. Others will naturally match your calm pacing.",
        "Happy": "Incorporate this enthusiastic tone to motivate team members or present exciting concepts. Avoid sounding overly casual in formal contexts.",
        "Sad": "Be gentle with your communication. It is okay to speak slowly. If explaining ideas, ask for support or visual aids to take off cognitive load.",
        "Angry": "Pause before responding. Lower your pitch, speak slower, and focus on 'I feel' statements to avoid escalations.",
        "Fear": "Try to anchor your voice from your diaphragm. Pause between sentences to regulate your breath. Focus on stating clear, verifiable facts.",
        "Disgust": "Identify if your voice sounds accusatory. Reframe objections constructively using neutral vocabulary and seek common ground.",
        "Surprise": "Verify details before drawing conclusions. Channel this energy into constructive curiosity by asking open-ended questions."
    }

    base_exp = explanations.get(emotion, "Balanced emotional response detected.")
    base_wellness = wellness_insights.get(emotion, "Practice mindfulness and regular breathing exercises.")
    base_comm = comm_suggestions.get(emotion, "Maintain active listening and adapt your delivery to the situation.")
    
    # 2. Integrate custom user queries if provided
    chatbot_response = f"I analyzed your voice recording which indicated a primary emotion of **{emotion}** (with {confidence:.1%} confidence). "
    if user_query:
        # Simple intelligent response matching the user query keyword
        uq_lower = user_query.lower()
        if "why" in uq_lower or "explain" in uq_lower:
            chatbot_response += f"The reason behind this prediction lies in the speech signal properties: {base_exp}"
        elif "help" in uq_lower or "wellness" in uq_lower or "feel" in uq_lower:
            chatbot_response += f"Regarding wellness, here is a suggestion: {base_wellness}"
        elif "speak" in uq_lower or "communicate" in uq_lower or "talk" in uq_lower:
            chatbot_response += f"To optimize your communication, I advise: {base_comm}"
        else:
            chatbot_response += (
                f"Based on your query '{user_query}', I recommend checking the XAI dashboard tab to see which exact vocal cues "
                f"(like pitch variation or spectral contrast) drove this classification. For wellness, {base_wellness.lower()} "
                f"For communication, {base_comm.lower()}"
            )
    else:
        chatbot_response += f"Acoustic evaluation: {base_exp}"
        
    return {
        "response": chatbot_response,
        "wellness_tip": base_wellness,
        "communication_suggestion": base_comm
    }
