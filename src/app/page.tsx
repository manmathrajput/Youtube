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
      
      <div className="pt-32 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            Convert & Download
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              YouTube to MP3
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Search for your favorite music or videos, and download them instantly in high-quality MP3 format. Fast, free, and responsive.
          </p>

          {session && (
            <div className="flex gap-4 justify-center mb-8">
              <button
                onClick={() => setMode("search")}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  mode === "search" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Search
              </button>
              <button
                onClick={() => {
                  setMode("liked");
                  fetchLikedVideos();
                }}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  mode === "liked" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                My Liked Videos
              </button>
            </div>
          )}
        </div>

        {mode === "search" && <SearchBox onSearch={handleSearch} />}

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
    </main>
  );
}
