import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes, randomInt } from "crypto";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
type Meta = { ua?: string; ip?: string };

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private notes: NotificationsService,
  ) {}

  private returnCodes() {
    return process.env.PORTAL_RETURN_CODES === "true";
  }

  private async issueCode(email: string, purpose: string, customerUserId?: string | null) {
    const code = String(randomInt(100000, 999999));
    const codeHash = sha256(code);
    await this.prisma.customerAuthCode.updateMany({
      where: { email, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.prisma.customerAuthCode.create({
      data: {
        email,
        purpose,
        codeHash,
        customerUserId: customerUserId || null,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    await this.notes.enqueue({
      channel: purpose === "login_otp" ? "sms" : "email",
      recipient: email,
      subject: `Shanghai Travels ${purpose}`,
      body: `Your code is ${code}. Valid 30 minutes.`,
      relatedType: "CustomerAuthCode",
      relatedId: customerUserId || email,
    });
    return code;
  }

  private async consumeCode(email: string, purpose: string, code: string) {
    const row = await this.prisma.customerAuthCode.findFirst({
      where: { email: email.toLowerCase(), purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!row || row.expiresAt < new Date()) throw new BadRequestException("Code expired or invalid");
    if (row.attempts >= 8) throw new ForbiddenException("Too many attempts");
    await this.prisma.customerAuthCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    if (row.codeHash !== sha256(String(code || "").trim())) throw new BadRequestException("Invalid code");
    await this.prisma.customerAuthCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
    return row;
  }

  async register(dto: any, meta: Meta) {
    const email = String(dto?.email || "").toLowerCase().trim();
    const password = String(dto?.password || "");
    const fullName = String(dto?.fullName || "").trim().slice(0, 100);
    const phone = dto?.phone ? String(dto.phone).trim().slice(0, 20) : null;
    if (!email || !email.includes("@")) throw new BadRequestException("Valid email required");
    if (password.length < 8) throw new BadRequestException("Password must be at least 8 characters");
    if (fullName.length < 2) throw new BadRequestException("fullName required");

    const existingUser = await this.prisma.customerUser.findFirst({ where: { email, deletedAt: null } });
    if (existingUser) throw new BadRequestException("Email already registered");

    const branch =
      (await this.prisma.branch.findFirst({ where: { type: "corporate" } })) ??
      (await this.prisma.branch.findFirst());
    if (!branch) throw new BadRequestException("System not ready");

    let customer = phone
      ? await this.prisma.customer.findFirst({ where: { phone, deletedAt: null } })
      : null;
    if (!customer) {
      customer = await this.prisma.customer.findFirst({ where: { email, deletedAt: null } });
    }
    if (!customer) {
      const code = `CUS-${String((await this.prisma.customer.count()) + 1).padStart(6, "0")}`;
      customer = await this.prisma.customer.create({
        data: {
          branchId: branch.id,
          code,
          fullName,
          email,
          phone: phone || undefined,
          source: "customer_portal",
          createdBy: "customer-register",
        },
      });
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await this.prisma.customerUser.create({
      data: {
        customerId: customer.id,
        email,
        phone,
        passwordHash,
        status: "pending",
        createdBy: "self-register",
      },
    });

    const verifyCode = await this.issueCode(email, "email_verify", user.id);
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: "portal.customer.register",
        entityType: "CustomerUser",
        entityId: user.id,
        after: { email, customerId: customer.id, ip: meta.ip } as any,
      },
    });

    return {
      ok: true,
      email,
      requiresVerification: true,
      ...(this.returnCodes() ? { devCode: verifyCode } : {}),
    };
  }

  async verifyEmail(emailRaw: string, code: string) {
    const email = String(emailRaw || "").toLowerCase().trim();
    await this.consumeCode(email, "email_verify", code);
    const user = await this.prisma.customerUser.findFirst({ where: { email, deletedAt: null } });
    if (!user) NotFoundish();
    await this.prisma.customerUser.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), status: "active" },
    });
    await this.prisma.auditLog.create({
      data: {
        action: "portal.customer.verify_email",
        entityType: "CustomerUser",
        entityId: user.id,
        after: { email } as any,
      },
    });
    return { ok: true };
  }

  async login(emailRaw: string, password: string, meta: Meta) {
    if (!emailRaw || !password) throw new BadRequestException("Email and password are required.");
    const email = emailRaw.toLowerCase().trim();
    const cu = await this.prisma.customerUser.findFirst({
      where: { email, deletedAt: null },
      include: { customer: true },
    });
    const ok = cu
      ? await argon2.verify(cu.passwordHash, password).catch(() => false)
      : ((await argon2.hash(password)), false);
    if (!cu || !ok) throw new UnauthorizedException("Invalid email or password");
    if (cu.status === "disabled" || cu.customer.deletedAt || cu.customer.status !== "active") {
      throw new ForbiddenException("Account is not active");
    }
    if (!cu.emailVerifiedAt) throw new ForbiddenException("Email verification required");
    await this.prisma.customerUser.update({ where: { id: cu.id }, data: { lastLoginAt: new Date(), status: "active" } });
    return {
      tokens: await this.issueTokens(cu.id, cu.customerId, meta),
      mustChangePassword: cu.mustChangePassword,
    };
  }

  async refresh(raw: string | undefined, meta: Meta) {
    if (!raw) throw new UnauthorizedException();
    const row = await this.prisma.customerRefreshToken.findUnique({
      where: { tokenHash: sha256(raw) },
      include: { customerUser: true },
    });
    if (!row || row.revokedAt || row.expiresAt < new Date()) throw new UnauthorizedException("Refresh invalid");
    await this.prisma.customerRefreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(row.customerUserId, row.customerUser.customerId, meta);
  }

  async logout(raw?: string) {
    if (raw) {
      await this.prisma.customerRefreshToken.updateMany({
        where: { tokenHash: sha256(raw), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async changePassword(customerUserId: string, current: string, next: string) {
    if (!next || next.length < 8) throw new BadRequestException("New password must be at least 8 characters");
    const cu = await this.prisma.customerUser.findUnique({ where: { id: customerUserId } });
    if (!cu || !(await argon2.verify(cu.passwordHash, current))) {
      throw new UnauthorizedException("Current password incorrect");
    }
    await this.prisma.customerUser.update({
      where: { id: customerUserId },
      data: {
        passwordHash: await argon2.hash(next, { type: argon2.argon2id }),
        mustChangePassword: false,
      },
    });
    await this.prisma.customerRefreshToken.updateMany({
      where: { customerUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(emailRaw: string) {
    const email = String(emailRaw || "").toLowerCase().trim();
    if (!email) throw new BadRequestException("email required");
    const cu = await this.prisma.customerUser.findFirst({ where: { email, deletedAt: null } });
    // Always opaque success
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
    const cu = await this.prisma.customerUser.findFirst({ where: { email, deletedAt: null } });
    if (!cu) throw new BadRequestException("Invalid reset");
    await this.prisma.customerUser.update({
      where: { id: cu.id },
      data: {
        passwordHash: await argon2.hash(next, { type: argon2.argon2id }),
        mustChangePassword: false,
        status: "active",
        emailVerifiedAt: cu.emailVerifiedAt || new Date(),
      },
    });
    await this.prisma.customerRefreshToken.updateMany({
      where: { customerUserId: cu.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async requestOtp(emailRaw: string) {
    const email = String(emailRaw || "").toLowerCase().trim();
    const cu = await this.prisma.customerUser.findFirst({ where: { email, deletedAt: null, status: { not: "disabled" } } });
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
    const cu = await this.prisma.customerUser.findFirst({
      where: { email, deletedAt: null },
      include: { customer: true },
    });
    if (!cu || cu.status === "disabled") throw new UnauthorizedException("Invalid OTP");
    if (!cu.emailVerifiedAt) {
      await this.prisma.customerUser.update({
        where: { id: cu.id },
        data: { emailVerifiedAt: new Date(), status: "active" },
      });
    }
    await this.prisma.customerUser.update({ where: { id: cu.id }, data: { lastLoginAt: new Date() } });
    return {
      tokens: await this.issueTokens(cu.id, cu.customerId, meta),
      mustChangePassword: cu.mustChangePassword,
    };
  }

  /** Staff invite/reset */
  async createPortalAccount(customerId: string, staffId: string, emailOverride?: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!customer) throw new BadRequestException("Customer not found");
    const email = (emailOverride || customer.email || "").toLowerCase();
    if (!email) throw new BadRequestException("Customer has no email — pass one to create the login");
    const temp = randomBytes(6).toString("base64url");
    const passwordHash = await argon2.hash(temp, { type: argon2.argon2id });
    const existing = await this.prisma.customerUser.findFirst({ where: { email } });
    if (existing) {
      await this.prisma.customerUser.update({
        where: { id: existing.id },
        data: {
          customerId,
          passwordHash,
          mustChangePassword: true,
          status: "active",
          emailVerifiedAt: new Date(),
          deletedAt: null,
        },
      });
      await this.prisma.customerRefreshToken.updateMany({
        where: { customerUserId: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.customerUser.create({
        data: {
          customerId,
          email,
          phone: customer.phone,
          passwordHash,
          status: "active",
          emailVerifiedAt: new Date(),
          mustChangePassword: true,
          createdBy: staffId,
        },
      });
    }
    await this.prisma.auditLog.create({
      data: {
        userId: staffId,
        action: "portal.customer.invite",
        entityType: "CustomerUser",
        entityId: customerId,
        after: { email } as any,
      },
    });
    return { email, tempPassword: temp };
  }

  private async issueTokens(customerUserId: string, customerId: string, meta: Meta) {
    const access = await this.jwt.signAsync(
      { sub: customerUserId, customerId, aud: "customer" },
      { secret: process.env.JWT_CUSTOMER_SECRET, expiresIn: process.env.ACCESS_TTL || "15m" },
    );
    const raw = randomBytes(32).toString("base64url");
    const days = Number(process.env.REFRESH_TTL_DAYS || 30);
    await this.prisma.customerRefreshToken.create({
      data: {
        customerUserId,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + days * 864e5),
        userAgent: meta.ua,
        ip: meta.ip,
      },
    });
    return { access, refresh: raw };
  }
}

function NotFoundish(): never {
  throw new BadRequestException("Invalid verification");
}
