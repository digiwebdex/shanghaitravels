import { Controller, Get, Post, Param, Body, Res, UploadedFile, UseInterceptors, BadRequestException, NotFoundException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";
import { PrismaService } from "../prisma.service";
import { StorageService } from "../storage/storage";

interface Upload { buffer: Buffer; mimetype: string; originalname: string; size: number }
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX = 15 * 1024 * 1024;

/**
 * Agent onboarding document collection. Reuses the generic Document model +
 * StorageService (same as AppDocumentsController) but with ownerType "agent".
 * No Document schema change: branchId is resolved via fallback
 * (agent.branchId → user.branchId → first branch). Uploads surface in Document
 * Intelligence by the frontend also calling POST /ocr/scan per file (the
 * existing CaseDocumentsCard two-call pattern).
 */
@Controller("agents/:id/documents")
export class AgentDocumentsController {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  private async requireAgent(agentId: string) {
    const a = await this.prisma.agent.findFirst({ where: { id: agentId, deletedAt: null }, select: { id: true, branchId: true } });
    if (!a) throw new NotFoundException("Agent not found");
    return a;
  }

  /**
   * Circular-avatar source for the agent list. Streams the latest "Agent Photo"
   * document (reuses the Document store + StorageService). Cookie-authenticated
   * like the PDF <a href> links; 404 when no photo so the UI falls back to initials.
   */
  @Get("avatar") @Permissions("commission:read")
  async avatar(@Param("id") agentId: string, @Res() res: Response) {
    const doc = await this.prisma.document.findFirst({
      where: { ownerType: "agent", ownerId: agentId, deletedAt: null, category: { contains: "photo", mode: "insensitive" }, mimeType: { startsWith: "image/" } },
      orderBy: { createdAt: "desc" },
      select: { storageKey: true, mimeType: true },
    });
    if (!doc) throw new NotFoundException("No agent photo");
    const buf = await this.storage.get(doc.storageKey).catch(() => null);
    if (!buf) throw new NotFoundException("No agent photo");
    res.setHeader("Content-Type", doc.mimeType || "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(buf);
  }

  @Get() @Permissions("document:read")
  async list(@Param("id") agentId: string) {
    await this.requireAgent(agentId);
    return this.prisma.document.findMany({
      where: { ownerType: "agent", ownerId: agentId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, category: true, fileName: true, status: true, sizeBytes: true, mimeType: true, createdAt: true },
    });
  }

  @Post() @Permissions("document:upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX } }))
  async upload(@Param("id") agentId: string, @UploadedFile() file: Upload, @Body() body: any, @CurrentUser() u: AuthedUser) {
    if (!file) throw new BadRequestException("file is required (multipart field 'file')");
    if (!ALLOWED.has(file.mimetype)) throw new BadRequestException("Only JPG/PNG/WEBP/PDF allowed");
    const agent = await this.requireAgent(agentId);
    // Document.branchId is required — resolve a non-null branch without altering
    // the shared Document model.
    let branchId = agent.branchId ?? u.branchId ?? null;
    if (!branchId) {
      const b = await this.prisma.branch.findFirst({ select: { id: true } });
      branchId = b?.id ?? null;
    }
    if (!branchId) throw new BadRequestException("No branch configured");
    const category = String(body?.category || "other").trim().slice(0, 40) || "other";
    const id = randomUUID();
    const ext = (file.mimetype.split("/")[1] || "bin").replace("jpeg", "jpg");
    const storageKey = `docs/agent/${agentId}/${id}.${ext}`;
    await this.storage.put(storageKey, file.buffer);
    const doc = await this.prisma.document.create({
      data: {
        branchId, ownerType: "agent", ownerId: agentId, category,
        fileName: file.originalname || `${id}.${ext}`,
        storageKey, mimeType: file.mimetype, sizeBytes: file.size, uploadedBy: u.id, status: "pending",
      },
    });
    return { id: doc.id, category, fileName: doc.fileName, status: doc.status };
  }
}
