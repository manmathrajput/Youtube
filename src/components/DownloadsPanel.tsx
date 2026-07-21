"use client";

import { useDownloads, DownloadItem } from "@/components/DownloadContext";
import {
  X,
  Loader2,
  CheckCircle,
  RotateCw,
  Trash2,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function DownloadsButton({ className = "" }: { className?: string }) {
  const { items, activeCount, isPanelOpen, setPanelOpen } = useDownloads();

  return (
    <button
      onClick={() => setPanelOpen(!isPanelOpen)}
      title="Downloads"
      className={`relative p-3 rounded-full transition-colors shrink-0 flex items-center justify-center ${
        activeCount > 0
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
          : "bg-[#121212] border border-white/20 text-gray-400 hover:text-white"
      } ${className}`}
    >
      <Download className="w-5 h-5" />
      {items.length > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
          {activeCount > 0 ? activeCount : items.length}
        </span>
      )}
    </button>
  );
}

export function DownloadsPanel() {
  const { items, isPanelOpen, setPanelOpen, retry, remove, clearFinished } =
    useDownloads();

  const hasFinished = items.some(
    (it) => it.status === "done" || it.status === "error"
  );

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={() => setPanelOpen(false)}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#121212] border-l border-white/10 z-[70] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-white">Downloads</h2>
              </div>
              <div className="flex items-center gap-2">
                {hasFinished && (
                  <button
                    onClick={clearFinished}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
                  >
                    Clear finished
                  </button>
                )}
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3 px-6 text-center">
                  <Download className="w-10 h-10" />
                  <p className="font-medium">No downloads yet</p>
                  <p className="text-sm">
                    Tap the download button on any song and it&apos;ll queue up
                    here.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <DownloadRow
                    key={item.id}
                    item={item}
                    onRetry={() => retry(item.id)}
                    onRemove={() => remove(item.id)}
                  />
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DownloadRow({
  item,
  onRetry,
  onRemove,
}: {
  item: DownloadItem;
  onRetry: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#1c1c1c] rounded-xl p-2.5 border border-white/5">
      {item.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail}
          alt=""
          className="w-14 h-14 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-white/5 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white line-clamp-1">
          {item.title}
        </p>
        <StatusLine item={item} />
      </div>

      <div className="shrink-0">
        {item.status === "error" ? (
          <button
            onClick={onRetry}
            className="p-2 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
            title="Retry"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        ) : item.status === "done" ? (
          <button
            onClick={onRemove}
            className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StatusLine({ item }: { item: DownloadItem }) {
  if (item.status === "queued") {
    return (
      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
        <Clock className="w-3.5 h-3.5" />
        <span>Queued</span>
      </div>
    );
  }

  if (item.status === "downloading") {
    const pct = item.progress >= 0 ? Math.round(item.progress * 100) : null;
    return (
      <div className="mt-1.5">
        <div className="flex items-center gap-1.5 text-xs text-blue-400 mb-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{pct !== null ? `Downloading ${pct}%` : "Downloading…"}</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full bg-blue-500 rounded-full ${
              pct === null ? "animate-pulse w-1/2" : "transition-all"
            }`}
            style={pct !== null ? { width: `${pct}%` } : undefined}
          />
        </div>
      </div>
    );
  }

  if (item.status === "done") {
    return (
      <div className="flex items-center gap-1.5 mt-1 text-xs text-green-500">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Downloaded</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-1 text-xs text-red-400">
      <AlertCircle className="w-3.5 h-3.5" />
      <span className="line-clamp-1">{item.error || "Failed"}</span>
    </div>
  );
}
