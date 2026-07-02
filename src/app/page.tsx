"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SearchBox } from "@/components/SearchBox";
import { VideoList } from "@/components/VideoList";
import { YouTubeVideo } from "@/types/youtube";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [likedVideos, setLikedVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLikedLoading, setIsLikedLoading] = useState(false);
  const [mode, setMode] = useState<"search" | "liked">("search");

  useEffect(() => {
    if (session) {
      fetchLikedVideos();
    }
  }, [session]);

  const fetchLikedVideos = async () => {
    setIsLikedLoading(true);
    try {
      const res = await fetch("/api/liked");
      if (res.ok) {
        const data = await res.json();
        setLikedVideos(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLikedLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setMode("search");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />
      
      <div className="pt-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Sticky Search & Liked Actions Header */}
        <div className="sticky top-[72px] z-40 w-full max-w-4xl bg-[#0f0f0f]/95 backdrop-blur-md py-4 flex items-center gap-4 border-b border-white/5">
          <div className="flex-1">
            <SearchBox onSearch={handleSearch} />
          </div>
          
          {session && (
            <button
              onClick={() => {
                if (mode === "liked") {
                  setMode("search");
                } else {
                  setMode("liked");
                  fetchLikedVideos();
                }
              }}
              className={`p-4 rounded-full transition-colors flex-shrink-0 flex items-center justify-center ${
                mode === "liked" ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-[#121212] border border-white/20 text-gray-400 hover:text-white"
              }`}
              title="My Liked Videos"
            >
              <svg className="w-6 h-6" fill={mode === "liked" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        <div className="w-full mt-4">
          {mode === "search" ? (
            isLoading ? (
              <div className="mt-20 flex flex-col items-center gap-4 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                <p className="font-medium">Searching YouTube...</p>
              </div>
            ) : (
              <VideoList videos={videos} />
            )
          ) : (
            isLikedLoading ? (
              <div className="mt-20 flex flex-col items-center gap-4 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                <p className="font-medium">Loading your liked videos...</p>
              </div>
            ) : (
              <>
                {likedVideos.length === 0 ? (
                  <div className="mt-20 text-gray-400 text-center">
                    <p className="text-xl font-medium mb-2">No liked videos found.</p>
                    <p>Make sure you have liked some videos on YouTube.</p>
                  </div>
                ) : (
                  <VideoList videos={likedVideos} />
                )}
              </>
            )
          )}
        </div>
      </div>
    </main>
  );
}
