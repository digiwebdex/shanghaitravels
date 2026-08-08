import { Module } from "@nestjs/common";
import { WorkflowService } from "./workflow.service";
import { WorkflowController } from "./workflow.controller";

@Module({
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService], // ApplicationsService uses instantiateStages()
})
export class WorkflowModule {}
