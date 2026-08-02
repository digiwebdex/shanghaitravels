import { Module } from "@nestjs/common";
import { StorageService, LocalStorageService } from "../storage/storage";
import { OcrProvider } from "./gemini.provider";
import { VisionOcrProvider } from "./vision.provider";
import { OcrService } from "./ocr.service";
import { OcrController } from "./ocr.controller";
import { OcrPublicController } from "./ocr.public.controller";

// OCR provider = Google Vision (pure OCR; per Google Cloud terms, submitted
// content is NOT used to train models). Passport fields come from the ICAO MRZ
// (check-digit validated), not from a model guess. OCR itself is MEMORY-ONLY:
// the image is never written to storage (see OcrService.scan). StorageService is
// retained only for the (now dormant) process/apply paths and other modules.
@Module({
  controllers: [OcrController, OcrPublicController],
  providers: [
    OcrService,
    { provide: OcrProvider, useClass: VisionOcrProvider },
    { provide: StorageService, useClass: LocalStorageService },
  ],
  exports: [OcrService], // used by the agent portal's OCR route
})
export class OcrModule {}
