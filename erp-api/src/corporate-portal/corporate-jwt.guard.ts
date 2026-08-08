import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException, createParamDecorator } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";

export interface CorporateCtx {
  corporateUserId: string;
  corporateClientId: string;
  email: string;
  companyName: string;
  role: string;
  employeeId: string | null;
  mustChangePassword: boolean;
}
export const CurrentCorporate = createParamDecorator(
  (_d, ctx: ExecutionContext): CorporateCtx => ctx.switchToHttp().getRequest().corporate,
);

/**
 * Authenticates CORPORATE portal accounts only. Uses JWT_CORPORATE_SECRET + the
 * `st_corporate` cookie + an `aud:"corporate"` claim — isolated from staff and
 * agent/customer portals. Applied explicitly on /portal/corporate/* controllers.
 */
@Injectable()
export class CorporateJwtGuard implements CanActivate {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.st_corporate;
    if (!token) throw new UnauthorizedException("Not authenticated");
    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: process.env.JWT_CORPORATE_SECRET });
    } catch {
      throw new UnauthorizedException("Session expired");
    }
    if (payload.aud !== "corporate") throw new UnauthorizedException("Invalid token");

    const cu = await this.prisma.corporateUser.findFirst({
      where: { id: payload.sub, status: "active", deletedAt: null },
      include: { corporateClient: true },
    });
    if (!cu || cu.corporateClient.deletedAt || !cu.corporateClient.isActive) {
      throw new UnauthorizedException("Account disabled");
    }
    if (payload.corporateClientId && payload.corporateClientId !== cu.corporateClientId) {
      throw new UnauthorizedException("Invalid token");
    }

    req.corporate = {
      corporateUserId: cu.id,
      corporateClientId: cu.corporateClientId,
      email: cu.email,
      companyName: cu.corporateClient.companyName,
      role: cu.role,
      employeeId: cu.employeeId || null,
      mustChangePassword: cu.mustChangePassword,
    } as CorporateCtx;

    if (cu.mustChangePassword) {
      const path = String(req.path || req.url || "");
      const allowed =
        path.includes("/portal/corporate/me") ||
        path.includes("/portal/corporate/change-password") ||
        path.includes("/portal/corporate/logout");
      if (!allowed) throw new ForbiddenException("Password change required");
    }
    return true;
  }
}
