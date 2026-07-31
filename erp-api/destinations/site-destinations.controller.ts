import { Controller, Get, Param, Query } from "@nestjs/common";
import { Public } from "../rbac";
import { DestinationsService } from "./destinations.service";

@Public()
@Controller("site/destinations")
export class SiteDestinationsController {
  constructor(private destinations: DestinationsService) {}

  @Get("settings")
  settings() {
    return this.destinations.siteSettings();
  }

  @Get("browse")
  browse(@Query() q: Record<string, string>) {
    return this.destinations.siteBrowse(q);
  }

  @Get()
  list(@Query() q: Record<string, string>) {
    return this.destinations.siteList(q);
  }

  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.destinations.siteDetailBySlug(slug);
  }
}
