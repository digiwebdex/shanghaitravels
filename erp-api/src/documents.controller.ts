import { Controller, Get } from "@nestjs/common";
import { Permissions } from "./rbac";

@Controller("documents")
export class DocumentsController {
  // Passport / identity documents — marketing_manager must be denied here specifically.
  @Get("passports") @Permissions("document:read-passport")
  passports() {
    return { items: [{ id: "demo", category: "passport", note: "sensitive identity document — restricted" }] };
  }
}
