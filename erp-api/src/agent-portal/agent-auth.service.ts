import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes, randomInt } from "crypto";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
type Meta = { ua?: string; ip?: string };

@Injectable()
export class AgentAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private notes: NotificationsService,
  ) {}

  private returnCodes() {
    return process.env.PORTAL_RETURN_CODES === "true";
  }

  private async issueCode(email: string, purpose: string, agentUserId?: string | null) {
    const code = String(randomInt(100000, 999999));
    const codeHash = sha256(code);
    await this.prisma.agentAuthCode.updateMany({
      where: { email, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.prisma.agentAuthCode.create({
      data: {
        email,
        purpose,
        codeHash,
        agentUserId: agentUserId || null,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    await this.notes.enqueue({
      channel: purpose === "login_otp" ? "sms" : "email",
      recipient: email,
      subject: `Shanghai Travels agent ${purpose}`,
      body: `Your code is ${code}. Valid 30 minutes.`,
      relatedType: "AgentAuthCode",
      relatedId: agentUserId || email,
    });
    return code;
  }

  private async consumeCode(email: string, purpose: string, code: string) {
    const row = await this.prisma.agentAuthCode.findFirst({
      where: { email: email.toLowerCase(), purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!row || row.expiresAt < new Date()) throw new BadRequestException("Code expired or invalid");
    if (row.attempts >= 8) throw new ForbiddenException("Too many attempts");
    await this.prisma.agentAuthCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    if (row.codeHash !== sha256(String(code || "").trim())) throw new BadRequestException("Invalid code");
    await this.prisma.agentAuthCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
    return row;
  }

  async login(email: string, password: string, meta: Meta) {
    if (!email || !password) throw new BadRequestException("Email and password are required.");
    const au = await this.prisma.agentUser.findFirst({
      where: { email: email.toLowerCase(), status: "active", deletedAt: null },
      include: { agent: true },
    });
    const ok = au
      ? await argon2.verify(au.passwordHash, password).catch(() => false)
      : ((await argon2.hash(password)), false);
    if (!au || !ok) throw new UnauthorizedException("Invalid email or password");
    if (au.agent.deletedAt || au.agent.status !== "active") throw new ForbiddenException("Agent account is not active");
    await this.prisma.agentUser.update({ where: { id: au.id }, data: { lastLoginAt: new Date() } });
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: "portal.agent.login",
        entityType: "AgentUser",
        entityId: au.id,
        after: { agentId: au.agentId, email: au.email, ip: meta.ip } as any,
      },
    });
    return { tokens: await this.issueTokens(au.id, au.agentId, meta), mustChangePassword: au.mustChangePassword };
  }

  async refresh(raw: string | undefined, meta: Meta) {
    if (!raw) throw new UnauthorizedException();
    const row = await this.prisma.agentRefreshToken.findUnique({
      where: { tokenHash: sha256(raw) },
      include: { agentUser: true },
    });
    if (!row || row.revokedAt || row.expiresAt < new Date()) throw new UnauthorizedException("Refresh invalid");
    await this.prisma.agentRefreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(row.agentUserId, row.agentUser.agentId, meta);
  }

  async logout(raw?: string) {
    if (raw) {
      const row = await this.prisma.agentRefreshToken.findUnique({
        where: { tokenHash: sha256(raw) },
        select: { agentUserId: true, agentUser: { select: { agentId: true } } },
      });
      await this.prisma.agentRefreshToken.updateMany({
        where: { tokenHash: sha256(raw), revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (row) {
        await this.prisma.auditLog.create({
          data: {
            userId: null,
            action: "portal.agent.logout",
            entityType: "AgentUser",
            entityId: row.agentUserId,
            after: { agentId: row.agentUser.agentId } as any,
          },
        });
      }
    }
  }

  async changePassword(agentUserId: string, current: string, next: string) {
    if (!next || next.length < 8) throw new BadRequestException("New password must be at least 8 characters");
    const au = await this.prisma.agentUser.findUnique({ where: { id: agentUserId } });
    if (!au || !(await argon2.verify(au.passwordHash, current))) {
      throw new UnauthorizedException("Current password incorrect");
    }
    await this.prisma.agentUser.update({
      where: { id: agentUserId },
      data: { passwordHash: await argon2.hash(next, { type: argon2.argon2id }), mustChangePassword: false },
    });
    await this.prisma.agentRefreshToken.updateMany({
      where: { agentUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: "portal.agent.password_change",
        entityType: "AgentUser",
        entityId: agentUserId,
        after: { agentId: au.agentId } as any,
      },
    });
  }

  async forgotPassword(emailRaw: string) {
    const email = String(emailRaw || "").toLowerCase().trim();
    if (!email) throw new BadRequestException("email required");
    const au = await this.prisma.agentUser.findFirst({ where: { email, deletedAt: null } });
    let devCode: string | undefined;
    if (au) {
      const code = await this.issueCode(email, "password_reset", au.id);
      if (this.returnCodes()) devCode = code;
    }
    return { ok: true, ...(devCode ? { devCode } : {}) };
  }

  async resetPassword(emailRaw: string, code: string, next: string) {
    if (!next || next.length < 8) throw new BadRequestException("New password must be at least 8 characters");
    const email = String(emailRaw || "").toLowerCase().trim();
    await this.consumeCode(email, "password_reset", code);
    const au = await this.prisma.agentUser.findFirst({ where: { email, deletedAt: null } });
    if (!au) throw new BadRequestException("Invalid reset");
    await this.prisma.agentUser.update({
      where: { id: au.id },
      data: {
        passwordHash: await argon2.hash(next, { type: argon2.argon2id }),
        mustChangePassword: false,
        status: "active",
      },
    });
    await this.prisma.agentRefreshToken.updateMany({
      where: { agentUserId: au.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: "portal.agent.password_reset",
        entityType: "AgentUser",
        entityId: au.id,
        after: { agentId: au.agentId, email } as any,
      },
    });
    return { ok: true };
  }

  async requestOtp(emailRaw: string) {
    const email = String(emailRaw || "").toLowerCase().trim();
    const au = await this.prisma.agentUser.findFirst({
      where: { email, deletedAt: null, status: "active" },
    });
    let devCode: string | undefined;
    if (au) {
      const code = await this.issueCode(email, "login_otp", au.id);
      if (this.returnCodes()) devCode = code;
    }
    return { ok: true, ...(devCode ? { devCode } : {}) };
  }

  async verifyOtp(emailRaw: string, code: string, meta: Meta) {
    const email = String(emailRaw || "").toLowerCase().trim();
    await this.consumeCode(email, "login_otp", code);
    const au = await this.prisma.agentUser.findFirst({
      where: { email, deletedAt: null },
      include: { agent: true },
    });
    if (!au || au.status !== "active" || au.agent.deletedAt || au.agent.status !== "active") {
      throw new UnauthorizedException("Invalid OTP");
    }
    await this.prisma.agentUser.update({ where: { id: au.id }, data: { lastLoginAt: new Date() } });
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: "portal.agent.otp_login",
        entityType: "AgentUser",
        entityId: au.id,
        after: { agentId: au.agentId, email, ip: meta.ip } as any,
      },
    });
    return {
      tokens: await this.issueTokens(au.id, au.agentId, meta),
      mustChangePassword: au.mustChangePassword,
    };
  }

  /** Staff-only (agent:manage): create OR reset an agent's portal login. Returns a temp password. */
  async createPortalAccount(agentId: string, staffId: string, emailOverride?: string, branchId?: string) {
    const agent = await this.prisma.agent.findFirst({ where: { id: agentId, deletedAt: null } });
    if (!agent) throw new BadRequestException("Agent not found");
    if (branchId) {
      const branch = await this.prisma.branch.findFirst({ where: { id: branchId } });
      if (!branch) throw new BadRequestException("Invalid branchId");
      await this.prisma.agent.update({ where: { id: agentId }, data: { branchId } });
    }
    const email = (emailOverride || agent.email || "").toLowerCase();
    if (!email) throw new BadRequestException("Agent has no email — pass one to create the login");
    const temp = randomBytes(6).toString("base64url");
    const passwordHash = await argon2.hash(temp, { type: argon2.argon2id });
    const existing = await this.prisma.agentUser.findFirst({ where: { email } });
    let agentUserId: string;
    if (existing) {
      await this.prisma.agentUser.update({
        where: { id: existing.id },
        data: { agentId, passwordHash, mustChangePassword: true, status: "active", deletedAt: null },
      });
      await this.prisma.agentRefreshToken.updateMany({
        where: { agentUserId: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      agentUserId = existing.id;
    } else {
      const created = await this.prisma.agentUser.create({
        data: { agentId, email, passwordHash, createdBy: staffId },
      });
      agentUserId = created.id;
    }
    await this.notes.enqueue({
      channel: "email",
      recipient: email,
      subject: "Shanghai Travels agent portal invitation",
      body: `Your agent portal login is ready. Email: ${email}. Temporary password: ${temp}. Sign in and change your password.`,
      relatedType: "AgentUser",
      relatedId: agentUserId,
    });
    await this.prisma.auditLog.create({
      data: {
        userId: staffId,
        action: "portal.agent.invite",
        entityType: "AgentUser",
        entityId: agentUserId,
        after: { email, agentId, branchId: branchId || agent.branchId } as any,
      },
    });
    return { email, tempPassword: temp, invited: true };
  }

  private async issueTokens(agentUserId: string, agentId: string, meta: Meta) {
    const access = await this.jwt.signAsync(
      { sub: agentUserId, agentId, aud: "agent" },
      { secret: process.env.JWT_AGENT_SECRET, expiresIn: process.env.ACCESS_TTL || "15m" },
    );
    const raw = randomBytes(32).toString("base64url");
    const days = Number(process.env.REFRESH_TTL_DAYS || 30);
    await this.prisma.agentRefreshToken.create({
      data: {
        agentUserId,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + days * 864e5),
        userAgent: meta.ua,
        ip: meta.ip,
      },
    });
    return { access, refresh: raw };
  }
}
