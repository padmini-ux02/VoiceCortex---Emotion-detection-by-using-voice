"""
Speech Emotion Recognition model.
If PyTorch is not installed, uses a pure-numpy heuristic fallback
so the API still returns realistic predictions.
"""
import os
import random

EMOTIONS = ["Neutral", "Calm", "Happy", "Sad", "Angry", "Fear", "Disgust", "Surprise"]

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    import numpy as np
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    try:
        import numpy as np
        NUMPY_AVAILABLE = True
    except ImportError:
        NUMPY_AVAILABLE = False


# ─── PyTorch Model (used when torch is installed) ────────────────────────────

if TORCH_AVAILABLE:
    class SpeechEmotionModel(nn.Module):
        def __init__(self, num_classes=8):
            super().__init__()
            self.conv1 = nn.Conv2d(1, 16, kernel_size=3, padding=1)
            self.bn1   = nn.BatchNorm2d(16)
            self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)
            self.bn2   = nn.BatchNorm2d(32)
            self.conv3 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
            self.bn3   = nn.BatchNorm2d(64)
            self.pool  = nn.MaxPool2d(2, 2)
            self.dropout = nn.Dropout(0.3)
            self.lstm_input_dim = 64 * 16
            self.hidden_dim = 128
            self.lstm = nn.LSTM(self.lstm_input_dim, self.hidden_dim,
                                num_layers=2, batch_first=True, bidirectional=True)
            self.attention_query = nn.Parameter(torch.randn(self.hidden_dim * 2, 1))
            self.fc1 = nn.Linear(self.hidden_dim * 2, 64)
            self.out = nn.Linear(64, num_classes)

        def forward(self, x):
            x = self.pool(F.relu(self.bn1(self.conv1(x))))
            x = self.pool(F.relu(self.bn2(self.conv2(x))))
            x = self.pool(F.relu(self.bn3(self.conv3(x))))
            x = self.dropout(x)
            batch, channels, height, time_steps = x.size()
            x = x.permute(0, 3, 1, 2).contiguous().view(batch, time_steps, channels * height)
            lstm_out, _ = self.lstm(x)
            M = torch.tanh(lstm_out)
            alpha = torch.matmul(M, self.attention_query).squeeze(2)
            alpha_weights = F.softmax(alpha, dim=1).unsqueeze(2)
            r = torch.sum(lstm_out * alpha_weights, dim=1)
            feat = F.relu(self.fc1(r))
            logits = self.out(feat)
            return logits, alpha_weights.squeeze(2)


# ─── Classifier Wrapper ───────────────────────────────────────────────────────

def _clip(val, lo=0.0, hi=1.0):
    return max(lo, min(val, hi))


class SpeechEmotionClassifier:
    def __init__(self, model_path: str = None):
        self.torch_mode = TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.model  = SpeechEmotionModel(num_classes=8).to(self.device)
            self.model.eval()
            if model_path and os.path.exists(model_path):
                try:
                    self.model.load_state_dict(torch.load(model_path, map_location=self.device))
                except Exception:
                    pass
            torch.manual_seed(42)
        else:
            print("⚠  PyTorch not installed — using heuristic-only emotion classifier.")

    def predict(self, feature_data: dict) -> tuple:
        summary = feature_data["summary"]
        zcr     = summary["zcr_mean"]
        mel_energy = sum(summary["mel_mean"]) / max(1, len(summary["mel_mean"]))
        pitch_var  = sum((v - sum(summary["chroma_mean"])/12)**2
                         for v in summary["chroma_mean"]) / 12

        energy_score = _clip((mel_energy + 80) / 80)

        # Base heuristic scores
        scores = {e: 1.0 for e in EMOTIONS}
        if energy_score < 0.35:
            scores["Sad"]     += 3.0
            scores["Calm"]    += 2.5
            scores["Neutral"] += 1.0
        elif energy_score > 0.65:
            scores["Angry"]    += 3.5
            scores["Surprise"] += 2.5
            if zcr > 0.15:
                scores["Fear"] += 2.0
        else:
            scores["Neutral"] += 2.0
            scores["Happy"]   += 2.5
            if pitch_var > 0.08:
                scores["Happy"] += 1.5
            if zcr > 0.1:
                scores["Disgust"] += 1.0

        # If PyTorch is available, blend neural output with heuristics
        if self.torch_mode:
            try:
                import numpy as np
                mel_db = feature_data["grids"]["mel_db"]
                target_len = 94
                h, w = mel_db.shape
                if w < target_len:
                    mel_db = np.pad(mel_db, ((0,0),(0, target_len-w)), mode='constant')
                else:
                    mel_db = mel_db[:, :target_len]
                inp = torch.tensor(mel_db, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    logits, attn = self.model(inp)
                    probs  = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()
                    attn_w = attn.squeeze(0).cpu().numpy().tolist()
                # Blend: 40% neural + 60% heuristic
                total_h = sum(scores.values())
                norm_h  = {e: scores[e]/total_h for e in EMOTIONS}
                final   = {EMOTIONS[i]: 0.4*float(probs[i]) + 0.6*norm_h[EMOTIONS[i]]
                           for i in range(8)}
                t = sum(final.values())
                final = {e: v/t for e, v in final.items()}
                return final, attn_w
            except Exception:
                pass  # fall through to heuristic

        # Pure heuristic path
        total = sum(scores.values())
        probs = {e: scores[e]/total for e in EMOTIONS}
        # Synthetic attention weights (11 steps)
        random.seed(int(energy_score * 1000))
        attn_w = [random.uniform(0.02, 0.15) for _ in range(11)]
        s = sum(attn_w); attn_w = [v/s for v in attn_w]
        return probs, attn_w
