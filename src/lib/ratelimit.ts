import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// 5 generations per hour per identifier
export const generateHourly = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "rl:gen:hour",
  analytics: true,
});

// 20 generations per day per identifier
export const generateDaily = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "24 h"),
  prefix: "rl:gen:day",
});
// 3 emails per hour per identifier
export const emailHourly = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "rl:email:hour",
  analytics: true,
});

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}