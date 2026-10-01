// Lightweight, in-memory per-IP rate limiting — no new infrastructure
// (Redis/Vercel KV) needed, which matters at this app's actual scale.
//
// Real limitation: this Map lives in one serverless function instance's
// memory. Vercel can run multiple instances of the same route concurrently,
// each with its OWN copy of this Map, and a cold start wipes it entirely —
// so a determined attacker spreading requests across instances could get
// a higher effective rate than MAX_REQUESTS suggests. This isn't a security
// boundary; it's a cheap deterrent against the common case (one script
// hammering the endpoint from one place), which is the realistic abuse risk
// for a low-traffic storefront with no money actually moving until Square
// confirms payment. If order volume ever grows enough to need a real
// guarantee, swap this for Vercel KV/Upstash-backed limiting instead.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

// Vercel sets x-forwarded-for to "client, proxy1, proxy2" — the first entry
// is the original client. Falls back to a constant key (shared limit across
// all callers) only in the unlikely case neither header is present, rather
// than silently skipping the limit entirely.
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
