"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { PlayCircle, LogIn, LogOut } from "lucide-react";

export function Navbar({ children }: { children?: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <nav className="w-full flex items-center justify-between p-4 bg-black/50 backdrop-blur-md border-b border-white/10 fixed top-0 z-50 h-[72px]">
      <div className="flex items-center gap-3 shrink-0">
        <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-red-600/20 object-cover" />
        <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white hidden sm:block">
          मन्मथ's Music
        </span>
      </div>
      
      {/* Middle section for desktop search */}
      <div className="flex-1 max-w-2xl mx-4 hidden md:block">
        {children}
      </div>

      <div className="shrink-0">
        {session ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={session.user?.image || ""} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-white/20"
              />
              <span className="text-sm text-gray-300 hidden lg:block">{session.user?.name}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full transition-colors text-sm font-medium"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:block">Connect YouTube</span>
          </button>
        )}
      </div>
    </nav>
  );
}
