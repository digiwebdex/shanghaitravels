import {
  CanActivate, ExecutionContext, Injectable, SetMetadata,
  UnauthorizedException, ForbiddenException, createParamDecorator,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "./prisma.service";

export const IS_PUBLIC = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const PERMS = "requiredPerms";
export const Permissions = (...perms: string[]) => SetMetadata(PERMS, perms);

export interface AuthedUser { id: string; email: string; role: string; branchId?: string | null; permissions: Set<string> }
export const CurrentUser = createParamDecorator(
  (_d, ctx: ExecutionContext): AuthedUser => ctx.switchToHttp().getRequest().user,
);

/** Resolves the caller from the access-token cookie and attaches effective permissions. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private prisma: PrismaService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()])) return true;
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.st_access;
    if (!token) throw new UnauthorizedException("Not authenticated");

    let sub: string;
    try {
      sub = this.jwt.verify(token, { secret: process.env.JWT_ACCESS_SECRET }).sub;
    } catch {
      throw new UnauthorizedException("Session expired");
    }

    const user = await this.prisma.user.findFirst({
      where: { id: sub, status: "active", deletedAt: null },
      include: { role: { include: { permissions: { include: { perm: true } } } }, overrides: { include: { perm: true } } },
    });
    if (!user) throw new UnauthorizedException("User not found or disabled");

    const perms = new Set<string>(user.role.permissions.map((rp) => rp.perm.key));
    for (const o of user.overrides) o.effect === "allow" ? perms.add(o.perm.key) : perms.delete(o.perm.key);

    req.user = { id: user.id, email: user.email, role: user.role.name, branchId: user.branchId, permissions: perms } as AuthedUser;

    // Force password change server-side (frontend redirect alone is not enough).
    if (user.mustChangePassword) {
      const path = String(req.path || req.url || "");
      const allowed =
        path.endsWith("/auth/me") ||
        path.endsWith("/auth/change-password") ||
        path.includes("/auth/me") ||
        path.includes("/auth/change-password");
      if (!allowed) {
        throw new ForbiddenException("Password change required");
      }
    }
    return true;
  }
}

/** Enforces @Permissions(...) — super_admin bypasses; everyone else needs ALL listed perms. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMS, [ctx.getHandler(), ctx.getClass()]);
    if (!required?.length) return true;
    const user: AuthedUser = ctx.switchToHttp().getRequest().user;
    if (!user) throw new UnauthorizedException();
    if (user.role === "super_admin") return true;
    const ok = required.every((p) => user.permissions.has(p));
    if (!ok) throw new ForbiddenException(`Missing permission: ${required.filter((p) => !user.permissions.has(p)).join(", ")}`);
    return true;
  }
}
