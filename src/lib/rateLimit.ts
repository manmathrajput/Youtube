import { NextResponse } from "next/server";

// Lightweight in-memory rate limiter. State is per container instance, which is
// exactly right for a single Render service during the testing phase — no
// external store needed. It caps abusive traffic (junk requests, someone
// hammering the download proxy or burning our YouTube API quota) without
// affecting normal use.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

// Drop expired buckets occasionally so the map can't grow unbounded under a
// flood of unique keys.
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (now > b.resetAt) buckets.delete(key);
  }
  // Hard cap as a last resort against a huge burst of distinct keys.
  if (buckets.size > 50_000) buckets.clear();
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter: number; // seconds
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

// Best-effort client IP. On Render (and most proxies) the real client is in
// x-forwarded-for; fall back sensibly so we never key everyone as "unknown".
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// Convenience: enforce a limit for a named route and return a ready-made 429
// response when exceeded, or null when the request may proceed.
export function enforceRateLimit(
  request: Request,
  route: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = getClientIp(request);
  const result = rateLimit(`${route}:${ip}`, limit, windowMs);
  if (result.ok) return null;

  return NextResponse.json(
    { error: "rate_limited", message: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    }
  );
}

// A YouTube video id is always 11 URL-safe base64 chars. Validating this stops
// the download proxy from being pointed at arbitrary/garbage values.
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function isValidVideoId(id: string | null): id is string {
  return !!id && VIDEO_ID_RE.test(id);
}
