import { Controller, Get, Post, Patch, Body, Param, BadRequestException } from "@nestjs/common";
import { randomBytes } from "crypto";
import * as argon2 from "argon2";
import { Permissions, CurrentUser, AuthedUser } from "./rbac";
import { PrismaService } from "./prisma.service";

// Staff roles that can be created from the Add-Staff panel. super_admin is
// deliberately excluded — chairman accounts are not minted from the UI.
const STAFF_ROLES = ["visa_executive", "visa_consultant", "office_incharge", "accounts_manager", "marketing_manager", "general_manager"];

@Controller("users")
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get() @Permissions("user:manage")
  async list() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null }, orderBy: { createdAt: "asc" },
      select: { id: true, fullName: true, email: true, status: true, lastLoginAt: true, mustChangePassword: true, role: { select: { name: true } } },
    });
    return users.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, status: u.status, lastLoginAt: u.lastLoginAt, mustChangePassword: u.mustChangePassword, role: u.role?.name }));
  }

  /**
   * Lightweight staff picker for case assignment.
   * Requires application:assign (not user:manage) so managers can assign peers.
   */
  @Get("assignable") @Permissions("application:assign")
  async assignable() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, status: "active" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, email: true, status: true, role: { select: { name: true } } },
    });
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      status: u.status,
      role: u.role?.name,
    }));
  }

  @Post() @Permissions("user:manage")
  async create(@Body() b: any, @CurrentUser() _u: AuthedUser) {
    const fullName = String(b?.fullName || "").trim();
    const email = String(b?.email || "").trim().toLowerCase();
    const roleName = String(b?.role || "").trim();
    if (fullName.length < 2) throw new BadRequestException("Full name is required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequestException("A valid email is required");
    if (!STAFF_ROLES.includes(roleName)) throw new BadRequestException("Invalid role");
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new BadRequestException("Role not found");
    if (await this.prisma.user.findFirst({ where: { email } })) throw new BadRequestException("A user with that email already exists");
    const branch = (await this.prisma.branch.findFirst({ where: { type: "corporate" } })) ?? (await this.prisma.branch.findFirst());
    const temp = randomBytes(6).toString("base64url"); // ~8 chars, one-time
    const user = await this.prisma.user.create({
      data: { email, fullName, passwordHash: await argon2.hash(temp, { type: argon2.argon2id }), roleId: role.id, branchId: branch?.id, mustChangePassword: true, status: "active" },
    });
    return { ok: true, id: user.id, fullName, email, role: roleName, tempPassword: temp };
  }

  // Enable/disable a staff account (soft — never hard-delete).
  @Patch(":id") @Permissions("user:manage")
  async update(@Param("id") id: string, @Body() b: any) {
    const data: any = {};
    if (b?.status === "active" || b?.status === "disabled") data.status = b.status;
    if (!Object.keys(data).length) throw new BadRequestException("Nothing to update");
    const u = await this.prisma.user.update({ where: { id }, data, select: { id: true, status: true } });
    return { ok: true, ...u };
  }
}
