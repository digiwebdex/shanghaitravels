import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

type StageDef = { name: string; sla?: number };
/**
 * V6 Wave 1 — production-ready default workflows so NO supported service installs
 * with an empty workflow. Seeded on boot (idempotent: only when a service has no
 * template yet). Admins can edit/replace via Settings afterwards. SLA in hours.
 */
const DEFAULT_WORKFLOWS: Record<string, { name: string; stages: StageDef[] }> = {
  visa: { name: "Visa processing", stages: [
    { name: "Created", sla: 4 }, { name: "Documents", sla: 48 }, { name: "OCR", sla: 12 },
    { name: "Review", sla: 24 }, { name: "Embassy Submission", sla: 48 }, { name: "Interview", sla: 72 },
    { name: "Approved", sla: 168 }, { name: "Stamped", sla: 48 }, { name: "Collected", sla: 24 },
    { name: "Delivered", sla: 24 }, { name: "Completed" } ] },
  air_ticket: { name: "Air ticketing", stages: [
    { name: "Created", sla: 4 }, { name: "Documents", sla: 24 }, { name: "Fare Search", sla: 12 },
    { name: "Fare Confirmed", sla: 12 }, { name: "Payment Pending", sla: 24 }, { name: "Ticket Issued", sla: 12 },
    { name: "PNR Confirmed", sla: 12 }, { name: "Delivered", sla: 12 }, { name: "Travel Started" },
    { name: "Travel Completed" }, { name: "Closed" } ] },
  hotel: { name: "Hotel booking", stages: [
    { name: "Created", sla: 4 }, { name: "Documents", sla: 24 }, { name: "Hotel Search", sla: 24 },
    { name: "Room Reserved", sla: 24 }, { name: "Payment Pending", sla: 24 }, { name: "Booking Confirmed", sla: 12 },
    { name: "Voucher Issued", sla: 12 }, { name: "Guest Checked In" }, { name: "Guest Checked Out" },
    { name: "Completed" }, { name: "Closed" } ] },
  tour: { name: "Tour package", stages: [
    { name: "Created", sla: 4 }, { name: "Documents", sla: 24 }, { name: "Itinerary Planning", sla: 48 },
    { name: "Quote Confirmed", sla: 24 }, { name: "Payment Pending", sla: 24 }, { name: "Booking Confirmed", sla: 12 },
    { name: "Pre-departure Briefing", sla: 24 }, { name: "Travel Started" }, { name: "Travel Completed" },
    { name: "Feedback", sla: 48 }, { name: "Closed" } ] },
  transport: { name: "Transport", stages: [
    { name: "Created", sla: 4 }, { name: "Documents", sla: 24 }, { name: "Vehicle Assigned", sla: 24 },
    { name: "Driver Assigned", sla: 12 }, { name: "Payment Pending", sla: 24 }, { name: "Booking Confirmed", sla: 12 },
    { name: "Pickup Ready", sla: 12 }, { name: "Passenger Picked Up" }, { name: "Trip Completed" },
    { name: "Delivered", sla: 12 }, { name: "Closed" } ] },
  hajj: { name: "Hajj", stages: [
    { name: "Created", sla: 4 }, { name: "Documents", sla: 72 }, { name: "Package Selected", sla: 48 },
    { name: "Payment Pending", sla: 72 }, { name: "Visa Processing", sla: 240 }, { name: "Ticketing & Hotel", sla: 120 },
    { name: "Pre-departure Orientation", sla: 48 }, { name: "Departed" }, { name: "On-ground Servicing" },
    { name: "Returned", sla: 48 }, { name: "Closed" } ] },
  umrah: { name: "Umrah", stages: [
    { name: "Created", sla: 4 }, { name: "Documents", sla: 72 }, { name: "Package Selected", sla: 48 },
    { name: "Payment Pending", sla: 72 }, { name: "Visa Processing", sla: 168 }, { name: "Ticketing & Hotel", sla: 120 },
    { name: "Pre-departure Orientation", sla: 48 }, { name: "Departed" }, { name: "On-ground Servicing" },
    { name: "Returned", sla: 48 }, { name: "Closed" } ] },
  student: { name: "Student / study abroad", stages: [
    { name: "Created", sla: 4 }, { name: "Documents", sla: 72 }, { name: "Counseling", sla: 48 },
    { name: "University Selection", sla: 72 }, { name: "Application Submitted", sla: 120 }, { name: "Offer Received", sla: 240 },
    { name: "Payment Pending", sla: 72 }, { name: "Visa Processing", sla: 240 }, { name: "Pre-departure", sla: 48 },
    { name: "Enrolled" }, { name: "Closed" } ] },
  work: { name: "Manpower / overseas employment", stages: [
    { name: "Created", sla: 4 }, { name: "Documents", sla: 72 }, { name: "Employer Verification", sla: 120 },
    { name: "Medical & Training", sla: 168 }, { name: "Payment Pending", sla: 72 }, { name: "Visa / Work Permit", sla: 240 },
    { name: "BMET Clearance", sla: 120 }, { name: "Ticketing", sla: 72 }, { name: "Deployed" },
    { name: "Post-deployment", sla: 120 }, { name: "Closed" } ] },
  medical: { name: "Medical travel", stages: [
    { name: "Enquiry & Medical Documents", sla: 48 }, { name: "Hospital Coordination & Quote", sla: 72 },
    { name: "Medical Visa Processing", sla: 168 }, { name: "Travel Arrangements", sla: 48 },
    { name: "Treatment Coordination" }, { name: "Closure" } ] },
  immigration: { name: "Immigration", stages: [
    { name: "Assessment & Eligibility", sla: 72 }, { name: "Documentation", sla: 120 },
    { name: "Application Submission", sla: 72 }, { name: "Processing", sla: 720 },
    { name: "Decision & Landing", sla: 72 }, { name: "Closure" } ] },
  insurance: { name: "Travel insurance", stages: [
    { name: "Requirement Capture", sla: 12 }, { name: "Plan Selection & Quote", sla: 24 },
    { name: "Policy Issuance", sla: 24 }, { name: "Delivery & Closure", sla: 12 } ] },
  corporate: { name: "Corporate request", stages: [
    { name: "Request Intake", sla: 12 }, { name: "Approval Verification", sla: 24 },
    { name: "Booking & Fulfilment", sla: 48 }, { name: "Invoicing", sla: 24 }, { name: "Closure", sla: 12 } ] },
};

