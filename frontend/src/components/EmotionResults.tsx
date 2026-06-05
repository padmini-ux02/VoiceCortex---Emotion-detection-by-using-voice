"use client";
import { motion } from "framer-motion";
import { getEmotionConfig, formatConfidence } from "@/utils/api";
import { Zap, TrendingUp, Info } from "lucide-react";

interface Prediction {
  id: number;
  detected_emotion: string;
  confidence_scores: Record<string, number>;
  feature_importance?: Record<string, number>;
  attention_weights?: number[];
  timeline_analysis?: Array<{ time: number; emotion: string; confidence: number }>;
  created_at: string;
}

interface Props {
  prediction: Prediction;
}

const BAR_COLORS: Record<string, string> = {
  Happy: "#f59e0b", Sad: "#6366f1", Angry: "#ef4444",
  Neutral: "#94a3b8", Fear: "#8b5cf6", Surprise: "#06b6d4",
  Disgust: "#84cc16", Calm: "#10b981",
};

export default function EmotionResults({ prediction }: Props) {
  const cfg = getEmotionConfig(prediction.detected_emotion);
  const sortedEmotions = Object.entries(prediction.confidence_scores).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* Primary Result Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring" }}
        className={`card border-2 ${cfg.bg}`}
        style={{ borderColor: cfg.hex + "66" }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl"
          >
            {cfg.emoji}
          </motion.div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
              Detected Emotion
            </p>
            <h2 className="text-3xl font-black" style={{ color: cfg.hex, fontFamily: "'Space Grotesk', sans-serif" }}>
              {prediction.detected_emotion}
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Confidence: <span className="font-bold" style={{ color: cfg.hex }}>{formatConfidence(prediction.confidence_scores[prediction.detected_emotion] || 0)}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white gradient-bg">
            <Zap size={12} /> AI Classified
          </div>
        </div>
      </motion.div>

      {/* Confidence Bar Chart */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-indigo-400" />
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>All Emotion Confidence Scores</h3>
        </div>
        <div className="space-y-3">
          {sortedEmotions.map(([emotion, score], i) => (
            <motion.div
              key={emotion}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span>{getEmotionConfig(emotion).emoji}</span>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{emotion}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: BAR_COLORS[emotion] || "#94a3b8" }}>
                  {formatConfidence(score)}
                </span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${score * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut" }}
                  style={{ background: BAR_COLORS[emotion] || "#94a3b8" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Feature Importance */}
      {prediction.feature_importance && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-cyan-400" />
            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Feature Importance (XAI)</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(prediction.feature_importance)
              .sort((a, b) => b[1] - a[1])
              .map(([feature, importance], i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs w-48 truncate flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                    {feature}
                  </span>
                  <div className="flex-1 progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${importance}%` }}
                      transition={{ duration: 0.7, delay: i * 0.07 }}
                      style={{ background: "linear-gradient(90deg, #06b6d4, #6366f1)" }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right" style={{ color: "var(--text-muted)" }}>
                    {importance.toFixed(1)}%
                  </span>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* Attention Timeline */}
      {prediction.attention_weights && prediction.attention_weights.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>🧠 Neural Attention Heatmap</h3>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Highlights which time segments the AI focused on most heavily
          </p>
          <div className="flex gap-0.5 h-12 items-end rounded-lg overflow-hidden">
            {prediction.attention_weights.map((w, i) => {
              const intensity = Math.max(0, Math.min(1, w));
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(10, intensity * 100)}%` }}
                  transition={{ delay: i * 0.03, duration: 0.5 }}
                  className="flex-1 rounded-t-sm"
                  style={{
                    background: `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`,
                  }}
                  title={`Time step ${i}: ${(intensity * 100).toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>0s</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>3s</span>
          </div>
        </div>
      )}
    </div>
  );
}
