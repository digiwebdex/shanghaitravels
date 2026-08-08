import { Body, Controller, Get, Param, Post, Query, Headers, Res } from "@nestjs/common";
import type { Response } from "express";
import { CmsService } from "./cms.service";
import { Public } from "../rbac";

@Controller("site")
export class SiteController {
  constructor(private cms: CmsService) {}

  @Public()
  @Get("pages/:slug")
  page(
    @Param("slug") slug: string,
    @Headers("referer") referrer?: string,
    @Headers("user-agent") ua?: string,
  ) {
    return this.cms.publicPage(slug, { referrer, ua });
  }

  @Public()
  @Get("menus/:code")
  menu(@Param("code") code: string) {
    return this.cms.publicMenu(code);
  }

  @Public()
  @Get("banners")
  banners(@Query("placement") placement?: string) {
    return this.cms.publicBanners(placement);
  }

  @Public()
  @Get("content")
  content(@Query("type") type?: string) {
    return this.cms.publicContent(type);
  }

  @Public()
  @Get("travel")
  travel(@Query("serviceType") serviceType?: string) {
    return this.cms.publicTravel(serviceType);
  }

  @Public()
  @Get("search")
  search(@Query("q") q: string) {
    return this.cms.search(q);
  }

  @Public()
  @Post("forms")
  forms(@Body() dto: any, @Headers("x-forwarded-for") fwd?: string, @Headers("x-real-ip") realIp?: string) {
    const ip = (fwd || realIp || "unknown").split(",")[0].trim();
    return this.cms.submitForm(dto, ip);
  }

  @Public()
  @Get("sitemap.xml")
  async sitemap(@Res() res: Response) {
    const body = await this.cms.sitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(body);
  }

  @Public()
  @Get("robots.txt")
  robots(@Res() res: Response) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(this.cms.robotsTxt());
  }
}
