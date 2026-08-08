import { Controller, Get, Post, Param, Body, UploadedFile, UseInterceptors, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { randomUUID } from "crypto";
import { Permissions, CurrentUser, AuthedUser } from "./rbac";
import { PrismaService } from "./prisma.service";
import { StorageService } from "./storage/storage";

interface Upload { buffer: Buffer; mimetype: string; originalname: string; size: number }
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX = 15 * 1024 * 1024;
const HQ_ROLES = new Set(["super_admin", "general_manager"]);

// Per-case document collection: staff upload the visa checklist documents.
@Controller("applications/:id/documents")
export class AppDocumentsController {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  private async scopedApp(appId: string, user: AuthedUser) {
    const where: any = { id: appId, deletedAt: null };
    if (!HQ_ROLES.has(user.role)) where.branchId = user.branchId ?? "__none__";
    const app = await this.prisma.application.findFirst({
      where,
      select: { id: true, branchId: true },
    });
    if (!app) throw new NotFoundException("Case not found");
    return app;
  }

  @Get() @Permissions("document:read")
  async list(@Param("id") appId: string, @CurrentUser() u: AuthedUser) {
    await this.scopedApp(appId, u);
    const docs = await this.prisma.document.findMany({
      where: { ownerType: "application", ownerId: appId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, category: true, fileName: true, status: true, isPassport: true, sizeBytes: true, createdAt: true },
    });
    return docs;
  }

  @Post() @Permissions("document:upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX } }))
  async upload(@Param("id") appId: string, @UploadedFile() file: Upload, @Body() body: any, @CurrentUser() u: AuthedUser) {
    if (!file) throw new BadRequestException("file is required (multipart field 'file')");
    if (!ALLOWED.has(file.mimetype)) throw new BadRequestException("Only JPG/PNG/WEBP/PDF allowed");
    const app = await this.scopedApp(appId, u);
    if (!HQ_ROLES.has(u.role) && app.branchId && u.branchId && app.branchId !== u.branchId) {
      throw new ForbiddenException("Cross-branch document upload denied");
    }
    const category = String(body?.category || "other").trim().slice(0, 40) || "other";
    const id = randomUUID();
    const ext = (file.mimetype.split("/")[1] || "bin").replace("jpeg", "jpg");
    const storageKey = `docs/${appId}/${id}.${ext}`;
    await this.storage.put(storageKey, file.buffer);
    const doc = await this.prisma.document.create({
      data: {
        branchId: app.branchId, ownerType: "application", ownerId: appId, category,
        isPassport: category === "passport", fileName: file.originalname || `${id}.${ext}`,
        storageKey, mimeType: file.mimetype, sizeBytes: file.size, uploadedBy: u.id, status: "pending",
      },
    });
    await this.prisma.applicationDocument.create({ data: { applicationId: appId, documentId: doc.id, docType: category, status: "pending" } });
    return { id: doc.id, category, fileName: doc.fileName, status: doc.status };
  }
}
