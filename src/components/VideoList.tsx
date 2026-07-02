"use client";

import { YouTubeVideo } from "@/types/youtube";
import { Download, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import YouTube, { YouTubeEvent } from "react-youtube";

export function VideoList({ videos }: { videos: YouTubeVideo[] }) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  if (videos.length === 0) return null;

  const handleVideoEnd = (index: number) => {
    // Autoplay the next video in the list
    if (index + 1 < videos.length) {
      setPlayingIndex(index + 1);
    } else {
      setPlayingIndex(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto mt-12">
      {videos.map((video, idx) => (
        <VideoCard 
          key={video.id} 
          video={video} 
          index={idx} 
          isPlaying={playingIndex === idx}
          onPlay={() => setPlayingIndex(idx)}
          onEnd={() => handleVideoEnd(idx)}
        />
      ))}
    </div>
  );
}

function VideoCard({ 
  video, 
  index, 
  isPlaying,
  onPlay,
  onEnd
}: { 
  video: YouTubeVideo; 
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  onEnd: () => void;
}) {
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showDownloader, setShowDownloader] = useState(false);

  const handleDownload = () => {
    setShowDownloader(true);
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
          <YouTube 
            videoId={video.id}
            opts={{
              height: '100%',
              width: '100%',
              playerVars: {
                autoplay: 1,
              },
            }}
            onEnd={onEnd}
            className="w-full h-full absolute inset-0"
          />
        ) : (
          <>
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
              onClick={onPlay}
            />
            <div 
              className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center"
              onClick={onPlay}
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
          {showDownloader ? (
            <a
              href={`https://cobalt.tools/?v=https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(() => setShowDownloader(false), 2000)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              <ExternalLink className="w-4 h-4" />
              Download via Cobalt
            </a>
          ) : (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-600/20"
            >
              <Download className="w-4 h-4" />
              Download Audio
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
