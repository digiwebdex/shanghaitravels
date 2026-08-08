import { Body, Controller, Post, Req, Res, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { Public } from "../rbac";
import { CustomerAuthService } from "./customer-auth.service";
import { clientIp } from "../util/client-ip";
import { LoginDto, EmailDto, ResetPasswordDto, EmailCodeDto, RegisterDto } from "../common/dto/auth.dto";

const secure = () => process.env.COOKIE_SECURE !== "false";
const accessMaxAge = 15 * 60 * 1000;
const refreshMaxAge = Number(process.env.REFRESH_TTL_DAYS || 30) * 864e5;
const REFRESH_PATH = "/api/portal/customer";

function setCookies(res: Response, t: { access: string; refresh: string }) {
  res.cookie("st_customer", t.access, { httpOnly: true, secure: secure(), sameSite: "lax", path: "/", maxAge: accessMaxAge });
  res.cookie("st_customer_refresh", t.refresh, {
    httpOnly: true,
    secure: secure(),
    sameSite: "lax",
    path: REFRESH_PATH,
    maxAge: refreshMaxAge,
  });
}
function clearCookies(res: Response) {
  res.clearCookie("st_customer", { path: "/" });
  res.clearCookie("st_customer_refresh", { path: REFRESH_PATH });
}
const meta = (req: Request) => ({ ua: req.headers["user-agent"], ip: clientIp(req) });

@Controller("portal/customer")
export class CustomerAuthController {
  constructor(private auth: CustomerAuthService) {}

  private hits = new Map<string, { n: number; ts: number }>();
  private rateLimit(ip: string) {
    const now = Date.now();
    const rec = this.hits.get(ip) || { n: 0, ts: now };
    if (now - rec.ts > 10 * 60 * 1000) {
      rec.n = 0;
      rec.ts = now;
    }
    rec.n++;
    this.hits.set(ip, rec);
    // 30/10m: keep abuse protection; allow portal smoke + Playwright from shared QA IP
    if (rec.n > 30) throw new HttpException("Too many attempts. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
  }

  @Public()
  @Post("register")
  register(@Body() b: RegisterDto, @Req() req: Request) {
    this.rateLimit(clientIp(req));
    return this.auth.register(b, meta(req));
  }

  @Public()
  @Post("verify-email")
  verifyEmail(@Body() b: EmailCodeDto) {
    return this.auth.verifyEmail(b?.email, b?.code);
  }

  @Public()
  @Post("login")
  async login(
    @Body() b: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.rateLimit(clientIp(req));
    const { tokens, mustChangePassword } = await this.auth.login(b?.email, b?.password, meta(req));
    setCookies(res, tokens);
    return { ok: true, mustChangePassword };
  }

  @Public()
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.refresh(req.cookies?.st_customer_refresh, meta(req));
    setCookies(res, tokens);
    return { ok: true };
  }

  @Public()
  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.st_customer_refresh);
    clearCookies(res);
    return { ok: true };
  }

  @Public()
  @Post("forgot-password")
  forgot(@Body() b: EmailDto, @Req() req: Request) {
    this.rateLimit(clientIp(req));
    return this.auth.forgotPassword(b?.email);
  }

  @Public()
  @Post("reset-password")
  reset(@Body() b: ResetPasswordDto, @Req() req: Request) {
    this.rateLimit(clientIp(req));
    return this.auth.resetPassword(b?.email, b?.code, b?.newPassword);
  }

  @Public()
  @Post("otp/request")
  otpRequest(@Body() b: EmailDto, @Req() req: Request) {
    this.rateLimit(clientIp(req));
    return this.auth.requestOtp(b?.email);
  }

  @Public()
  @Post("otp/verify")
  async otpVerify(
    @Body() b: EmailCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.rateLimit(clientIp(req));
    const { tokens, mustChangePassword } = await this.auth.verifyOtp(b?.email, b?.code, meta(req));
    setCookies(res, tokens);
    return { ok: true, mustChangePassword };
  }
}
