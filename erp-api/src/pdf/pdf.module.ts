import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { PdfService } from "./pdf.service";
import { PdfController } from "./pdf.controller";

@Module({
  imports: [PrismaModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
