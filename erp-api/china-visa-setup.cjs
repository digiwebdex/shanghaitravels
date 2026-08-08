// Orients the visa module around CHINA visa (CVASC, Dhaka). Creates a new
// versioned visa workflow template "China Visa (CVASC)" and activates it
// (deactivating the previous active visa template, honouring the one-active
// partial unique index). Adds an editable China-visa document checklist to
// Settings. Idempotent. Config only — no fabricated customer data.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Real Bangladesh→China visa flow via the Chinese Visa Application Service Centre.
const STAGES = [
  "Enquiry & Eligibility",
  "Document Collection",
  "COVA Online Form",
  "CVASC Appointment",
  "Submission & Biometrics",
  "Embassy Processing",
  "Passport Collection & Delivery",
];

// Starter checklist for a China tourist (L) visa. STAFF-EDITABLE from Settings —
// the owner must verify against current CVASC requirements before relying on it.
const CHECKLIST = {
  _note: "Editable per-type starter — verify against current CVASC/Embassy requirements before use.",
  common: [
    "Passport (original, 6+ months validity, 2+ blank pages)",
    "Passport bio-page photocopy",
    "1 recent photo 48x33mm, white background",
    "Completed & signed COVA online application form",
    "National ID / birth certificate",
  ],
  types: {
    "L (Tourist)": ["Confirmed round-trip flight itinerary", "Hotel booking or invitation letter", "Bank statement (last 6 months)"],
    "M (Business)": ["Invitation letter from Chinese company/partner", "Applicant trade licence / employer letter", "Bank statement"],
    "Z (Work)": ["Foreigner's Work Permit Notification", "Invitation/employment letter from Chinese employer", "Medical / other embassy-required docs"],
    "X1/X2 (Student)": ["Admission notice (JW201/JW202 form)", "Enrollment / offer letter from Chinese institution", "Financial proof"],
    "Q1/Q2 (Family — Chinese relative)": ["Invitation from Chinese relative", "Proof of kinship", "Relative ID / residence proof"],
    "S1/S2 (Family — foreigner in China)": ["Invitation from family member in China", "Proof of relationship", "Their residence permit copy"],
    "G (Transit)": ["Onward flight ticket", "Visa for the onward destination country"],
  },
};

async function main() {
  const existing = await prisma.workflowTemplate.findFirst({ where: { serviceType: "visa", name: "China Visa (CVASC)", deletedAt: null } });
  if (!existing) {
    const version = (await prisma.workflowTemplate.count({ where: { serviceType: "visa" } })) + 1;
    await prisma.$transaction(async (tx) => {
      await tx.workflowTemplate.updateMany({ where: { serviceType: "visa", isActive: true }, data: { isActive: false } });
      const t = await tx.workflowTemplate.create({
        data: { serviceType: "visa", name: "China Visa (CVASC)", version, isActive: true,
          stages: { create: STAGES.map((name, i) => ({ stageNo: i + 1, name })) } },
      });
      console.log("Created + activated China visa template:", t.id, `(v${version}, ${STAGES.length} stages)`);
    });
  } else {
    console.log("China visa template already exists:", existing.id);
  }
  await prisma.setting.upsert({
    where: { key: "china_visa_checklist" },
    create: { key: "china_visa_checklist", value: CHECKLIST, updatedBy: "setup" },
    update: { value: CHECKLIST },
  });
  console.log("Set china_visa_checklist");
  const active = await prisma.workflowTemplate.findFirst({ where: { serviceType: "visa", isActive: true, deletedAt: null }, include: { stages: { orderBy: { stageNo: "asc" } } } });
  console.log("Active visa workflow:", active.name, "→", active.stages.map((s) => s.name).join(" → "));
}
main().finally(() => prisma.$disconnect());
