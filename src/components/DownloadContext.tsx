"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { YouTubeVideo } from "@/types/youtube";

export type DownloadStatus = "queued" | "downloading" | "done" | "error";

export interface DownloadItem {
  id: string;
  title: string;
  thumbnail?: string;
  channelTitle?: string;
  status: DownloadStatus;
  progress: number; // 0..1, or -1 when the total size is unknown
  error?: string;
}

interface DownloadContextValue {
  items: DownloadItem[];
  activeCount: number;
  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  enqueue: (video: YouTubeVideo) => void;
  retry: (id: string) => void;
  remove: (id: string) => void;
  clearFinished: () => void;
  statusOf: (id: string) => DownloadStatus | undefined;
}

const DownloadContext = createContext<DownloadContextValue | null>(null);

export function useDownloads() {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error("useDownloads must be used within a DownloadProvider");
  return ctx;
}

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [isPanelOpen, setPanelOpen] = useState(false);

  // The queue of video ids waiting to be processed, and the raw video data,
  // live in refs so the async processing loop always sees current values
  // without re-subscribing to React state.
  const queueRef = useRef<string[]>([]);
  const videoMapRef = useRef<Map<string, YouTubeVideo>>(new Map());
  const processingRef = useRef(false);

  const patch = useCallback((id: string, changes: Partial<DownloadItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...changes } : it))
    );
  }, []);

  const processNext = useCallback(async () => {
    if (processingRef.current) return;
    const nextId = queueRef.current[0];
    if (!nextId) return;

    processingRef.current = true;
    patch(nextId, { status: "downloading", progress: -1, error: undefined });

    try {
      const res = await fetch(`/api/download?id=${nextId}`);
      if (!res.ok || !res.body) {
        throw new Error((await res.text().catch(() => "")) || "Download failed");
      }

      const total = Number(res.headers.get("Content-Length") || 0);
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          patch(nextId, { progress: total ? received / total : -1 });
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });

      // Prefer the server-provided filename; fall back to the video title.
      const cd = res.headers.get("Content-Disposition") || "";
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
      let name = decodeURIComponent(
        match?.[1] || match?.[2] || videoMapRef.current.get(nextId)?.title || nextId
      );
      if (!name.toLowerCase().endsWith(".mp3")) name += ".mp3";

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      patch(nextId, { status: "done", progress: 1 });
    } catch (err: any) {
      console.error("Download failed:", err);
      patch(nextId, {
        status: "error",
        progress: 0,
        error: err?.message || "Download failed",
      });
    } finally {
      queueRef.current = queueRef.current.filter((x) => x !== nextId);
      processingRef.current = false;
      // Drain the rest of the queue one item at a time.
      if (queueRef.current.length) void processNext();
    }
  }, [patch]);

  const enqueue = useCallback(
    (video: YouTubeVideo) => {
      videoMapRef.current.set(video.id, video);

      setItems((prev) => {
        const existing = prev.find((it) => it.id === video.id);
        // Already waiting or in-flight — don't add a duplicate.
        if (
          existing &&
          (existing.status === "queued" || existing.status === "downloading")
        ) {
          return prev;
        }
        const item: DownloadItem = {
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          channelTitle: video.channelTitle,
          status: "queued",
          progress: 0,
        };
        return existing
          ? prev.map((it) => (it.id === video.id ? item : it))
          : [...prev, item];
      });

      if (!queueRef.current.includes(video.id)) queueRef.current.push(video.id);
      setPanelOpen(true);
      void processNext();
    },
    [processNext]
  );

  const retry = useCallback(
    (id: string) => {
      const video = videoMapRef.current.get(id);
      if (video) enqueue(video);
    },
    [enqueue]
  );

  const remove = useCallback((id: string) => {
    queueRef.current = queueRef.current.filter((x) => x !== id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearFinished = useCallback(() => {
    setItems((prev) =>
      prev.filter((it) => it.status === "queued" || it.status === "downloading")
    );
  }, []);

  const statusOf = useCallback(
    (id: string) => items.find((it) => it.id === id)?.status,
    [items]
  );

  const activeCount = items.filter(
    (it) => it.status === "queued" || it.status === "downloading"
  ).length;

  return (
    <DownloadContext.Provider
      value={{
        items,
        activeCount,
        isPanelOpen,
        setPanelOpen,
        enqueue,
        retry,
        remove,
        clearFinished,
        statusOf,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
}
