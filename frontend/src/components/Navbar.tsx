"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Brain, Sun, Moon, User, LogOut, History, FileText, Menu, X, Mic, ChevronDown, Zap } from "lucide-react";

const navLinks = [
  { href: "/",        label: "Analyze",  icon: Mic,       desc: "Real-time analysis" },
  { href: "/history", label: "History",  icon: History,   desc: "Past recordings" },
  { href: "/reports", label: "Reports",  icon: FileText,  desc: "Export & download" },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                <Brain size={18} className="text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[var(--bg-base)] animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <span className="gradient-text font-display font-bold text-lg leading-none">VoiceCortex</span>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                VOICE · CORTEX · AI
              </p>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-white"
                      : "hover:text-[color:var(--text-primary)]"
                  }`}
                  style={{ color: active ? undefined : "var(--text-secondary)" }}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl gradient-bg opacity-90 shadow-lg"
                      style={{ zIndex: -1, boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* ── Right Controls ── */}
          <div className="flex items-center gap-2">

            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn-icon tooltip"
              data-tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
              aria-label="Toggle theme"
            >
              <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </motion.div>
            </button>

            {/* User menu / Sign in */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[color:var(--bg-elevated)] transition-all duration-200 border"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center text-white text-xs font-bold">
                    {(user.full_name || user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate" style={{ color: "var(--text-primary)" }}>
                    {user.full_name || user.email.split("@")[0]}
                  </span>
                  <ChevronDown size={13} style={{ color: "var(--text-muted)" }} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 z-50 overflow-hidden"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}
                      >
                        <div className="px-4 py-3" style={{ background: "rgba(99,102,241,0.06)", borderBottom: "1px solid var(--border-subtle)" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold">
                              {(user.full_name || user.email)[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                {user.full_name || "VoiceCortex User"}
                              </p>
                              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          {navLinks.map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-[color:var(--bg-elevated)]"
                              style={{ color: "var(--text-secondary)" }}>
                              <Icon size={14} /> {label}
                            </Link>
                          ))}
                          <div className="my-1" style={{ height: 1, background: "var(--border-subtle)" }} />
                          <button
                            onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut size={14} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="btn-primary text-sm py-2 px-4">
                <Zap size={13} /> Get Started
              </Link>
            )}

            {/* Mobile toggle */}
            <button className="md:hidden btn-icon" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Nav ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="md:hidden overflow-hidden pb-3"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <div className="pt-3 space-y-1">
                {navLinks.map(({ href, label, icon: Icon, desc }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? "text-indigo-400" : ""}`}
                      style={{
                        color: active ? undefined : "var(--text-secondary)",
                        background: active ? "rgba(99,102,241,0.1)" : "transparent",
                      }}
                    >
                      <Icon size={16} />
                      <div>
                        <p className="font-semibold">{label}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
