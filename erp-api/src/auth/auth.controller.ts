import { Body, Controller, Get, Post, Req, Res, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { CurrentUser, Public, AuthedUser } from "../rbac";
import { clientIp } from "../util/client-ip";
import { LoginDto, ChangePasswordDto } from "../common/dto/auth.dto";

const secure = () => process.env.COOKIE_SECURE !== "false";
// Access-cookie lifetime follows ACCESS_TTL (e.g. 8h) so the session doesn't die at 15m.
const ttlMs = (t?: string): number => { const m = /^(\d+)\s*([smhd])$/.exec((t || "15m").trim()); return m ? Number(m[1]) * (({ s: 1e3, m: 6e4, h: 36e5, d: 864e5 } as Record<string, number>)[m[2]]) : 15 * 60 * 1000; };
const accessMaxAge = ttlMs(process.env.ACCESS_TTL);
const refreshMaxAge = Number(process.env.REFRESH_TTL_DAYS || 30) * 864e5;

/**
 * Refresh cookie path MUST be `/` so silent refresh works on both pre-cutover
 * `/api2/auth/refresh` and post-cutover `/api/auth/refresh`. Path `/api/auth`
 * previously blocked the browser from sending st_refresh to `/api2/*`.
 * Cleared on both old and new paths so existing sessions migrate on next login.
 */
function setCookies(res: Response, t: { access: string; refresh: string }) {
  res.cookie("st_access", t.access, { httpOnly: true, secure: secure(), sameSite: "lax", path: "/", maxAge: accessMaxAge });
  res.clearCookie("st_refresh", { path: "/api/auth" });
  res.cookie("st_refresh", t.refresh, { httpOnly: true, secure: secure(), sameSite: "lax", path: "/", maxAge: refreshMaxAge });
}
function clearCookies(res: Response) {
  res.clearCookie("st_access", { path: "/" });
  res.clearCookie("st_refresh", { path: "/api/auth" });
  res.clearCookie("st_refresh", { path: "/" });
}
const meta = (req: Request) => ({ ua: req.headers["user-agent"], ip: clientIp(req) });

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  // brute-force guard: 40 attempts / 10 min per client IP
  private hits = new Map<string, { n: number; ts: number }>();
  private rateLimit(ip: string) {
    const now = Date.now(), rec = this.hits.get(ip) || { n: 0, ts: now };
    if (now - rec.ts > 10 * 60 * 1000) { rec.n = 0; rec.ts = now; }
    rec.n++; this.hits.set(ip, rec);
    // 40/10m: brute-force protection without blocking NAT'd QA/regression suites
    if (rec.n > 40) throw new HttpException("Too many attempts. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
  }

  @Public() @Post("login")
  async login(@Body() b: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.rateLimit(clientIp(req));
    const { tokens, mustChangePassword } = await this.auth.login(b.email, b.password, meta(req));
    setCookies(res, tokens);
    return { ok: true, mustChangePassword };
  }

  @Public() @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.refresh(req.cookies?.st_refresh, meta(req));
    setCookies(res, tokens);
    return { ok: true };
  }

  @Public() @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.st_refresh);
    clearCookies(res);
    return { ok: true };
  }

  @Get("me")
  me(@CurrentUser() user: AuthedUser) {
    return this.auth.me(user);
  }

  @Post("change-password")
  async changePassword(@CurrentUser() user: AuthedUser, @Body() b: ChangePasswordDto) {
    await this.auth.changePassword(user.id, b.currentPassword, b.newPassword);
    return { ok: true };
  }
}
