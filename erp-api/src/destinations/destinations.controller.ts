import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { DestinationsService } from "./destinations.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("destinations")
export class DestinationsController {
  constructor(private destinations: DestinationsService) {}

  @Get("showcase-settings")
  getShowcaseSettings() {
    return this.destinations.getShowcaseSettings();
  }

  @Put("showcase-settings")
  @Permissions("settings:manage")
  putShowcaseSettings(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.destinations.putShowcaseSettings(dto, u);
  }

  @Get()
  list(@Query() q: Record<string, string>) {
    return this.destinations.list(q);
  }

  @Post()
  @Permissions("settings:manage")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.destinations.create(dto, u);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.destinations.get(id);
  }

  @Patch(":id")
  @Permissions("settings:manage")
  update(@Param("id") id: string, @Body() dto: any) {
    return this.destinations.update(id, dto);
  }

  @Post(":id/publish")
  @Permissions("settings:manage")
  publish(@Param("id") id: string) {
    return this.destinations.publish(id);
  }

  @Post(":id/unpublish")
  @Permissions("settings:manage")
  unpublish(@Param("id") id: string) {
    return this.destinations.unpublish(id);
  }

  @Post(":id/archive")
  @Permissions("settings:manage")
  archive(@Param("id") id: string) {
    return this.destinations.archive(id);
  }

  @Delete(":id")
  @Permissions("settings:manage")
  remove(@Param("id") id: string) {
    return this.destinations.remove(id);
  }
}
