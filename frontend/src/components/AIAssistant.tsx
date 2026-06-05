"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, Heart, MessageCircle, Sparkles } from "lucide-react";
import { api } from "@/utils/api";

interface Props {
  predictionId: number;
  detectedEmotion: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistant({ predictionId, detectedEmotion }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I've analyzed your voice and detected **${detectedEmotion}**. Ask me anything about this result — I can explain what it means, suggest communication tips, or share wellness insights. 💡`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [wellness, setWellness] = useState<string | null>(null);
  const [commTip, setCommTip] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post("/assistant/chat", {
        prediction_id: predictionId,
        message: userMsg,
      });
      const { response, wellness_tip, communication_suggestion } = res.data;
      setMessages((m) => [...m, { role: "assistant", content: response }]);
      setWellness(wellness_tip);
      setCommTip(communication_suggestion);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    "Why was this emotion detected?",
    "Give me wellness tips",
    "How should I communicate?",
  ];

  return (
    <div className="card flex flex-col" style={{ minHeight: 480 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: "var(--border-color)" }}>
        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>AI Wellness Advisor</h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Powered by VoiceCortex Engine</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-400" /> Online
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto mb-4" style={{ maxHeight: 260 }}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                  <Sparkles size={10} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white gradient-bg rounded-br-sm"
                    : "rounded-bl-sm"
                }`}
                style={
                  msg.role === "assistant"
                    ? { background: "var(--bg-elevated)", color: "var(--text-primary)" }
                    : {}
                }
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2" style={{ background: "var(--bg-elevated)" }}>
              <Loader2 size={14} className="animate-spin text-indigo-400" />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {quickQueries.map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            className="text-xs px-3 py-1 rounded-full border transition-colors hover:border-indigo-400 hover:text-indigo-400"
            style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about your emotion…"
          className="input-field flex-1"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn-primary px-4 py-2.5 rounded-xl"
        >
          <Send size={15} />
        </button>
      </div>

      {/* Wellness & Comm Tips Cards */}
      <AnimatePresence>
        {(wellness || commTip) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {wellness && (
              <div className="flex gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <Heart size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p style={{ color: "var(--text-secondary)" }}>{wellness}</p>
              </div>
            )}
            {commTip && (
              <div className="flex gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <MessageCircle size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <p style={{ color: "var(--text-secondary)" }}>{commTip}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
