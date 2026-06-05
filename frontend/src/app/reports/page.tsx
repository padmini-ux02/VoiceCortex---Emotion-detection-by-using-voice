"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { api, getEmotionConfig, formatDate } from "@/utils/api";
import { downloadPdf, downloadExport } from "@/utils/download";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FileText, Download, Loader2, FileSpreadsheet, FileBarChart2 } from "lucide-react";
import toast from "react-hot-toast";

interface Prediction {
  id: number;
  detected_emotion: string;
  confidence_scores: Record<string, number>;
  audio_filename: string;
  created_at: string;
}

const EXPORT_TYPES = [
  { key: "excel", label: "Excel Spreadsheet", icon: FileSpreadsheet, color: "#10b981", desc: "Full history with all emotion breakdowns (.xlsx)" },
  { key: "csv", label: "CSV Export", icon: FileBarChart2, color: "#06b6d4", desc: "Plain text comma-separated export (.csv)" },
];

export default function ReportsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.get("/audio/history")
        .then((res) => setPredictions(res.data))
        .catch(() => toast.error("Failed to load predictions"))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleDownload = async (type: string) => {
    setDownloading(type);
    await downloadExport(type as "excel" | "csv");
    setDownloading(null);
  };

  const handlePdfDownload = async (predId: number) => {
    setDownloading(`pdf-${predId}`);
    await downloadPdf(predId);
    setDownloading(null);
  };

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
        <div className="mb-8">
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
            <FileText size={22} className="text-indigo-400" /> Analytics & Reports
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Export your vocal emotion analysis data</p>
        </div>

        {/* Bulk Export Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {EXPORT_TYPES.map(({ key, label, icon: Icon, color, desc }) => (
            <motion.div
              key={key}
              whileHover={{ y: -3 }}
              className="card flex items-center gap-4 cursor-pointer"
              onClick={() => handleDownload(key)}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: color + "22", border: `1px solid ${color}44` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
              {downloading === key ? (
                <Loader2 size={18} className="animate-spin" style={{ color }} />
              ) : (
                <Download size={18} style={{ color }} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Individual PDF Reports */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Individual Prediction Reports</h2>
          {predictions.length === 0 ? (
            <div className="card text-center py-12">
              <FileText size={36} className="mx-auto mb-3 opacity-30" style={{ color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-secondary)" }}>No predictions yet. Analyze audio to generate reports.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {predictions.map((pred, i) => {
                const cfg = getEmotionConfig(pred.detected_emotion);
                return (
                  <motion.div
                    key={pred.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="card flex items-center gap-4 p-4"
                  >
                    <span className="text-xl">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: cfg.hex }}>{pred.detected_emotion}</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>#{pred.id}</span>
                      </div>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {pred.audio_filename.split(":")[1] || pred.audio_filename} · {formatDate(pred.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePdfDownload(pred.id)}
                      disabled={downloading === `pdf-${pred.id}`}
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      {downloading === `pdf-${pred.id}` ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Download size={13} />
                      )}
                      PDF
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
