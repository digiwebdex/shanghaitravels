import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { CmsService } from "./cms.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("cms")
export class CmsController {
  constructor(private cms: CmsService) {}

  @Post("bootstrap")
  @Permissions("cms:manage")
  bootstrap(@CurrentUser() u: AuthedUser) {
    return this.cms.bootstrap(u);
  }

  @Get("pages")
  @Permissions("cms:read")
  pages(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.cms.listPages(q, u);
  }

  @Get("pages/:id")
  @Permissions("cms:read")
  getPage(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.cms.getPage(id, u);
  }

  @Post("pages")
  @Permissions("cms:manage")
  upsertPage(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.cms.upsertPage(dto, u);
  }

  @Post("pages/:id/submit-review")
  @Permissions("cms:manage")
  submitReview(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.cms.submitForReview(id, u);
  }

  @Post("pages/:id/publish")
  @Permissions("cms:publish")
  publish(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.cms.publishPage(id, u);
  }

  @Post("pages/:id/unpublish")
  @Permissions("cms:publish")
  unpublish(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.cms.unpublishPage(id, u);
  }

  @Delete("pages/:id")
  @Permissions("cms:manage")
  deletePage(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.cms.deletePage(id, u);
  }

  @Get("menus")
  @Permissions("cms:read")
  menus(@CurrentUser() u: AuthedUser) {
    return this.cms.listMenus(u);
  }

  @Post("menus")
  @Permissions("cms:manage")
  upsertMenu(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.cms.upsertMenu(dto, u);
  }

  @Get("media")
  @Permissions("cms:read")
  media(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.cms.listMedia(q, u);
  }

  @Post("media")
  @Permissions("cms:manage")
  createMedia(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.cms.createMedia(dto, u);
  }

  @Get("banners")
  @Permissions("cms:read")
  banners(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.cms.listBanners(q, u);
  }

  @Post("banners")
  @Permissions("cms:manage")
  createBanner(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.cms.createBanner(dto, u);
  }

  @Get("redirects")
  @Permissions("cms:read")
  redirects(@CurrentUser() u: AuthedUser) {
    return this.cms.listRedirects(u);
  }

  @Post("redirects")
  @Permissions("cms:manage")
  createRedirect(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.cms.createRedirect(dto, u);
  }

  @Get("content")
  @Permissions("cms:read")
  content(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.cms.listContent(q, u);
  }

  @Post("content")
  @Permissions("cms:manage")
  createContent(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.cms.createContent(dto, u);
  }

  @Post("content/:id/publish")
  @Permissions("cms:publish")
  publishContent(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.cms.publishContent(id, u);
  }

  @Post("content/:id/unpublish")
  @Permissions("cms:manage")
  unpublishContent(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.cms.unpublishContent(id, u);
  }

  @Post("content/:id")
  @Permissions("cms:manage")
  updateContent(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.cms.updateContent(id, dto, u);
  }

  @Get("travel")
  @Permissions("cms:read")
  travel(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.cms.listTravel(q, u);
  }

  @Post("travel")
  @Permissions("cms:manage")
  createTravel(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.cms.createTravel(dto, u);
  }

  @Get("forms")
  @Permissions("cms:read")
  forms(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.cms.listForms(q, u);
  }

  @Get("reports")
  @Permissions("cms:read")
  reports(@CurrentUser() u: AuthedUser) {
    return this.cms.reports(u);
  }
}
