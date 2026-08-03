import type { PortalSearchHit } from "@/components/search/PortalSmartSearch";
import { customerPortalApi } from "@/lib/portalApi";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { corporatePortalApi } from "@/lib/corporatePortalApi";

function match(hay: string, q: string) {
  return hay.toLowerCase().includes(q.toLowerCase());
}

export async function customerPortalSearchHits(q: string): Promise<PortalSearchHit[]> {
  const hits: PortalSearchHit[] = [];
  const [apps, docs, passports] = await Promise.all([
    customerPortalApi.applications().catch(() => []),
    customerPortalApi.documents().catch(() => []),
    customerPortalApi.passports().catch(() => []),
  ]);
  for (const a of apps) {
    const ref = String(a.referenceNo || a.id || "");
    const st = String(a.serviceType || a.status || "");
    if (match(`${ref} ${st} ${a.id}`, q)) {
      hits.push({
        id: `app-${a.id}`,
        label: ref || String(a.id),
        subtitle: `Booking · ${st}`,
        to: `/portal/customer/applications/${a.id}`,
        kind: "booking",
      });
    }
  }
  for (const d of docs) {
    const name = String(d.fileName || d.category || d.id || "");
    if (match(`${name} ${d.category || ""}`, q)) {
      hits.push({
        id: `doc-${d.id}`,
        label: name,
        subtitle: "Document",
        to: "/portal/customer/documents",
        kind: "document",
      });
    }
  }
  for (const p of passports) {
    const no = String(p.passportNo || "");
    if (match(`${no} ${p.nationality || ""}`, q)) {
      hits.push({
        id: `pp-${p.id || no}`,
        label: no || "Passport",
        subtitle: "Passport",
        to: "/portal/customer/profile",
        kind: "passport",
      });
    }
  }
  return hits.slice(0, 24);
}

export async function agentPortalSearchHits(q: string): Promise<PortalSearchHit[]> {
  const hits: PortalSearchHit[] = [];
  const [cases, customers, docs] = await Promise.all([
    agentPortalApi.cases().catch(() => []),
    agentPortalApi.customers().catch(() => []),
    agentPortalApi.documents().catch(() => []),
  ]);
  for (const c of cases) {
    const ref = String(c.referenceNo || c.reference || c.id || "");
    const name = String(c.customerName || c.title || "");
    if (match(`${ref} ${name} ${c.status || ""} ${c.passportNo || ""}`, q)) {
      hits.push({
        id: `case-${c.id}`,
        label: ref,
        subtitle: `Case · ${name || c.status || ""}`,
        to: `/portal/agent/bookings/${c.id}`,
        kind: "case",
      });
    }
  }
  for (const c of customers) {
    const name = String(c.fullName || c.name || "");
    const code = String(c.code || "");
    const passport = String(c.passportNo || "");
    const mobile = String(c.mobile || c.phone || "");
    if (match(`${name} ${code} ${passport} ${mobile}`, q)) {
      hits.push({
        id: `cust-${c.id}`,
        label: name || code,
        subtitle: `Customer · ${passport || mobile || code}`,
        to: `/portal/agent/customers/${c.id}`,
        kind: "customer",
      });
    }
  }
  for (const d of docs) {
    const name = String(d.fileName || d.category || d.id || "");
    if (match(name, q)) {
      hits.push({
        id: `doc-${d.id}`,
        label: name,
        subtitle: "Document",
        to: "/portal/agent/documents",
        kind: "document",
      });
    }
  }
  return hits.slice(0, 24);
}

export async function corporatePortalSearchHits(q: string): Promise<PortalSearchHit[]> {
  const hits: PortalSearchHit[] = [];
  const [employees, bookings] = await Promise.all([
    corporatePortalApi.employees().catch(() => []),
    corporatePortalApi.bookings().catch(() => []),
  ]);
  for (const e of employees) {
    const name = String(e.fullName || e.name || "");
    const dept = String(e.department || "");
    const passport = String(e.passportNo || "");
    if (match(`${name} ${dept} ${passport} ${e.email || ""}`, q)) {
      hits.push({
        id: `emp-${e.id}`,
        label: name,
        subtitle: `Employee · ${dept || passport || "—"}`,
        to: `/portal/corporate/employees/${e.id}`,
        kind: "employee",
      });
    }
  }
  for (const b of bookings) {
    const ref = String(b.referenceNo || b.id || "");
    if (match(`${ref} ${b.status || ""} ${b.employeeName || ""}`, q)) {
      hits.push({
        id: `bk-${String(b.id)}`,
        label: ref,
        subtitle: "Booking",
        to: `/portal/corporate/bookings/${String(b.id)}`,
        kind: "booking",
      });
    }
  }
  return hits.slice(0, 24);
}
