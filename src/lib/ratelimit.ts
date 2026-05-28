import { ipAddress } from "@vercel/functions";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Per-device allowance: 5 generations / hour per anonymous session (one per phone).
export const generateHourly = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "rl:gen:hour",
  analytics: true,
});

// Per-device allowance: 20 generations / day per anonymous session.
export const generateDaily = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "24 h"),
  prefix: "rl:gen:day",
});

// Per-IP ceiling: coarse anti-abuse backstop shared across everyone on one IP
// (e.g. a store's WiFi). Sized above a busy store's realistic peak, but low
// enough to throttle one person cycling cookies from a single connection.
export const generateIpHourly = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(150, "1 h"),
  prefix: "rl:gen:ip:hour",
  analytics: true,
});

export const generateIpDaily = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(400, "24 h"),
  prefix: "rl:gen:ip:day",
});

// 3 emails per hour per identifier
export const emailHourly = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "rl:email:hour",
  analytics: true,
});

// Trusted client IP from Vercel's edge (x-real-ip), not client-spoofable.
// Returns "unknown" off-Vercel (e.g. local dev), which only affects the coarse
// per-IP ceiling, not the per-session allowance.
export function clientIp(req: Request): string {
  return ipAddress(req) ?? "unknown";
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Global daily cost cap — total image generations across ALL users, to guard  */
/* against a runaway Gemini bill. Backed by the same Upstash Redis instance     */
/* (no new store). Counter is keyed by UTC date and auto-expires after ~48h.    */

const GLOBAL_CAP_TTL_SECONDS = 60 * 60 * 48; // ~48h, so stale day-keys self-clean

// UTC date so the daily window is stable regardless of server region.
function globalDailyKey(): string {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `cost:global:${day}`;
}

// Limit from env (MAX_DAILY_GENERATIONS), defaulting to 500. Guards against
// non-numeric / non-positive values.
export function maxDailyGenerations(): number {
  const parsed = Number(process.env.MAX_DAILY_GENERATIONS);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 500;
}

// Read-only check of today's global counter. Does NOT increment — callers
// increment separately via incrementGlobalDailyCount() only after a generation
// is actually kicked off. Fail-open: if Redis can't be read we return
// capReached:false so an isolated cost-key error doesn't take the product down.
// (A *full* Redis outage is still blocked downstream by the fail-closed
// per-session/per-IP limiters, so failing open here doesn't expose the bill.)
export async function checkGlobalDailyCap(): Promise<{
  capReached: boolean;
  count: number;
  limit: number;
}> {
  const limit = maxDailyGenerations();
  try {
    const raw = await redis.get<number>(globalDailyKey());
    const count = typeof raw === "number" ? raw : Number(raw ?? 0);
    return { capReached: count >= limit, count, limit };
  } catch (err) {
    console.error("[cost-cap] read failed, failing open:", err);
    return { capReached: false, count: 0, limit };
  }
}

// Increment today's global counter and (re)assert its TTL. Returns the new
// count. The first INCR of the day creates the key; EXPIRE keeps it bounded.
export async function incrementGlobalDailyCount(): Promise<number> {
  const key = globalDailyKey();
  const count = await redis.incr(key);
  await redis.expire(key, GLOBAL_CAP_TTL_SECONDS);
  return count;
}