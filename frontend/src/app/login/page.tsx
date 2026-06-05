"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { Brain, Eye, EyeOff, Loader2, ArrowRight, Sparkles, Activity, BarChart3, Shield } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  { icon: Activity,  text: "Real-time emotion detection from voice" },
  { icon: Brain,     text: "CNN + BiLSTM + Attention AI pipeline" },
  { icon: BarChart3, text: "8 emotion classes with confidence scores" },
  { icon: Shield,    text: "Secure & private audio processing" },
];

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await api.post("/auth/signup", { email, password, full_name: fullName });
        toast.success("Account created!");
      }
      const res = await api.post("/auth/login", { email, password });
      await login(res.data.access_token);
      toast.success("Welcome to VoiceCortex!");
      router.push("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string | { msg: string }[] }; status?: number }; code?: string };
      if (!axiosErr.response || axiosErr.code === "ERR_NETWORK") {
        toast.error("Cannot reach server. Make sure the backend is running on port 8000.");
        return;
      }
      const raw = axiosErr.response?.data?.detail;
      const msg = Array.isArray(raw)
        ? raw.map((d) => (typeof d === "object" ? d.msg : d)).join(", ")
        : raw || "Authentication failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex">

      {/* ── Left Panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #030712 0%, #0d1117 60%, #12162a 100%)", borderRight: "1px solid rgba(99,102,241,0.12)" }}>

        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full animate-breathe"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full animate-breathe"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)", filter: "blur(30px)", animationDelay: "1.5s" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl gradient-bg flex items-center justify-center glow-primary">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-xl gradient-text">VoiceCortex</p>
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>SPEECH EMOTION RECOGNITION</p>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <h2 className="font-display text-4xl font-black leading-tight mb-5" style={{ color: "var(--text-primary)" }}>
            Understand emotions<br />
            <span className="gradient-text-aurora">through voice</span>
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
            Production-grade AI that analyses vocal patterns and classifies
            emotional states in real time — powered by deep learning.
          </p>
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <Icon size={14} className="text-indigo-400" />
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[["8", "Emotions"], ["Real-Time", "Analysis"], ["XAI", "Insights"]].map(([val, lbl]) => (
            <div key={lbl} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="font-mono font-black text-lg gradient-text">{val}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl gradient-bg flex items-center justify-center glow-primary">
                <Brain size={22} className="text-white" />
              </div>
              <p className="font-display font-bold text-2xl gradient-text">VoiceCortex</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Heading */}
            <div className="mb-8">
              <h1 className="font-display text-3xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {mode === "login"
                  ? "Sign in to access your emotion analysis dashboard"
                  : "Start analysing emotions from voice for free"}
              </p>
            </div>

            {/* Tab toggle */}
            <div className="tab-bar mb-6">
              <button className={`tab-item ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Sign In</button>
              <button className={`tab-item ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>Create Account</button>
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Full Name</label>
                    <input
                      className="input-field"
                      placeholder="Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      className="input-field pr-11"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {loading ? "Processing…" : mode === "login" ? "Sign In" : "Create Account"}
                </button>

                <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  {mode === "login" ? "New here? " : "Already have an account? "}
                  <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                    {mode === "login" ? "Create a free account" : "Sign in"}
                  </button>
                </p>
              </motion.form>
            </AnimatePresence>

            {/* Guest access */}
            <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <p className="text-center text-xs mb-3" style={{ color: "var(--text-muted)" }}>Or try without an account</p>
              <Link href="/" className="btn-ghost w-full justify-center text-sm py-2.5">
                <Sparkles size={14} /> Continue as Guest
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
