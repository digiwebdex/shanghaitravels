import { Body, Controller, Param, Post } from "@nestjs/common";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";
import { CustomerAuthService } from "./customer-auth.service";

/** Staff invite/reset of customer portal login. */
@Controller("customer-accounts")
export class CustomerAdminController {
  constructor(private auth: CustomerAuthService) {}

  @Post(":customerId")
  @Permissions("customer:update")
  invite(
    @Param("customerId") customerId: string,
    @Body() b: { email?: string },
    @CurrentUser() u: AuthedUser,
  ) {
    return this.auth.createPortalAccount(customerId, u.id, b?.email);
  }
}