/**
 * Workflow templates are editable from Settings (no code deploy). A new case
 * COPIES the active template's stages into ApplicationStage rows at creation
 * (see instantiateStages) — editing a template afterwards affects future cases
 * only; in-flight cases keep the stages they were created with.
 */
@Injectable()
export class WorkflowService implements OnModuleInit {
  private readonly log = new Logger("WorkflowService");
  constructor(private prisma: PrismaService) {}

  /** Install default workflows on boot so no service is ever empty. Idempotent. */
  async onModuleInit() {
    try {
      const r = await this.seedDefaults();
      if (r.created > 0) this.log.log(`Seeded ${r.created} default workflow template(s): ${r.serviceTypes.join(", ")}`);
    } catch (e) {
      this.log.warn(`Default workflow seeding skipped: ${e instanceof Error ? e.message : e}`);
    }
  }

  /**
   * Create an active default template for every service type that has none yet.
   * Never overrides an admin-configured template (skips services that already
   * have any non-deleted template).
   */
  async seedDefaults() {
    const serviceTypes: string[] = [];
    for (const [serviceType, def] of Object.entries(DEFAULT_WORKFLOWS)) {
      const existing = await this.prisma.workflowTemplate.findFirst({ where: { serviceType: serviceType as any, deletedAt: null } });
      if (existing) continue;
      // version must be unique per serviceType even across soft-deleted rows
      // (@@unique([serviceType, version])) — mirror create()'s next-version logic.
      const version = (await this.prisma.workflowTemplate.count({ where: { serviceType: serviceType as any } })) + 1;
      await this.prisma.workflowTemplate.create({
        data: {
          serviceType: serviceType as any, name: def.name, version, isActive: true, createdBy: "system",
          stages: { create: def.stages.map((s, i) => ({ stageNo: i + 1, name: s.name, slaHours: s.sla ?? null })) },
        },
      });
      serviceTypes.push(serviceType);
    }
    return { created: serviceTypes.length, serviceTypes };
  }

