import { Body, Controller, Post, Param } from "@nestjs/common";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";
import { CorporateAuthService } from "./corporate-auth.service";

/**
 * STAFF-facing invitation / reset. Returns a one-time temp password.
 */
@Controller("corporate-accounts")
export class CorporateAdminController {
  constructor(private auth: CorporateAuthService) {}

  @Post(":corporateClientId")
  @Permissions("corporate:manage")
  create(
    @Param("corporateClientId") corporateClientId: string,
    @Body() body: { email?: string; role?: string },
    @CurrentUser() u: AuthedUser,
  ) {
    return this.auth.createPortalAccount(corporateClientId, u.id, body?.email, body?.role);
  }
}
