"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SearchBox } from "@/components/SearchBox";
import { VideoList } from "@/components/VideoList";
import { YouTubeVideo } from "@/types/youtube";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { DownloadsButton } from "@/components/DownloadsPanel";

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

  // Initial load
  useEffect(() => {
    handleSearch("trending music");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const filters = [
    "Trending Music",
    "Latest Haryanvi",
    "Latest English EDM",
    "English Club Remixes",
  ];

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Desktop Navbar contains the SearchBox as children */}
      <div className="hidden md:block">
        <Navbar>
          <div className="w-full flex items-center gap-4">
            <SearchBox onSearch={handleSearch} />
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
                className={`p-3 rounded-full transition-colors shrink-0 flex items-center justify-center ${
                  mode === "liked" ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-[#121212] border border-white/20 text-gray-400 hover:text-white"
                }`}
                title="My Liked Videos"
              >
                <svg className="w-5 h-5" fill={mode === "liked" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
            <DownloadsButton />
          </div>
        </Navbar>
      </div>

      {/* Mobile Navbar (no children) */}
      <div className="block md:hidden">
        <Navbar />
      </div>
      
      <div className="pt-[80px] px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Mobile Sticky Search & Liked Actions (Hidden on Desktop) */}
        <div className="sticky top-[72px] z-40 w-full bg-[#0f0f0f]/95 backdrop-blur-md py-3 flex flex-col gap-3 md:hidden">
          <div className="flex items-center gap-3">
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
                className={`p-3.5 rounded-full transition-colors flex-shrink-0 flex items-center justify-center ${
                  mode === "liked" ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-[#121212] border border-white/20 text-gray-400 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5" fill={mode === "liked" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
            <DownloadsButton className="!p-3.5" />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="w-full max-w-4xl flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleSearch(filter)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors border border-white/5"
            >
              {filter}
            </button>
          ))}
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
