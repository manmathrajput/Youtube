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
  const [isPlaying, setIsPlaying] = useState(false);

  const handleDownload = async () => {
    setDownloadState("loading");
    try {
      const url = `/api/download?id=${video.id}&title=${encodeURIComponent(video.title)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${video.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      setDownloadState("success");
      setTimeout(() => setDownloadState("idle"), 3000);
    } catch (e) {
      console.error(e);
      setDownloadState("error");
      setTimeout(() => setDownloadState("idle"), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#181818] rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all group flex flex-col h-full relative"
    >
      <div className="relative aspect-video overflow-hidden bg-black flex items-center justify-center">
        {isPlaying ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <>
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
              onClick={() => setIsPlaying(true)}
            />
            <div 
              className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center"
              onClick={() => setIsPlaying(true)}
            >
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Line Loader */}
      {downloadState === "loading" && (
        <div className="w-full h-1 bg-gray-800 overflow-hidden">
          <div className="h-full bg-red-500 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '50%', transformOrigin: 'left' }} />
        </div>
      )}

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
                : downloadState === "error"
                ? "bg-red-600 hover:bg-red-700 text-white"
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
            ) : downloadState === "error" ? (
              <>Failed. Retry?</>
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
