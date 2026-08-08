import { Controller, Post, Body, BadRequestException, NotFoundException } from "@nestjs/common";
import { Permissions, CurrentUser, AuthedUser } from "./rbac";
import { PrismaService } from "./prisma.service";

const HQ_ROLES = new Set(["super_admin", "general_manager"]);

/**
 * Manual passport entry — NO OCR, nothing sent to Google. For staff to type
 * passport details while the Gemini OCR path is gated off. Gated by `ocr:apply`,
 * the same "write passport data to a record" permission visa staff already hold.
 */
@Controller("passports")
export class PassportsController {
  constructor(private prisma: PrismaService) {}

  @Post() @Permissions("ocr:apply")
  async create(@Body() b: any, @CurrentUser() u: AuthedUser) {
    if (!b?.customerId) throw new BadRequestException("customerId required");
    if (!b?.passportNo) throw new BadRequestException("passportNo required");
    const where: any = { id: String(b.customerId), deletedAt: null };
    if (!HQ_ROLES.has(u.role)) where.branchId = u.branchId ?? "__none__";
    const customer = await this.prisma.customer.findFirst({ where, select: { id: true } });
    if (!customer) throw new NotFoundException("Customer not found");
    return this.prisma.passport.create({
      data: {
        customerId: customer.id,
        passportNo: String(b.passportNo).trim(),
        issuingCountry: b.issuingCountry ? String(b.issuingCountry).trim() : undefined,
        expiryDate: b.dateOfExpiry ? new Date(b.dateOfExpiry) : undefined,
        issueDate: b.dateOfIssue ? new Date(b.dateOfIssue) : undefined,
        isPrimary: !!b.isPrimary,
      },
    });
  }
}
