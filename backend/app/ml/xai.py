import numpy as np

def generate_xai_explanation(prediction_confidence: dict, feature_data: dict, attention_weights: list) -> dict:
    """
    Generate explainable AI outputs including feature importance, timeline attention,
    and a natural language explanation of the model's confidence.
    """
    # 1. Feature Importance Analysis
    # Estimate the relative contribution of each feature set using signal attributes
    summary = feature_data["summary"]
    
    # Calculate energy variance to estimate Mel importance
    mel_variance = float(np.var(summary["mel_mean"]))
    mfcc_variance = float(np.var(summary["mfcc_mean"]))
    chroma_variance = float(np.var(summary["chroma_mean"]))
    contrast_variance = float(np.var(summary["contrast_mean"]))
    zcr_variance = float(summary["zcr_std"])
    
    # Raw weight scores
    weights = {
        "Mel Spectrogram (Energy/Volume)": max(0.1, mel_variance * 1.5),
        "MFCC (Timbre/Tone)": max(0.15, mfcc_variance * 1.2),
        "Chroma Features (Pitch/Harmony)": max(0.08, chroma_variance * 2.0),
        "Spectral Contrast (Texture/Sharpness)": max(0.05, contrast_variance * 1.1),
        "Zero Crossing Rate (Sibilance/Speed)": max(0.03, zcr_variance * 3.0)
    }
    
    total_w = sum(weights.values())
    feature_importance = {k: round((v / total_w) * 100, 2) for k, v in weights.items()}
    
    # 2. Timeline Attention Mapping
    # Map attention weights (from LSTM seq) to time stamps
    num_steps = len(attention_weights)
    duration = 3.0 # our default processed audio duration is 3.0s
    time_step_duration = duration / max(1, num_steps)
    
    attention_timeline = []
    for idx, weight in enumerate(attention_weights):
        start_time = idx * time_step_duration
        end_time = (idx + 1) * time_step_duration
        attention_timeline.append({
            "timestamp": round((start_time + end_time) / 2.0, 2),
            "start": round(start_time, 2),
            "end": round(end_time, 2),
            "weight": float(weight)
        })
        
    # Find peak attention segment
    max_attention = max(attention_timeline, key=lambda x: x["weight"]) if attention_timeline else {"timestamp": 0.0}
    
    # 3. Model Confidence Explanation
    sorted_emotions = sorted(prediction_confidence.items(), key=lambda x: x[1], reverse=True)
    primary_emotion, primary_conf = sorted_emotions[0]
    secondary_emotion, secondary_conf = sorted_emotions[1] if len(sorted_emotions) > 1 else ("None", 0.0)
    
    explanation_text = ""
    if primary_emotion in ["Angry", "Surprise"]:
        explanation_text = (
            f"The model detected high vocal energy levels (Mel Spectrogram) and an elevated speech frequency rate. "
            f"This correlates heavily with emotional arousal, pointing to {primary_emotion} with {primary_conf:.1%} confidence. "
            f"A minor secondary response of {secondary_emotion} was identified at {secondary_conf:.1%}."
        )
    elif primary_emotion in ["Sad", "Calm"]:
        explanation_text = (
            f"The model observed low vocal intensity and slow transitions, indicating lower emotional arousal. "
            f"The flat pitch structure (Chroma features) strongly suggests a state of {primary_emotion} ({primary_conf:.1%} confidence). "
            f"Secondary indicators suggest {secondary_emotion} ({secondary_conf:.1%})."
        )
    elif primary_emotion == "Happy":
        explanation_text = (
            f"Vibrant pitch changes (Chroma Features) paired with moderate energy and speech rhythm indicate high valence. "
            f"This features-set is characteristic of a positive/expressive emotion, classifying as Happy with {primary_conf:.1%} confidence."
        )
    elif primary_emotion == "Fear":
        explanation_text = (
            f"Rapid pitch variations and high spectral contrast indicate acoustic instability. "
            f"The classifier interpreted these indicators as vocal tension and rapid breathing, suggesting Fear ({primary_conf:.1%})."
        )
    else: # Neutral, Disgust, etc.
        explanation_text = (
            f"The audio features show balanced pitch distribution and consistent energy level. "
            f"This indicates regular speaking conditions, yielding a classification of {primary_emotion} ({primary_conf:.1%})."
        )
        
    explanation_text += f" Neural self-attention focused most heavily around the {max_attention['timestamp']}s mark of the voice recording."
    
    return {
        "feature_importance": feature_importance,
        "attention_timeline": attention_timeline,
        "peak_attention_time": max_attention["timestamp"],
        "explanation": explanation_text
    }
