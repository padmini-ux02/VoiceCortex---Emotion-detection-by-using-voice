"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { api, getEmotionConfig, formatDate, formatConfidence } from "@/utils/api";
import { downloadPdf, downloadExport } from "@/utils/download";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Trash2, Eye, Loader2, History, Search } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface Prediction {
  id: number;
  detected_emotion: string;
  confidence_scores: Record<string, number>;
  audio_filename: string;
  created_at: string;
}

export default function HistoryPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.get("/audio/history").then((res) => {
        setPredictions(res.data);
      }).catch(() => toast.error("Failed to load history")).finally(() => setLoading(false));
    }
  }, [user]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete(`/audio/prediction/${id}`);
      setPredictions((p) => p.filter((x) => x.id !== id));
      toast.success("Prediction deleted");
    } catch {
      toast.error("Failed to delete prediction");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = predictions.filter((p) =>
    p.detected_emotion.toLowerCase().includes(search.toLowerCase()) ||
    p.audio_filename.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <main className="container-main py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
              <History size={22} className="text-indigo-400" /> Prediction History
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {predictions.length} vocal analysis records
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => downloadExport("csv")} className="btn-ghost text-sm py-2">⬇ CSV</button>
            <button onClick={() => downloadExport("excel")} className="btn-ghost text-sm py-2">⬇ Excel</button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            className="input-field pl-9"
            placeholder="Search by emotion or filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <History size={40} className="mx-auto mb-3 text-indigo-300 opacity-50" />
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No predictions found</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Record or upload audio on the dashboard to get started</p>
            <Link href="/" className="btn-primary inline-flex mt-4 text-sm">Analyze Audio</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((pred, i) => {
              const cfg = getEmotionConfig(pred.detected_emotion);
              return (
                <motion.div
                  key={pred.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`card border flex items-center gap-4 p-4 ${cfg.bg}`}
                  style={{ borderColor: cfg.hex + "44" }}
                >
                  <span className="text-2xl">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: cfg.hex }}>{pred.detected_emotion}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ background: cfg.hex + "cc" }}>
                        {formatConfidence(pred.confidence_scores[pred.detected_emotion] || 0)}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {pred.audio_filename.split(":")[1] || pred.audio_filename}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(pred.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => downloadPdf(pred.id)}
                      className="btn-ghost p-2 rounded-xl text-xs"
                      title="Download PDF Report"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(pred.id)}
                      disabled={deletingId === pred.id}
                      className="btn-ghost p-2 rounded-xl text-red-400 hover:bg-red-500/10"
                    >
                      {deletingId === pred.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
