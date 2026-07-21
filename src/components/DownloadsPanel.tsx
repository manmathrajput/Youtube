"use client";

import {
  useDownloads,
  DownloadItem,
  DownloadHistoryEntry,
} from "@/components/DownloadContext";
import {
  X,
  Loader2,
  CheckCircle,
  RotateCw,
  Trash2,
  Clock,
  AlertCircle,
  Download,
  ListMusic,
  History,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function DownloadsButton({ className = "" }: { className?: string }) {
  const { activeCount, isPanelOpen, setPanelOpen } = useDownloads();

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
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </button>
  );
}

type Tab = "ongoing" | "all";

export function DownloadsPanel() {
  const {
    items,
    history,
    isPanelOpen,
    setPanelOpen,
    retry,
    remove,
    enqueue,
    removeFromHistory,
    clearHistory,
  } = useDownloads();

  const [tab, setTab] = useState<Tab>("ongoing");

  // Ongoing = anything not finished (queued, downloading, ready) plus failures
  // that still want attention. "All" is the persisted history of completed
  // downloads.
  const ongoing = items.filter((it) => it.status !== "done");

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
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-2 border-b border-white/10">
              <TabButton
                active={tab === "ongoing"}
                onClick={() => setTab("ongoing")}
                icon={<ListMusic className="w-4 h-4" />}
                label="Ongoing"
                count={ongoing.length}
              />
              <TabButton
                active={tab === "all"}
                onClick={() => setTab("all")}
                icon={<History className="w-4 h-4" />}
                label="All"
                count={history.length}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {tab === "ongoing" ? (
                ongoing.length === 0 ? (
                  <EmptyState
                    icon={<ListMusic className="w-10 h-10" />}
                    title="Nothing in the queue"
                    subtitle="Tap download on any song and it'll queue up here."
                  />
                ) : (
                  ongoing.map((item) => (
                    <DownloadRow
                      key={item.id}
                      item={item}
                      onRetry={() => retry(item.id)}
                      onRemove={() => remove(item.id)}
                    />
                  ))
                )
              ) : history.length === 0 ? (
                <EmptyState
                  icon={<History className="w-10 h-10" />}
                  title="No downloads yet"
                  subtitle="Songs you download will be listed here."
                />
              ) : (
                <>
                  <div className="flex justify-end">
                    <button
                      onClick={clearHistory}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
                    >
                      Clear history
                    </button>
                  </div>
                  {history.map((entry) => (
                    <HistoryRow
                      key={entry.id}
                      entry={entry}
                      onRedownload={() => enqueue(entry)}
                      onRemove={() => removeFromHistory(entry.id)}
                    />
                  ))}
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
            active ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3 px-6 text-center">
      {icon}
      <p className="font-medium">{title}</p>
      <p className="text-sm">{subtitle}</p>
    </div>
  );
}

function HistoryRow({
  entry,
  onRedownload,
  onRemove,
}: {
  entry: DownloadHistoryEntry;
  onRedownload: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#1c1c1c] rounded-xl p-2.5 border border-white/5">
      {entry.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.thumbnail}
          alt=""
          className="w-14 h-14 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-white/5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white line-clamp-1">
          {entry.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          <span>{formatWhen(entry.savedAt)}</span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <button
          onClick={onRedownload}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Download again"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onRemove}
          className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          title="Remove from history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function formatWhen(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
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

  if (item.status === "ready") {
    return (
      <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Ready — saving with the batch…</span>
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
