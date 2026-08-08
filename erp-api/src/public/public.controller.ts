import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { PublicService } from "./public.service";
import { Public } from "../rbac";

// UNAUTHENTICATED — the only public endpoint. @Public bypasses the JWT guard.
// Rate-limited + validated in the service. Mounted under /api/public/*.
@Controller("public")
export class PublicController {
  constructor(private pub: PublicService) {}

  // Site scope (destinations/services to display) — owner edits via Settings.
  @Public()
  @Get("config")
  config() { return this.pub.getPublicConfig(); }

  // Full country reference list for the site's destination selectors (featured first).
  @Public()
  @Get("countries")
  countries() { return this.pub.countries(); }

  // Document QR verification (invoice / receipt). Customer-safe fields only.
  @Public()
  @Get("verify")
  verify(@Query("no") no: string) { return this.pub.verifyDocument(no); }

  // Public booking tracking by reference number. Customer-safe status + stages.
  @Public()
  @Get("track")
  track(@Query("ref") ref: string) { return this.pub.trackBooking(ref); }

  @Public()
  @Post("intake")
  intake(@Body() dto: any, @Req() req: any) {
    const ip = (req.headers["cf-connecting-ip"] as string) || (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    return this.pub.intake(dto, ip);
  }
}
