import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException, createParamDecorator } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";

export interface AgentCtx {
  agentUserId: string;
  agentId: string;
  email: string;
  agentName: string;
  agentCode: string;
  branchId: string | null;
  mustChangePassword: boolean;
}
export const CurrentAgent = createParamDecorator(
  (_d, ctx: ExecutionContext): AgentCtx => ctx.switchToHttp().getRequest().agent,
);

/**
 * Authenticates AGENT portal accounts only. Uses JWT_AGENT_SECRET + the
 * `st_agent` cookie + an `aud:"agent"` claim — so a staff token (signed with
 * JWT_ACCESS_SECRET) can NEVER pass here, and an agent token can never pass the
 * staff guard. Applied explicitly on /portal/agent/* controllers (which are
 * marked @Public so the global staff guard skips them).
 */
@Injectable()
export class AgentJwtGuard implements CanActivate {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.st_agent;
    if (!token) throw new UnauthorizedException("Not authenticated");
    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: process.env.JWT_AGENT_SECRET });
    } catch {
      throw new UnauthorizedException("Session expired");
    }
    if (payload.aud !== "agent") throw new UnauthorizedException("Invalid token");

    const au = await this.prisma.agentUser.findFirst({
      where: { id: payload.sub, status: "active", deletedAt: null },
      include: { agent: true },
    });
    if (!au || au.agent.deletedAt || au.agent.status !== "active") throw new UnauthorizedException("Account disabled");
    // Bind session to DB agentId — never trust a client-supplied agent identity
    if (payload.agentId && payload.agentId !== au.agentId) {
      throw new UnauthorizedException("Invalid token");
    }

    req.agent = {
      agentUserId: au.id,
      agentId: au.agentId,
      email: au.email,
      agentName: au.agent.name,
      agentCode: au.agent.code,
      branchId: au.agent.branchId || null,
      mustChangePassword: au.mustChangePassword,
    } as AgentCtx;

    if (au.mustChangePassword) {
      const path = String(req.path || req.url || "");
      const allowed =
        path.includes("/portal/agent/me") ||
        path.includes("/portal/agent/change-password") ||
        path.includes("/portal/agent/logout");
      if (!allowed) throw new ForbiddenException("Password change required");
    }
    return true;
  }
}
