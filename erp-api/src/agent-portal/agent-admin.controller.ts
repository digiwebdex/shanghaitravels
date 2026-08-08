import { Body, Controller, Post, Param } from "@nestjs/common";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";
import { AgentAuthService } from "./agent-auth.service";

/**
 * STAFF-facing invitation / reset. Returns a one-time temp password.
 * Optional branchId assigns the agent's operating branch (multi-branch).
 */
@Controller("agent-accounts")
export class AgentAdminController {
  constructor(private auth: AgentAuthService) {}

  @Post(":agentId")
  @Permissions("agent:manage")
  create(
    @Param("agentId") agentId: string,
    @Body() body: { email?: string; branchId?: string },
    @CurrentUser() u: AuthedUser,
  ) {
    return this.auth.createPortalAccount(agentId, u.id, body?.email, body?.branchId);
  }
}
