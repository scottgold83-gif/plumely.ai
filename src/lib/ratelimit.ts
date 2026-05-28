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