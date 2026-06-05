import pytest
import numpy as np
import torch
from app.ml.features import extract_features_dict
from app.ml.model import SpeechEmotionModel, SpeechEmotionClassifier
from app.ml.xai import generate_xai_explanation

def test_feature_extraction():
    """
    Extract features from a dummy 3-second audio signal and verify that dimensions
    and return types are correct.
    """
    sr = 16000
    duration = 3.0
    # Generate dummy sine wave
    y = np.sin(2 * np.pi * 440 * np.arange(int(sr * duration)) / sr)
    
    features = extract_features_dict(y, sr)
    
    assert "summary" in features
    assert "grids" in features
    assert "mfcc_mean" in features["summary"]
    assert len(features["summary"]["mfcc_mean"]) == 40
    assert "zcr" in features["grids"]
    assert features["grids"]["mel_db"].shape[0] == 128

def test_model_forward():
    """
    Assert that the CNN-BiLSTM-Attention network evaluates forward passes correctly.
    """
    model = SpeechEmotionModel(num_classes=8)
    # Dummy mel spectrogram batch: [batch_size, channels, height, time_steps]
    dummy_input = torch.randn(2, 1, 128, 94) 
    
    logits, attn_weights = model(dummy_input)
    
    assert logits.shape == (2, 8)
    assert attn_weights.shape == (2, 11) # pool downsampled time dim from 94 to 11

def test_inference_and_xai():
    """
    Ensure the SpeechEmotionClassifier wrappers predict classes and generate XAI descriptions.
    """
    sr = 16000
    y = np.random.randn(int(sr * 3.0))
    features = extract_features_dict(y, sr)
    
    classifier = SpeechEmotionClassifier()
    conf, attn = classifier.predict(features)
    
    assert len(conf) == 8
    assert "Neutral" in conf
    
    xai = generate_xai_explanation(conf, features, attn)
    assert "feature_importance" in xai
    assert "explanation" in xai
    assert "Mel Spectrogram (Energy/Volume)" in xai["feature_importance"]
