// Real client IP behind Cloudflare + nginx. req.ip is the proxy (127.0.0.1),
// so rate-limit keys MUST come from the forwarded headers or every visitor
// shares one bucket. CF-Connecting-IP is set by Cloudflare and is the reliable
// per-client value; fall back to the first X-Forwarded-For hop, then req.ip.
export function clientIp(req: any): string {
  return (
    (req?.headers?.["cf-connecting-ip"] as string) ||
    (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req?.ip ||
    "unknown"
  );
}
