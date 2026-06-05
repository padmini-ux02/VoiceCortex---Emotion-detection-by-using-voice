import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("VoiceCortex-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Emotion styling helpers
export const EMOTION_CONFIG: Record<
  string,
  { color: string; bg: string; emoji: string; hex: string }
> = {
  Happy:    { color: "emotion-happy",    bg: "emotion-bg-happy",    emoji: "😊", hex: "#f59e0b" },
  Sad:      { color: "emotion-sad",      bg: "emotion-bg-sad",      emoji: "😢", hex: "#6366f1" },
  Angry:    { color: "emotion-angry",    bg: "emotion-bg-angry",    emoji: "😡", hex: "#ef4444" },
  Neutral:  { color: "emotion-neutral",  bg: "emotion-bg-neutral",  emoji: "😐", hex: "#94a3b8" },
  Fear:     { color: "emotion-fear",     bg: "emotion-bg-fear",     emoji: "😨", hex: "#8b5cf6" },
  Surprise: { color: "emotion-surprise", bg: "emotion-bg-surprise", emoji: "😲", hex: "#06b6d4" },
  Disgust:  { color: "emotion-disgust",  bg: "emotion-bg-disgust",  emoji: "🤢", hex: "#84cc16" },
  Calm:     { color: "emotion-calm",     bg: "emotion-bg-calm",     emoji: "😌", hex: "#10b981" },
};

export const getEmotionConfig = (emotion: string) =>
  EMOTION_CONFIG[emotion] ?? {
    color: "emotion-neutral",
    bg: "emotion-bg-neutral",
    emoji: "😐",
    hex: "#94a3b8",
  };

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatConfidence(val: number) {
  return `${(val * 100).toFixed(1)}%`;
}