  list(serviceType?: string) {
    return this.prisma.workflowTemplate.findMany({
      where: { deletedAt: null, ...(serviceType ? { serviceType: serviceType as any } : {}) },
      include: { stages: { orderBy: { stageNo: "asc" } } },
      orderBy: [{ serviceType: "asc" }, { version: "desc" }],
    });
  }

  async get(id: string) {
    const t = await this.prisma.workflowTemplate.findFirst({
      where: { id, deletedAt: null },
      include: { stages: { orderBy: { stageNo: "asc" } } },
    });
    if (!t) throw new NotFoundException("Workflow template not found");
    return t;
  }

  /** Create a new template. Stages: [{name, slaHours?}] in display order. */
  async create(dto: any, user: AuthedUser) {
    if (!dto.serviceType || !Array.isArray(dto.stages) || dto.stages.length === 0)
      throw new BadRequestException("serviceType and at least one stage are required");
    const version = (await this.prisma.workflowTemplate.count({ where: { serviceType: dto.serviceType } })) + 1;
    return this.prisma.workflowTemplate.create({
      data: {
        serviceType: dto.serviceType, name: dto.name ?? `${dto.serviceType} workflow v${version}`,
        version, isActive: dto.isActive ?? false, createdBy: user.id,
        stages: { create: dto.stages.map((s: any, i: number) => ({ stageNo: i + 1, name: s.name, slaHours: s.slaHours ?? null })) },
      },
      include: { stages: { orderBy: { stageNo: "asc" } } },
    });
  }

  /** Replace stage list / rename. Does not touch cases already created. */
  async update(id: string, dto: any) {
    await this.get(id);
    if (Array.isArray(dto.stages)) {
      await this.prisma.workflowTemplateStage.deleteMany({ where: { templateId: id } });
      await this.prisma.workflowTemplateStage.createMany({
        data: dto.stages.map((s: any, i: number) => ({ templateId: id, stageNo: i + 1, name: s.name, slaHours: s.slaHours ?? null })),
      });
    }
    return this.prisma.workflowTemplate.update({
      where: { id }, data: { name: dto.name, isActive: dto.isActive },
      include: { stages: { orderBy: { stageNo: "asc" } } },
    });
  }

  /** Make this the single active template for its serviceType (partial unique index enforces one). */
  async activate(id: string) {
    const t = await this.get(id);
    await this.prisma.$transaction([
      this.prisma.workflowTemplate.updateMany({ where: { serviceType: t.serviceType, isActive: true }, data: { isActive: false } }),
      this.prisma.workflowTemplate.update({ where: { id }, data: { isActive: true } }),
    ]);
    return this.get(id);
  }

  async softDelete(id: string) {
    const t = await this.get(id);
    if (t.isActive) throw new BadRequestException("Deactivate before deleting the active template");
    await this.prisma.workflowTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  }

  /**
   * Copy the active template's stages onto a freshly created case. Returns the
   * stage count so the caller can set Application.totalStages. Idempotent-ish:
   * only runs when the case has no stages yet.
   */
  async instantiateStages(applicationId: string, serviceType: string) {
    const existing = await this.prisma.applicationStage.count({ where: { applicationId } });
    if (existing > 0) return existing;
    const tpl = await this.prisma.workflowTemplate.findFirst({
      where: { serviceType: serviceType as any, isActive: true, deletedAt: null },
      include: { stages: { orderBy: { stageNo: "asc" } } },
    });
    if (!tpl || tpl.stages.length === 0) return 0; // no template yet → case has no preset stages
    await this.prisma.applicationStage.createMany({
      data: tpl.stages.map((s) => ({
        applicationId, stageNo: s.stageNo, name: s.name,
        status: s.stageNo === 1 ? "active" : "pending",
        startedAt: s.stageNo === 1 ? new Date() : null,
      })),
    });
    return tpl.stages.length;
  }
}
