"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Mic, Pause, Play, Square, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { api } from "@/utils/api";
import toast from "react-hot-toast";

interface Props {
  onResult: (data: unknown) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
}

export default function AudioInput({ onResult, isAnalyzing, setIsAnalyzing }: Props) {
  const [activeTab, setActiveTab] = useState<"record" | "upload">("record");
  const [micError, setMicError] = useState<string | null>(null);

  const {
    state,
    startRecording,
    stopAndGetBlob,
    pauseRecording,
    resumeRecording,
    resetRecording,
    formatTime,
  } = useAudioRecorder();

  /* ─── Submit blob or file to API ─────────────────────────────────────── */
  const submitAudio = useCallback(
    async (blob: Blob, filename: string) => {
      setIsAnalyzing(true);
      try {
        const formData = new FormData();
        formData.append("file", blob, filename);
        const res = await api.post("/audio/predict", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        onResult(res.data);
        toast.success("Emotion analysis complete!");
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { detail?: string } };
          code?: string;
        };
        if (!axiosErr.response || axiosErr.code === "ERR_NETWORK") {
          toast.error("Cannot reach backend. Make sure the server is running on port 8000.");
        } else {
          toast.error(axiosErr.response?.data?.detail || "Analysis failed. Please try again.");
        }
      } finally {
        setIsAnalyzing(false);
      }
    },
    [onResult, setIsAnalyzing]
  );

  /* ─── Stop → get blob via promise → submit ───────────────────────────── */
  const handleStopAndAnalyze = useCallback(async () => {
    try {
      const blob = await stopAndGetBlob();   // resolves directly from onstop — no stale state
      if (blob && blob.size > 0) {
        await submitAudio(blob, "recording.webm");
      } else {
        toast.error("Recording was empty. Please try recording again.");
      }
    } catch (e) {
      toast.error("Failed to process recording.");
    }
  }, [stopAndGetBlob, submitAudio]);

  /* ─── Start recording with mic error handling ────────────────────────── */
  const handleStart = useCallback(async () => {
    setMicError(null);
    try {
      await startRecording();
    } catch (e: unknown) {
      setMicError((e as Error).message);
    }
  }, [startRecording]);

  /* ─── Dropzone for file upload ───────────────────────────────────────── */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      await submitAudio(file, file.name);
    },
    [submitAudio]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [".wav", ".mp3", ".flac", ".m4a", ".webm", ".ogg"] },
    maxFiles: 1,
    disabled: isAnalyzing,
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Audio Input
        </h2>
        <div className="tab-bar">
          <button
            className={`tab-item ${activeTab === "record" ? "active" : ""}`}
            onClick={() => setActiveTab("record")}
          >
            🎤 Record
          </button>
          <button
            className={`tab-item ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            📁 Upload
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── RECORD TAB ── */}
        {activeTab === "record" ? (
          <motion.div
            key="record"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mic permission error */}
            {micError && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl mb-4 text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{micError}</span>
              </div>
            )}

            {/* Waveform visualiser */}
            <div
              className="relative flex items-center justify-center gap-1 h-24 mb-5 rounded-xl overflow-hidden"
              style={{ background: "var(--bg-elevated)" }}
            >
              {state.levels.map((level, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height:
                      state.isRecording && !state.isPaused
                        ? `${Math.max(4, level * 80)}px`
                        : "4px",
                  }}
                  transition={{ duration: 0.08 }}
                  className="w-1.5 rounded-full"
                  style={{
                    background:
                      state.isRecording && !state.isPaused
                        ? `hsl(${240 + i * 4}, 80%, 65%)`
                        : "var(--border-color)",
                  }}
                />
              ))}

              {/* Recording badge */}
              {state.isRecording && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-recording" />
                  <span className="text-xs font-mono text-red-400">
                    {formatTime(state.duration)}
                  </span>
                </div>
              )}

              {/* Idle hint */}
              {!state.isRecording && !state.audioUrl && (
                <span
                  className="absolute text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Press Start Recording to begin
                </span>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {/* START */}
              {!state.isRecording && !state.audioUrl && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStart}
                  disabled={isAnalyzing}
                  className="btn-primary flex-1 max-w-xs"
                >
                  <Mic size={16} /> Start Recording
                </motion.button>
              )}

              {/* PAUSE / RESUME + STOP */}
              {state.isRecording && (
                <>
                  <button
                    onClick={state.isPaused ? resumeRecording : pauseRecording}
                    className="btn-ghost p-3 rounded-xl"
                    title={state.isPaused ? "Resume" : "Pause"}
                  >
                    {state.isPaused ? <Play size={18} /> : <Pause size={18} />}
                  </button>

                  <button
                    onClick={handleStopAndAnalyze}
                    disabled={isAnalyzing}
                    className="btn-primary px-6"
                  >
                    {isAnalyzing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Square size={16} />
                    )}
                    {isAnalyzing ? "Analyzing…" : "Stop & Analyze"}
                  </button>
                </>
              )}

              {/* PLAYBACK + RE-ANALYZE after stop */}
              {state.audioUrl && !state.isRecording && (
                <>
                  <audio
                    src={state.audioUrl}
                    controls
                    className="flex-1 h-9 rounded-lg min-w-0"
                    style={{ maxWidth: "220px" }}
                  />
                  <button
                    onClick={resetRecording}
                    className="btn-ghost p-3 rounded-xl"
                    title="Record again"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      if (state.audioBlob) await submitAudio(state.audioBlob, "recording.webm");
                    }}
                    disabled={isAnalyzing || !state.audioBlob}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : null}
                    {isAnalyzing ? "Analyzing…" : "Re-analyze"}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          /* ── UPLOAD TAB ── */
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "hover:border-indigo-400 hover:bg-indigo-500/5"
              }`}
              style={{ borderColor: isDragActive ? undefined : "var(--border-color)" }}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={{ scale: isDragActive ? 1.08 : 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center glow-primary">
                  <Upload size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {isDragActive ? "Drop it here!" : "Drag & drop your audio file"}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    WAV · MP3 · FLAC · M4A — up to 50 MB
                  </p>
                </div>
                {!isDragActive && (
                  <span className="btn-secondary text-sm px-5 py-2 pointer-events-none">
                    Browse Files
                  </span>
                )}
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Analyzing voice patterns…</span>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
