"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import AudioInput from "@/components/AudioInput";
import EmotionResults from "@/components/EmotionResults";
import AIAssistant from "@/components/AIAssistant";
import { Brain, Waves, BarChart3, Cpu, ArrowRight, FileText, Sparkles, Shield, Zap, Activity } from "lucide-react";
import Link from "next/link";
import { downloadPdf } from "@/utils/download";

const STATS = [
  { value: "8",    label: "Emotion Classes",    icon: "😊" },
  { value: "40",   label: "MFCC Coefficients",  icon: "🎵" },
  { value: "CNN",  label: "+ BiLSTM + Attention", icon: "🧠" },
  { value: "Real", label: "Time Analysis",       icon: "⚡" },
];

const FEATURES = [
  { icon: Waves,   label: "MFCC Extraction",    desc: "Mel-Frequency Cepstral Coefficients", color: "#6366f1" },
  { icon: Brain,   label: "Deep Learning",      desc: "CNN + BiLSTM + Attention Network",    color: "#8b5cf6" },
  { icon: BarChart3,label: "8 Emotions",        desc: "Happy, Sad, Angry, Calm & more",      color: "#06b6d4" },
  { icon: Cpu,     label: "Explainable AI",     desc: "Feature importance & attention maps", color: "#ec4899" },
  { icon: Shield,  label: "Privacy First",      desc: "Audio processed locally on-server",   color: "#10b981" },
  { icon: Zap,     label: "Instant Results",    desc: "Sub-second inference pipeline",       color: "#f59e0b" },
];

type PredType = {
  id: number;
  detected_emotion: string;
  confidence_scores: Record<string, number>;
  feature_importance?: Record<string, number>;
  attention_weights?: number[];
  timeline_analysis?: Array<{ time: number; emotion: string; confidence: number }>;
  created_at: string;
} | null;

export default function HomePage() {
  const [prediction, setPrediction] = useState<PredType>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "xai" | "assistant">("results");

  return (
    <div className="min-h-screen gradient-hero" style={{ position: "relative" }}>
      {/* Background grid */}
      <div className="hero-mesh absolute inset-0 pointer-events-none" />

      <Navbar />

      <main className="container-main py-10 relative">

        {/* ═══ HERO — shown before first analysis ═══ */}
        <AnimatePresence>
          {!prediction && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 pt-6"
            >
              {/* Status pill */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  color: "#a5b4fc",
                  letterSpacing: "0.04em",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                AI ENGINE READY · PRODUCTION GRADE · v2.0
              </motion.div>

              {/* Main headline */}
              <h1
                className="text-5xl md:text-7xl font-black leading-[1.05] mb-5 font-display tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Hear the{" "}
                <span className="gradient-text-aurora">Emotion</span>
                <br />
                <span style={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.8em" }}>
                  Behind Every Word
                </span>
              </h1>

              <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10" style={{ color: "var(--text-secondary)" }}>
                Upload or record your voice. Our <strong style={{ color: "var(--text-primary)" }}>CNN + BiLSTM + Attention</strong> deep learning
                engine classifies emotions in real time with explainable AI insights.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                {STATS.map((s) => (
                  <motion.div
                    key={s.label}
                    whileHover={{ y: -3 }}
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <div className="text-left">
                      <p className="font-black text-lg leading-none font-mono gradient-text">{s.value}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Feature grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                {FEATURES.map(({ icon: Icon, label, desc, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ y: -4 }}
                    className="card text-left p-4 group cursor-default"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: color + "22", border: `1px solid ${color}44` }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                    <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ ANALYSIS LAYOUT ═══ */}
        <div className={`grid gap-6 ${prediction ? "lg:grid-cols-2" : "max-w-xl mx-auto"}`}>

          {/* ── Left: Audio Input ── */}
          <div className="space-y-4">
            <AudioInput
              onResult={(data) => { setPrediction(data as PredType); setActiveTab("results"); }}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />

            {/* Analyzing overlay card */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card text-center py-12"
                  style={{ border: "1px solid rgba(99,102,241,0.3)" }}
                >
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full gradient-bg"
                        style={{ opacity: 0.15 - i * 0.04 }}
                        animate={{ scale: [1, 1.4 + i * 0.2, 1] }}
                        transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                      />
                    ))}
                    <div className="relative w-full h-full rounded-full gradient-bg flex items-center justify-center glow-primary">
                      <Activity size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-xl mb-2 font-display" style={{ color: "var(--text-primary)" }}>
                    Analyzing Voice Patterns
                  </h3>
                  <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Extracting MFCCs · Running BiLSTM · Computing Attention Weights
                  </p>
                  {/* Animated bars */}
                  <div className="flex justify-center items-end gap-1.5 h-8">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-full"
                        style={{ background: `hsl(${240 + i * 12}, 80%, 65%)` }}
                        animate={{ height: ["4px", `${12 + Math.random() * 20}px`, "4px"] }}
                        transition={{ duration: 0.6 + Math.random() * 0.4, delay: i * 0.07, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Post-analysis quick tips */}
            {prediction && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-flat p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Quick Actions</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/history" className="btn-secondary text-xs py-2 justify-center">
                    <ArrowRight size={12} /> View History
                  </Link>
                  <button onClick={() => downloadPdf(prediction.id)} className="btn-ghost text-xs py-2">
                    <FileText size={12} /> PDF Report
                  </button>
                  <Link href="/reports" className="btn-ghost text-xs py-2">
                    <BarChart3 size={12} /> Analytics
                  </Link>
                  <button
                    onClick={() => { setPrediction(null); setIsAnalyzing(false); }}
                    className="btn-ghost text-xs py-2"
                  >
                    🔄 New Analysis
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right: Results Panel ── */}
          <AnimatePresence>
            {prediction && (
              <motion.div
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                {/* Tab bar */}
                <div className="tab-bar">
                  {(["results", "xai", "assistant"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`tab-item ${activeTab === tab ? "active" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === "results"    && "📊 Results"}
                      {tab === "xai"        && "🔍 Explain"}
                      {tab === "assistant"  && "🤖 AI Chat"}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "results"   && <EmotionResults prediction={prediction} />}
                    {activeTab === "xai"       && <EmotionResults prediction={prediction} />}
                    {activeTab === "assistant" && (
                      <AIAssistant predictionId={prediction.id} detectedEmotion={prediction.detected_emotion} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ FOOTER ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 pb-8"
        >
          <div className="neon-line mx-auto mb-6" style={{ width: 60 }} />
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
            VOICECORTEX · CNN + BiLSTM + SELF-ATTENTION · BUILT WITH NEXT.JS + FASTAPI
          </p>
        </motion.div>
      </main>
    </div>
  );
}
