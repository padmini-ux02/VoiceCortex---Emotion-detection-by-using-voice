"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  levels: number[];
}

export function useAudioRecorder() {
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef         = useRef<BlobPart[]>([]);
  const timerRef          = useRef<NodeJS.Timeout | null>(null);
  const analyserRef       = useRef<AnalyserNode | null>(null);
  const animFrameRef      = useRef<number | null>(null);
  const streamRef         = useRef<MediaStream | null>(null);
  const audioCtxRef       = useRef<AudioContext | null>(null);
  // Resolver for stopAndGetBlob() promise
  const blobResolverRef   = useRef<((blob: Blob) => void) | null>(null);

  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused:    false,
    duration:    0,
    audioBlob:   null,
    audioUrl:    null,
    levels:      new Array(30).fill(0),
  });

  const cleanup = useCallback(() => {
    if (timerRef.current)    clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current)   streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analyser for real-time level visualisation
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source   = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url  = URL.createObjectURL(blob);
        // Update React state (for the UI audio player)
        setState((s) => ({ ...s, audioBlob: blob, audioUrl: url, isRecording: false, isPaused: false }));
        // Resolve the pending promise from stopAndGetBlob() — this is the key fix
        if (blobResolverRef.current) {
          blobResolverRef.current(blob);
          blobResolverRef.current = null;
        }
      };

      mediaRecorder.start(100);

      // Duration timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setState((s) => ({ ...s, duration: seconds }));
      }, 1000);

      // Level animator
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const levels = Array.from({ length: 30 }, (_, i) => {
          const idx = Math.floor((i / 30) * dataArray.length);
          return dataArray[idx] / 255;
        });
        setState((s) => ({ ...s, levels }));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      setState({
        isRecording: true,
        isPaused:    false,
        duration:    0,
        audioBlob:   null,
        audioUrl:    null,
        levels:      new Array(30).fill(0),
      });
    } catch (err) {
      throw new Error("Could not access microphone. Please allow microphone permission.");
    }
  }, []);

  /**
   * Stop recording and return a Promise that resolves with the final Blob.
   * This avoids stale-closure issues when reading state right after stop.
   */
  const stopAndGetBlob = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      blobResolverRef.current = resolve;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      } else {
        // Already stopped — resolve with whatever blob we have (or empty)
        const fallback = new Blob(chunksRef.current, { type: "audio/webm" });
        resolve(fallback);
        blobResolverRef.current = null;
      }

      // Stop timers & visualiser immediately
      if (timerRef.current)     clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current)    streamRef.current.getTracks().forEach((t) => t.stop());

      setState((s) => ({ ...s, isRecording: false, isPaused: false, levels: new Array(30).fill(0) }));
    });
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setState((s) => ({ ...s, isRecording: false, isPaused: false, levels: new Array(30).fill(0) }));
  }, [cleanup]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current)     clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setState((s) => ({ ...s, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setState((s) => ({ ...s, duration: s.duration + 1 }));
      }, 1000);

      // Restart visualiser
      if (analyserRef.current) {
        const analyser  = analyserRef.current;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          const levels = Array.from({ length: 30 }, (_, i) => {
            const idx = Math.floor((i / 30) * dataArray.length);
            return dataArray[idx] / 255;
          });
          setState((s) => ({ ...s, levels }));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      }
      setState((s) => ({ ...s, isPaused: false }));
    }
  }, []);

  const resetRecording = useCallback(() => {
    stopRecording();
    blobResolverRef.current = null;
    setState({
      isRecording: false, isPaused: false, duration: 0,
      audioBlob: null, audioUrl: null, levels: new Array(30).fill(0),
    });
  }, [stopRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    state,
    startRecording,
    stopAndGetBlob,  // ← use this in AudioInput for stop+analyze
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    formatTime,
  };
}
