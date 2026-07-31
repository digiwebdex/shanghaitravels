import { Module } from "@nestjs/common";
import { DestinationsService } from "./destinations.service";
import { DestinationsController } from "./destinations.controller";
import { SiteDestinationsController } from "./site-destinations.controller";

@Module({
  controllers: [DestinationsController, SiteDestinationsController],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
