"use client";

import { SessionProvider } from "next-auth/react";
import { DownloadProvider } from "@/components/DownloadContext";
import { DownloadsPanel } from "@/components/DownloadsPanel";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DownloadProvider>
        {children}
        <DownloadsPanel />
      </DownloadProvider>
    </SessionProvider>
  );
}
