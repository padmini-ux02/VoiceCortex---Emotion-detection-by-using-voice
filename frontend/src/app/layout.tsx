import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "VoiceCortex — Speech Emotion Recognition",
  description:
    "Production-grade AI platform that detects human emotions from voice recordings in real time using Deep Learning and advanced Speech Signal Processing.",
  keywords: [
    "speech emotion recognition",
    "AI voice analysis",
    "emotion detection",
    "deep learning audio",
    "MFCC features",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: "14px",
                  padding: "14px 18px",
                  fontSize: "13.5px",
                  fontFamily: "Inter, sans-serif",
                  background: "#0f1623",
                  color: "#f0f4ff",
                  border: "1px solid rgba(99,102,241,0.2)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                },
                success: { iconTheme: { primary: "#10b981", secondary: "#0f1623" } },
                error:   { iconTheme: { primary: "#ef4444", secondary: "#0f1623" } },
                loading: { iconTheme: { primary: "#6366f1", secondary: "#0f1623" } },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
