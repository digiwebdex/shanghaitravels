import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(email: string, password: string, meta: { ua?: string; ip?: string }) {
    if (!email || !password) throw new BadRequestException("Email and password are required.");
    const user = await this.prisma.user.findFirst({ where: { email: email.toLowerCase(), status: "active", deletedAt: null } });
    // constant-ish work even on unknown user
    const ok = user ? await argon2.verify(user.passwordHash, password).catch(() => false) : (await argon2.hash(password), false);
    if (!user || !ok) throw new UnauthorizedException("Invalid email or password");
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issueTokens(user.id, meta);
    return { tokens, mustChangePassword: user.mustChangePassword };
  }

  async refresh(raw: string, meta: { ua?: string; ip?: string }) {
    if (!raw) throw new UnauthorizedException();
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(raw) } });
    if (!row || row.revokedAt || row.expiresAt < new Date()) throw new UnauthorizedException("Refresh invalid");
    await this.prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } }); // rotate
    return this.issueTokens(row.userId, meta);
  }

  async logout(raw?: string) {
    if (raw) await this.prisma.refreshToken.updateMany({ where: { tokenHash: sha256(raw), revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async me(u: AuthedUser) {
    const user = await this.prisma.user.findUnique({ where: { id: u.id }, select: { id: true, email: true, fullName: true, mustChangePassword: true, branchId: true } });
    return { ...user, role: u.role, permissions: [...u.permissions], activeServices: await this.activeServices() };
  }

  // Admin-controlled list of enabled service modules (Settings key `active_services`).
  // The ERP frontend hides modules not in this list; owner edits it from admin.
  // Default = China scope (ticket, visa, hotel, study, work) if unset.
  async activeServices(): Promise<string[]> {
    const s = await this.prisma.setting.findUnique({ where: { key: "active_services" } });
    const v = s?.value as unknown;
    return Array.isArray(v) ? (v as string[]) : ["visa", "air_ticket", "hotel", "student", "work"];
  }

  async changePassword(userId: string, current: string, next: string) {
    if (!next || next.length < 8) throw new BadRequestException("New password must be at least 8 characters");
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await argon2.verify(user.passwordHash, current))) throw new UnauthorizedException("Current password incorrect");
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(next, { type: argon2.argon2id }), mustChangePassword: false } });
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }); // kill other sessions
  }

  private async issueTokens(userId: string, meta: { ua?: string; ip?: string }) {
    const access = await this.jwt.signAsync({ sub: userId }, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.ACCESS_TTL || "15m" });
    const raw = randomBytes(32).toString("base64url");
    const days = Number(process.env.REFRESH_TTL_DAYS || 30);
    await this.prisma.refreshToken.create({ data: { userId, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + days * 864e5), userAgent: meta.ua, ip: meta.ip } });
    return { access, refresh: raw };
  }
}
