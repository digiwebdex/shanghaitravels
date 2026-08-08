import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("tasks")
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get() @Permissions("task:read")
  list(@CurrentUser() u: AuthedUser, @Query() q: any) { return this.tasks.list(u, q); }

  @Get(":id") @Permissions("task:read")
  get(@Param("id") id: string) { return this.tasks.get(id); }

  @Post() @Permissions("task:manage")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.tasks.create(dto, u); }

  @Patch(":id") @Permissions("task:manage")
  update(@Param("id") id: string, @Body() dto: any) { return this.tasks.update(id, dto); }

  @Delete(":id") @Permissions("task:manage") // soft-delete only
  remove(@Param("id") id: string) { return this.tasks.softDelete(id); }
}
