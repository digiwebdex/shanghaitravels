import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException, createParamDecorator } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";

export interface CustomerCtx {
  customerUserId: string;
  customerId: string;
  email: string;
  fullName: string;
  mustChangePassword: boolean;
  emailVerified: boolean;
}

export const CurrentCustomer = createParamDecorator(
  (_d, ctx: ExecutionContext): CustomerCtx => ctx.switchToHttp().getRequest().customer,
);

/**
 * Customer portal only. JWT_CUSTOMER_SECRET + st_customer + aud:"customer".
 * Controllers must be @Public() so the global staff JwtAuthGuard skips them.
 */
@Injectable()
export class CustomerJwtGuard implements CanActivate {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.st_customer;
    if (!token) throw new UnauthorizedException("Not authenticated");
    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: process.env.JWT_CUSTOMER_SECRET });
    } catch {
      throw new UnauthorizedException("Session expired");
    }
    if (payload.aud !== "customer") throw new UnauthorizedException("Invalid token");

    const cu = await this.prisma.customerUser.findFirst({
      where: { id: payload.sub, status: { in: ["active", "pending"] }, deletedAt: null },
      include: { customer: true },
    });
    if (!cu || cu.customer.deletedAt || cu.customer.status !== "active") {
      throw new UnauthorizedException("Account disabled");
    }

    req.customer = {
      customerUserId: cu.id,
      customerId: cu.customerId,
      email: cu.email,
      fullName: cu.customer.fullName,
      mustChangePassword: cu.mustChangePassword,
      emailVerified: !!cu.emailVerifiedAt,
    } as CustomerCtx;

    if (cu.mustChangePassword || !cu.emailVerifiedAt) {
      const path = String(req.path || req.url || "");
      const allowed =
        path.includes("/portal/customer/me") ||
        path.includes("/portal/customer/change-password") ||
        path.includes("/portal/customer/verify-email") ||
        path.includes("/portal/customer/logout");
      if (!cu.emailVerifiedAt && !path.includes("/portal/customer/verify-email") && !path.includes("/portal/customer/me") && !path.includes("/portal/customer/logout")) {
        throw new ForbiddenException("Email verification required");
      }
      if (cu.mustChangePassword && !allowed) throw new ForbiddenException("Password change required");
    }
    return true;
  }
}
