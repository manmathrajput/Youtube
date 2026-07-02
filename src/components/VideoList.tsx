"use client";

import { YouTubeVideo } from "@/types/youtube";
import { Download, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function VideoList({ videos }: { videos: YouTubeVideo[] }) {
  if (videos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto mt-12">
      {videos.map((video, idx) => (
        <VideoCard key={video.id} video={video} index={idx} />
      ))}
    </div>
  );
}

function VideoCard({ video, index }: { video: YouTubeVideo; index: number }) {
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleDownload = async () => {
    setDownloadState("loading");
    try {
      // Trigger download by opening a new window or creating an anchor tag
      // For mp3, we will hit our Next.js API route that converts and streams it
      const url = `/api/download?id=${video.id}&title=${encodeURIComponent(video.title)}`;
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `${video.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setDownloadState("success");
      setTimeout(() => setDownloadState("idle"), 3000);
    } catch (e) {
      setDownloadState("error");
      setTimeout(() => setDownloadState("idle"), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#181818] rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all group flex flex-col h-full"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg text-white line-clamp-2 leading-tight">
          {video.title}
        </h3>
        <p className="text-gray-400 text-sm mt-2">{video.channelTitle}</p>
        
        <div className="mt-auto pt-4 flex justify-end">
          <button
            onClick={handleDownload}
            disabled={downloadState === "loading"}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              downloadState === "loading"
                ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                : downloadState === "success"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-600/20"
            }`}
          >
            {downloadState === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Converting...
              </>
            ) : downloadState === "success" ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Downloaded
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download MP3
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
