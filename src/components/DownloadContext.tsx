"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { YouTubeVideo } from "@/types/youtube";

export type DownloadStatus =
  | "queued"
  | "downloading"
  | "ready"
  | "done"
  | "error";

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

const MAX_ATTEMPTS = 3;

function triggerSave(name: string, blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke later so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 15_000);
}

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [isPanelOpen, setPanelOpen] = useState(false);

  // Queue of video ids waiting to be fetched, the raw video data, and the
  // blobs that have been fetched but not yet saved — kept in refs so the async
  // processing loop always sees current values.
  const queueRef = useRef<string[]>([]);
  const videoMapRef = useRef<Map<string, YouTubeVideo>>(new Map());
  const processingRef = useRef(false);
  const pendingSavesRef = useRef<{ id: string; name: string; blob: Blob }[]>([]);

  const patch = useCallback((id: string, changes: Partial<DownloadItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...changes } : it))
    );
  }, []);

  // Save every fetched-but-unsaved file in one tight burst. Because the saves
  // fire together (not seconds apart), the browser shows its "allow multiple
  // downloads" prompt only once for the whole batch, and each song still
  // lands as its own .mp3.
  const flushSaves = useCallback(() => {
    const pending = pendingSavesRef.current;
    pendingSavesRef.current = [];
    pending.forEach(({ id, name, blob }, i) => {
      // A small stagger stops browsers from silently dropping near-simultaneous
      // downloads, while still counting as a single permission grant.
      setTimeout(() => {
        triggerSave(name, blob);
        patch(id, { status: "done", progress: 1 });
      }, i * 350);
    });
  }, [patch]);

  const fetchOne = useCallback(
    async (id: string) => {
      let lastErr: unknown;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const res = await fetch(`/api/download?id=${id}`);
          if (!res.ok || !res.body) {
            throw new Error(
              (await res.text().catch(() => "")) || `HTTP ${res.status}`
            );
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
              patch(id, { progress: total ? received / total : -1 });
            }
          }

          const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
          const cd = res.headers.get("Content-Disposition") || "";
          const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
          let name = decodeURIComponent(
            match?.[1] || match?.[2] || videoMapRef.current.get(id)?.title || id
          );
          if (!name.toLowerCase().endsWith(".mp3")) name += ".mp3";
          return { name, blob };
        } catch (err) {
          lastErr = err;
          if (attempt < MAX_ATTEMPTS) {
            // Back off before retrying — savetube occasionally flakes when hit
            // in quick succession.
            await new Promise((r) => setTimeout(r, 1200 * attempt));
            patch(id, { progress: -1 });
          }
        }
      }
      throw lastErr;
    },
    [patch]
  );

  const processNext = useCallback(async () => {
    if (processingRef.current) return;
    const nextId = queueRef.current[0];
    if (!nextId) return;

    processingRef.current = true;
    patch(nextId, { status: "downloading", progress: -1, error: undefined });

    try {
      const { name, blob } = await fetchOne(nextId);
      pendingSavesRef.current.push({ id: nextId, name, blob });
      patch(nextId, { status: "ready", progress: 1 });
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
      if (queueRef.current.length) {
        void processNext();
      } else {
        // Queue drained — save the whole batch at once.
        flushSaves();
      }
    }
  }, [patch, fetchOne, flushSaves]);

  const enqueue = useCallback(
    (video: YouTubeVideo) => {
      videoMapRef.current.set(video.id, video);

      setItems((prev) => {
        const existing = prev.find((it) => it.id === video.id);
        // Already waiting, in-flight, or fetched and about to save — skip.
        if (
          existing &&
          (existing.status === "queued" ||
            existing.status === "downloading" ||
            existing.status === "ready")
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
    pendingSavesRef.current = pendingSavesRef.current.filter((p) => p.id !== id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearFinished = useCallback(() => {
    setItems((prev) =>
      prev.filter(
        (it) => it.status !== "done" && it.status !== "error"
      )
    );
  }, []);

  const statusOf = useCallback(
    (id: string) => items.find((it) => it.id === id)?.status,
    [items]
  );

  const activeCount = items.filter(
    (it) =>
      it.status === "queued" ||
      it.status === "downloading" ||
      it.status === "ready"
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
