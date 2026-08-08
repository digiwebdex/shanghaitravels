// Adds the 3 OCR permissions and grants them to roles (idempotent).
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const perms = [
    ["ocr:use", "Upload a document for OCR extraction"],
    ["ocr:apply", "Confirm OCR-extracted data and write it to a record"],
    ["ocr:read-raw", "View raw OCR text / stored passport image (sensitive)"],
  ];
  for (const [key, description] of perms)
    await p.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
  const byKey = Object.fromEntries((await p.permission.findMany()).map((x) => [x.key, x.id]));
  const grants = {
    super_admin: ["ocr:use", "ocr:apply", "ocr:read-raw"],
    general_manager: ["ocr:use", "ocr:apply", "ocr:read-raw"],
    office_incharge: ["ocr:use", "ocr:apply", "ocr:read-raw"],
    accounts_manager: ["ocr:use"],
    visa_consultant: ["ocr:use", "ocr:apply", "ocr:read-raw"],
    visa_executive: ["ocr:use", "ocr:apply", "ocr:read-raw"],
  };
  for (const [name, keys] of Object.entries(grants)) {
    const role = await p.role.findUnique({ where: { name } });
    if (!role) { console.log("  (no role " + name + ")"); continue; }
    await p.rolePermission.createMany({ data: keys.map((k) => ({ roleId: role.id, permId: byKey[k] })), skipDuplicates: true });
  }
  console.log("OCR permissions seeded + granted");
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
