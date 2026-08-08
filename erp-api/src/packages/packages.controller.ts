import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { PackagesService } from "./packages.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("packages")
export class PackagesController {
  constructor(private packages: PackagesService) {}

  @Get("categories")
  listCategories(@Query("active") active?: string) {
    return this.packages.listCategories(active === "true");
  }

  @Post("categories")
  @Permissions("settings:manage")
  createCategory(@Body() dto: any) {
    return this.packages.createCategory(dto);
  }

  @Patch("categories/:id")
  @Permissions("settings:manage")
  updateCategory(@Param("id") id: string, @Body() dto: any) {
    return this.packages.updateCategory(id, dto);
  }

  @Delete("categories/:id")
  @Permissions("settings:manage")
  deleteCategory(@Param("id") id: string) {
    return this.packages.deleteCategory(id);
  }

  @Get("reports/summary")
  reportsSummary() {
    return this.packages.reportsSummary();
  }

  @Get("export.csv")
  async exportCsv(@Res() res: Response) {
    const csv = await this.packages.exportCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="packages.csv"');
    res.send(csv);
  }

  @Post("import.csv")
  @Permissions("settings:manage")
  importCsv(@Body() body: any, @CurrentUser() u: AuthedUser) {
    return this.packages.importCsv(body, u);
  }

  @Get()
  list(@Query() q: Record<string, string>) {
    return this.packages.listPackages(q);
  }

  @Post()
  @Permissions("settings:manage")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.packages.createPackage(dto, u);
  }

  @Get(":id/gallery")
  listGallery(@Param("id") id: string) {
    return this.packages.listGallery(id);
  }

  @Post(":id/gallery")
  @Permissions("settings:manage")
  addGallery(@Param("id") id: string, @Body() dto: any) {
    return this.packages.addGalleryItem(id, dto);
  }

  @Delete(":id/gallery/:itemId")
  @Permissions("settings:manage")
  deleteGallery(@Param("id") id: string, @Param("itemId") itemId: string) {
    return this.packages.deleteGalleryItem(id, itemId);
  }

  @Get(":id/availability")
  listAvailability(@Param("id") id: string) {
    return this.packages.listAvailability(id);
  }

  @Post(":id/availability")
  @Permissions("settings:manage")
  addAvailability(@Param("id") id: string, @Body() dto: any) {
    return this.packages.addAvailability(id, dto);
  }

  @Patch(":id/availability/:slotId")
  @Permissions("settings:manage")
  patchAvailability(
    @Param("id") id: string,
    @Param("slotId") slotId: string,
    @Body() dto: any,
  ) {
    return this.packages.updateAvailability(id, slotId, dto);
  }

  @Delete(":id/availability/:slotId")
  @Permissions("settings:manage")
  deleteAvailability(@Param("id") id: string, @Param("slotId") slotId: string) {
    return this.packages.deleteAvailability(id, slotId);
  }

  @Get(":id/faqs")
  listFaqs(@Param("id") id: string) {
    return this.packages.listFaqs(id);
  }

  @Post(":id/faqs")
  @Permissions("settings:manage")
  addFaq(@Param("id") id: string, @Body() dto: any) {
    return this.packages.addFaq(id, dto);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.packages.getPackage(id);
  }

  @Patch(":id")
  @Permissions("settings:manage")
  update(@Param("id") id: string, @Body() dto: any) {
    return this.packages.updatePackage(id, dto);
  }

  @Post(":id/publish")
  @Permissions("settings:manage")
  publish(@Param("id") id: string) {
    return this.packages.publishPackage(id);
  }

  @Post(":id/unpublish")
  @Permissions("settings:manage")
  unpublish(@Param("id") id: string) {
    return this.packages.unpublishPackage(id);
  }

  @Post(":id/archive")
  @Permissions("settings:manage")
  archive(@Param("id") id: string) {
    return this.packages.archivePackage(id);
  }

  @Post(":id/clone")
  @Permissions("settings:manage")
  clone(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.packages.clonePackage(id, u);
  }

  @Post(":id/schedule")
  @Permissions("settings:manage")
  schedule(@Param("id") id: string, @Body() dto: any) {
    return this.packages.schedulePackage(id, dto);
  }

  @Delete(":id")
  @Permissions("settings:manage")
  remove(@Param("id") id: string) {
    return this.packages.deletePackage(id);
  }
}
