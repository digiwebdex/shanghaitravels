import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

// HR holds employee PII + salary (money, minor units). hr:read / hr:manage.
@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async listEmployees(q: any) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = { deletedAt: null };
    if (q.department) where.department = q.department;
    if (q.q) where.OR = ["fullName", "code", "designation", "phone"].map((f) => ({ [f]: { contains: q.q, mode: "insensitive" } }));
    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({ where, orderBy: { fullName: "asc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.employee.count({ where }),
    ]);
    return { data, total, page, limit };
  }
  async getEmployee(id: string) {
    const e = await this.prisma.employee.findFirst({ where: { id, deletedAt: null }, include: { salaries: { orderBy: { paidAt: "desc" }, take: 24 } } });
    if (!e) throw new NotFoundException("Employee not found");
    return e;
  }
  async createEmployee(dto: any, user: AuthedUser) {
    const code = `EMP-${String((await this.prisma.employee.count()) + 1).padStart(4, "0")}`;
    return this.prisma.employee.create({ data: { code, fullName: dto.fullName, designation: dto.designation, department: dto.department,
      phone: dto.phone, email: dto.email, joinDate: dto.joinDate ? new Date(dto.joinDate) : null,
      salary: Math.round(Number(dto.salary) || 0), notes: dto.notes, branchId: dto.branchId ?? user.branchId ?? null, createdBy: user.id } });
  }
  async updateEmployee(id: string, dto: any) {
    await this.getEmployee(id);
    const { fullName, designation, department, phone, email, status, notes } = dto;
    return this.prisma.employee.update({ where: { id }, data: { fullName, designation, department, phone, email, status, notes,
      salary: dto.salary != null ? Math.round(Number(dto.salary)) : undefined, joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined } });
  }
  async deleteEmployee(id: string) {
    await this.getEmployee(id);
    await this.prisma.employee.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  }

  /**
   * Payroll — record a monthly salary disbursement AND make it traceable in
   * Finance (owner requirement P18: "salary payment must be traceable in
   * Finance"). net = gross − deduction, both typed by the user; nothing is
   * computed and no tax rule is invented.
   *
   * When a receive/pay account is chosen, the net amount is posted to the
   * ledger EXACTLY the way createExpense posts an expense — same LedgerEntry
   * table, same denormalised balance update, inside one transaction. This is
   * the existing finance mechanism, NOT a second accounting engine. The
   * accountId stays optional so a pure record (no cash movement yet) is still
   * allowed, but then it is explicitly not posted.
   */
  async paySalary(employeeId: string, dto: any, user: AuthedUser) {
    const emp = await this.getEmployee(employeeId);
    const gross = Math.round(Number(dto.amount ?? dto.gross) || emp.salary);
    const deduction = Math.max(0, Math.round(Number(dto.deduction) || 0));
    const amount = gross - deduction; // net salary, minor units
    if (!(amount > 0)) throw new BadRequestException("net salary (gross − deduction) must be positive");
    if (deduction > gross) throw new BadRequestException("deduction cannot exceed gross salary");
    if (!dto.period) throw new BadRequestException("period required (e.g. 2026-07)");

    return this.prisma.$transaction(async (tx) => {
      const pay = await tx.salaryPayment.create({
        data: {
          employeeId, period: String(dto.period), amount, accountId: dto.accountId ?? null,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          note: [dto.note, deduction ? `deduction ${deduction}` : ""].filter(Boolean).join(" · ") || undefined,
          recordedBy: user.id,
        },
      });
      if (dto.accountId) {
        const acc = await tx.account.findFirst({ where: { id: dto.accountId, deletedAt: null } });
        if (!acc) throw new NotFoundException("Account not found");
        // Same posting as createExpense: salary leaves the account (−amount).
        await tx.ledgerEntry.create({
          data: { accountId: dto.accountId, amount: -amount, sourceType: "salary", sourceId: pay.id,
            memo: `Salary ${dto.period} — ${emp.fullName} (${emp.code})`, createdBy: user.id },
        });
        await tx.account.update({ where: { id: dto.accountId }, data: { currentBalance: acc.currentBalance - amount } });
      }
      return pay;
    });
  }
  listSalaries(q: any) {
    const where: any = {};
    if (q.employeeId) where.employeeId = q.employeeId;
    if (q.period) where.period = q.period;
    return this.prisma.salaryPayment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      take: Math.min(500, Math.max(1, Number(q.take) || 200)),
      include: { employee: { select: { code: true, fullName: true, designation: true, department: true } } },
    });
  }
}
