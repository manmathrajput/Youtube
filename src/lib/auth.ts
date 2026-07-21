import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Google access tokens expire after ~1 hour. We keep the refresh token in the
// JWT and exchange it for a fresh access token whenever the current one is
// close to expiring, so the YouTube connection survives indefinitely instead
// of silently breaking an hour after sign-in.
async function refreshAccessToken(token: any) {
  try {
    if (!token.refreshToken) throw new Error("No refresh token available");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await res.json();
    if (!res.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
      // Google only returns a new refresh token occasionally — keep the old
      // one when it doesn't.
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Failed to refresh Google access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          // "consent" + offline access is what makes Google hand back a
          // refresh token at all.
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in: persist both tokens and the real expiry.
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? (token as any).refreshToken,
          expiresAt: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
          error: undefined,
        };
      }

      // Still valid (with a 1 minute safety margin) — reuse it.
      const expiresAt = (token as any).expiresAt as number | undefined;
      if (expiresAt && Date.now() < expiresAt - 60_000) return token;

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).error = (token as any).error;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
