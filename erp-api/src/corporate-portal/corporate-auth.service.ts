import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes, randomInt } from "crypto";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
type Meta = { ua?: string; ip?: string };

const DEFAULT_CHAIN_STEPS = [
  { levelNo: 1, role: "manager", name: "Manager" },
  { levelNo: 2, role: "dept_head", name: "Department Head" },
  { levelNo: 3, role: "finance", name: "Finance" },
  { levelNo: 4, role: "travel_desk", name: "Travel Desk" },
];

@Injectable()
export class CorporateAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private notes: NotificationsService,
  ) {}

  private returnCodes() {
    return process.env.PORTAL_RETURN_CODES === "true";
  }

  private async issueCode(email: string, purpose: string, corporateUserId?: string | null) {
    const code = String(randomInt(100000, 999999));
    const codeHash = sha256(code);
    await this.prisma.corporateAuthCode.updateMany({
      where: { email, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.prisma.corporateAuthCode.create({
      data: {
        email,
        purpose,
        codeHash,
        corporateUserId: corporateUserId || null,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    await this.notes.enqueue({
      channel: purpose === "login_otp" ? "sms" : "email",
      recipient: email,
      subject: `Shanghai Travels corporate ${purpose}`,
      body: `Your code is ${code}. Valid 30 minutes.`,
      relatedType: "CorporateAuthCode",
      relatedId: corporateUserId || email,
    });
    return code;
  }

  private async consumeCode(email: string, purpose: string, code: string) {
    const row = await this.prisma.corporateAuthCode.findFirst({
      where: { email: email.toLowerCase(), purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!row || row.expiresAt < new Date()) throw new BadRequestException("Code expired or invalid");
    if (row.attempts >= 8) throw new ForbiddenException("Too many attempts");
    await this.prisma.corporateAuthCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    if (row.codeHash !== sha256(String(code || "").trim())) throw new BadRequestException("Invalid code");
    await this.prisma.corporateAuthCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
    return row;
  }

  async login(email: string, password: string, meta: Meta) {
    if (!email || !password) throw new BadRequestException("Email and password are required.");
    const cu = await this.prisma.corporateUser.findFirst({
      where: { email: email.toLowerCase(), status: "active", deletedAt: null },
      include: { corporateClient: true },
    });
    const ok = cu
      ? await argon2.verify(cu.passwordHash, password).catch(() => false)
      : ((await argon2.hash(password)), false);
    if (!cu || !ok) throw new UnauthorizedException("Invalid email or password");
    if (cu.corporateClient.deletedAt || !cu.corporateClient.isActive) {
      throw new ForbiddenException("Corporate account is not active");
    }
    await this.prisma.corporateUser.update({ where: { id: cu.id }, data: { lastLoginAt: new Date() } });
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: "portal.corporate.login",
        entityType: "CorporateUser",
        entityId: cu.id,
        after: { corporateClientId: cu.corporateClientId, email: cu.email, ip: meta.ip } as any,
      },
    });
    return {
      tokens: await this.issueTokens(cu.id, cu.corporateClientId, meta),
      mustChangePassword: cu.mustChangePassword,
    };
  }

  async refresh(raw: string | undefined, meta: Meta) {
    if (!raw) throw new UnauthorizedException();
    const row = await this.prisma.corporateRefreshToken.findUnique({
      where: { tokenHash: sha256(raw) },
      include: { corporateUser: true },
    });
    if (!row || row.revokedAt || row.expiresAt < new Date()) throw new UnauthorizedException("Refresh invalid");
    await this.prisma.corporateRefreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(row.corporateUserId, row.corporateUser.corporateClientId, meta);
  }

  async logout(raw?: string) {
    if (raw) {
      const row = await this.prisma.corporateRefreshToken.findUnique({
        where: { tokenHash: sha256(raw) },
        select: { corporateUserId: true, corporateUser: { select: { corporateClientId: true } } },
      });
      await this.prisma.corporateRefreshToken.updateMany({
        where: { tokenHash: sha256(raw), revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (row) {
        await this.prisma.auditLog.create({
          data: {
            userId: null,
            action: "portal.corporate.logout",
            entityType: "CorporateUser",
            entityId: row.corporateUserId,
            after: { corporateClientId: row.corporateUser.corporateClientId } as any,
          },
        });
      }
    }
  }

  async changePassword(corporateUserId: string, current: string, next: string) {
    if (!next || next.length < 8) throw new BadRequestException("New password must be at least 8 characters");
    const cu = await this.prisma.corporateUser.findUnique({ where: { id: corporateUserId } });
    if (!cu || !(await argon2.verify(cu.passwordHash, current))) {
      throw new UnauthorizedException("Current password incorrect");
    }
    await this.prisma.corporateUser.update({
      where: { id: corporateUserId },
      data: { passwordHash: await argon2.hash(next, { type: argon2.argon2id }), mustChangePassword: false },
    });
    await this.prisma.corporateRefreshToken.updateMany({
      where: { corporateUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: "portal.corporate.password_change",
        entityType: "CorporateUser",
        entityId: corporateUserId,
        after: { corporateClientId: cu.corporateClientId } as any,
      },
    });
  }

  async forgotPassword(emailRaw: string) {
    const email = String(emailRaw || "").toLowerCase().trim();
    if (!email) throw new BadRequestException("email required");
    const cu = await this.prisma.corporateUser.findFirst({ where: { email, deletedAt: null } });
    let devCode: string | undefined;
    if (cu) {
      const code = await this.issueCode(email, "password_reset", cu.id);
      if (this.returnCodes()) devCode = code;
    }
    return { ok: true, ...(devCode ? { devCode } : {}) };
  }

  async resetPassword(emailRaw: string, code: string, next: string) {
    if (!next || next.length < 8) throw new BadRequestException("New password must be at least 8 characters");
    const email = String(emailRaw || "").toLowerCase().trim();
    await this.consumeCode(email, "password_reset", code);
    const cu = await this.prisma.corporateUser.findFirst({ where: { email, deletedAt: null } });
    if (!cu) throw new BadRequestException("Invalid reset");
    await this.prisma.corporateUser.update({
      where: { id: cu.id },
      data: {
        passwordHash: await argon2.hash(next, { type: argon2.argon2id }),
        mustChangePassword: false,
        status: "active",
      },
    });
    await this.prisma.corporateRefreshToken.updateMany({
      where: { corporateUserId: cu.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: "portal.corporate.password_reset",
        entityType: "CorporateUser",
        entityId: cu.id,
        after: { corporateClientId: cu.corporateClientId, email } as any,
      },
    });
    return { ok: true };
  }

  async requestOtp(emailRaw: string) {
    const email = String(emailRaw || "").toLowerCase().trim();
    const cu = await this.prisma.corporateUser.findFirst({
      where: { email, deletedAt: null, status: "active" },
    });
    let devCode: string | undefined;
    if (cu) {
      const code = await this.issueCode(email, "login_otp", cu.id);
      if (this.returnCodes()) devCode = code;
    }
    return { ok: true, ...(devCode ? { devCode } : {}) };
  }

  async verifyOtp(emailRaw: string, code: string, meta: Meta) {
    const email = String(emailRaw || "").toLowerCase().trim();
    await this.consumeCode(email, "login_otp", code);
    const cu = await this.prisma.corporateUser.findFirst({
      where: { email, deletedAt: null },
      include: { corporateClient: true },
    });
    if (!cu || cu.status !== "active" || cu.corporateClient.deletedAt || !cu.corporateClient.isActive) {
      throw new UnauthorizedException("Invalid OTP");
    }
    await this.prisma.corporateUser.update({ where: { id: cu.id }, data: { lastLoginAt: new Date() } });
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: "portal.corporate.otp_login",
        entityType: "CorporateUser",
        entityId: cu.id,
        after: { corporateClientId: cu.corporateClientId, email, ip: meta.ip } as any,
      },
    });
    return {
      tokens: await this.issueTokens(cu.id, cu.corporateClientId, meta),
      mustChangePassword: cu.mustChangePassword,
    };
  }

  private async ensureBillingCustomer(corporateClientId: string) {
    const client = await this.prisma.corporateClient.findFirst({
      where: { id: corporateClientId, deletedAt: null },
    });
    if (!client) throw new BadRequestException("Corporate client not found");
    if (!client.isActive) throw new BadRequestException("Corporate client is not active");

    if (client.billingCustomerId) {
      const cust = await this.prisma.customer.findFirst({
        where: { id: client.billingCustomerId, deletedAt: null },
      });
      if (cust) return client;
    }

    const branchId =
      client.branchId ||
      (await this.prisma.branch.findFirst({ where: { type: "corporate" } }))?.id ||
      (await this.prisma.branch.findFirst())?.id;
    if (!branchId) throw new BadRequestException("System not ready");

    const code = `CORP-${String((await this.prisma.customer.count()) + 1).padStart(6, "0")}`;
    const customer = await this.prisma.customer.create({
      data: {
        branchId,
        code,
        fullName: client.companyName,
        phone: client.phone || `corp-${corporateClientId.slice(0, 8)}`,
        email: client.email,
        address: client.address,
        type: "corporate",
        source: "corporate_portal",
        createdBy: `corporate:${corporateClientId}`,
      },
    });
    await this.prisma.corporateClient.update({
      where: { id: corporateClientId },
      data: { billingCustomerId: customer.id },
    });
    return client;
  }

  private async seedDefaultApprovalChain(corporateClientId: string) {
    let chain = await this.prisma.corporateApprovalChain.findFirst({
      where: { corporateClientId, isDefault: true },
      include: { steps: { orderBy: { levelNo: "asc" } } },
    });
    if (!chain) {
      chain = await this.prisma.corporateApprovalChain.create({
        data: { corporateClientId, name: "Default", isDefault: true },
        include: { steps: true },
      });
    }
    if (!chain.steps.length) {
      for (const step of DEFAULT_CHAIN_STEPS) {
        await this.prisma.corporateApprovalStep.create({
          data: { chainId: chain.id, ...step },
        });
      }
    }
    return chain;
  }

  /** Staff-only (corporate:manage): create OR reset a corporate portal login. */
  async createPortalAccount(
    corporateClientId: string,
    staffId: string,
    emailOverride?: string,
    role?: string,
  ) {
    await this.ensureBillingCustomer(corporateClientId);
    await this.seedDefaultApprovalChain(corporateClientId);

    const client = await this.prisma.corporateClient.findFirst({
      where: { id: corporateClientId, deletedAt: null, isActive: true },
    });
    if (!client) throw new BadRequestException("Corporate client not found or inactive");

    const email = (emailOverride || client.email || "").toLowerCase();
    if (!email) throw new BadRequestException("Corporate client has no email — pass one to create the login");

    const portalRole = role || "admin";
    const temp = randomBytes(6).toString("base64url");
    const passwordHash = await argon2.hash(temp, { type: argon2.argon2id });
    const existing = await this.prisma.corporateUser.findFirst({ where: { email } });
    let corporateUserId: string;
    if (existing) {
      await this.prisma.corporateUser.update({
        where: { id: existing.id },
        data: {
          corporateClientId,
          passwordHash,
          mustChangePassword: true,
          status: "active",
          role: portalRole,
          deletedAt: null,
        },
      });
      await this.prisma.corporateRefreshToken.updateMany({
        where: { corporateUserId: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      corporateUserId = existing.id;
    } else {
      const created = await this.prisma.corporateUser.create({
        data: {
          corporateClientId,
          email,
          passwordHash,
          role: portalRole,
          createdBy: staffId,
        },
      });
      corporateUserId = created.id;
    }
    await this.notes.enqueue({
      channel: "email",
      recipient: email,
      subject: "Shanghai Travels corporate portal invitation",
      body: `Your corporate portal login is ready. Email: ${email}. Temporary password: ${temp}. Sign in and change your password.`,
      relatedType: "CorporateUser",
      relatedId: corporateUserId,
    });
    await this.prisma.auditLog.create({
      data: {
        userId: staffId,
        action: "portal.corporate.invite",
        entityType: "CorporateUser",
        entityId: corporateUserId,
        after: { email, corporateClientId, role: portalRole } as any,
      },
    });
    return { email, tempPassword: temp, invited: true };
  }

  private async issueTokens(corporateUserId: string, corporateClientId: string, meta: Meta) {
    const access = await this.jwt.signAsync(
      { sub: corporateUserId, corporateClientId, aud: "corporate" },
      { secret: process.env.JWT_CORPORATE_SECRET, expiresIn: process.env.ACCESS_TTL || "15m" },
    );
    const raw = randomBytes(32).toString("base64url");
    const days = Number(process.env.REFRESH_TTL_DAYS || 30);
    await this.prisma.corporateRefreshToken.create({
      data: {
        corporateUserId,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + days * 864e5),
        userAgent: meta.ua,
        ip: meta.ip,
      },
    });
    return { access, refresh: raw };
  }
}
