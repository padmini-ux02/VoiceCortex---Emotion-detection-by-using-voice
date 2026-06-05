"""
Feature extraction using Librosa.
If librosa/numpy are not installed, a fallback is used that returns
synthetic data so the API can still run and be tested.
"""
import os

try:
    import librosa
    import numpy as np
    import soundfile as sf
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

def preprocess_audio(file_path: str, target_sr: int = 16000, duration: float = 3.0):
    if not ML_AVAILABLE:
        raise RuntimeError("ML libraries (librosa, numpy) are not installed. Run: pip install librosa numpy soundfile")
    import numpy as np
    y, sr = librosa.load(file_path, sr=target_sr, mono=True)
    y, _ = librosa.effects.trim(y, top_db=20)
    max_samples = int(duration * target_sr)
    if len(y) > max_samples:
        y = y[:max_samples]
    else:
        y = np.pad(y, (0, max_samples - len(y)), 'constant')
    return y

def extract_features_dict(y, sr: int = 16000) -> dict:
    if not ML_AVAILABLE:
        raise RuntimeError("ML libraries not installed.")
    import numpy as np
    zcr = librosa.feature.zero_crossing_rate(y=y)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr, n_fft=2048, hop_length=512)
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, n_fft=2048, hop_length=512)
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40, n_fft=2048, hop_length=512)
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr, n_fft=2048, hop_length=512)
    return {
        "summary": {
            "zcr_mean": float(np.mean(zcr)),
            "zcr_std": float(np.std(zcr)),
            "chroma_mean": [float(v) for v in np.mean(chroma, axis=1)],
            "chroma_std":  [float(v) for v in np.std(chroma, axis=1)],
            "mel_mean":    [float(v) for v in np.mean(mel_db, axis=1)],
            "mel_std":     [float(v) for v in np.std(mel_db, axis=1)],
            "mfcc_mean":   [float(v) for v in np.mean(mfcc, axis=1)],
            "mfcc_std":    [float(v) for v in np.std(mfcc, axis=1)],
            "contrast_mean": [float(v) for v in np.mean(contrast, axis=1)],
            "contrast_std":  [float(v) for v in np.std(contrast, axis=1)],
        },
        "grids": {
            "zcr": zcr, "chroma": chroma, "mel_db": mel_db,
            "mfcc": mfcc, "contrast": contrast
        }
    }

def trim_audio_file(input_path: str, output_path: str, start_sec: float, end_sec: float, sr: int = 16000) -> str:
    if not ML_AVAILABLE:
        raise RuntimeError("ML libraries not installed.")
    y, _ = librosa.load(input_path, sr=sr)
    trimmed_y = y[int(start_sec * sr):int(end_sec * sr)]
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    sf.write(output_path, trimmed_y, sr)
    return output_path
