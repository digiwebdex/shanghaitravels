#!/usr/bin/env node
/**
 * API smoke + auth + visa workflow against staging (ERP_BASE) or /api2.
 * Loads apps/web/.env.test — never prints passwords.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const envPath = path.join(root, ".env.test");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m) process.env[m[1]] ??= m[2];
}

const BASE = process.env.ERP_BASE || "http://127.0.0.1:4201/api";
const EMAIL = process.env.ERP_TEST_EMAIL;
const PASS = process.env.ERP_TEST_PASSWORD;
if (!EMAIL || !PASS) {
  console.error("Missing ERP_TEST_EMAIL / ERP_TEST_PASSWORD in .env.test");
  process.exit(2);
}

const jar = new Map();
function storeCookies(res) {
  const raw = res.headers.getSetCookie?.() || [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
}
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(method, p, body) {
  const res = await fetch(`${BASE}${p}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Cookie: cookieHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  storeCookies(res);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data, res };
}

const results = [];
function ok(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

async function main() {
  // Health
  {
    const r = await req("GET", "/health");
    ok("api: health", r.status === 200 && r.data?.ok === true, `status=${r.status}`);
  }

  // Unauthenticated
  {
    const r = await req("GET", "/auth/me");
    ok("auth: me without cookie → 401", r.status === 401, `status=${r.status}`);
  }

  const okHttp = (s) => s >= 200 && s < 300;

  // Login
  {
    const r = await req("POST", "/auth/login", { email: EMAIL, password: PASS });
    ok("auth: login", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
    ok("auth: refresh cookie Path=/", jar.has("st_refresh") && jar.has("st_access"), `cookies=${[...jar.keys()].join(",")}`);
  }

  // Me + RBAC
  let me;
  {
    const r = await req("GET", "/auth/me");
    me = r.data;
    ok("auth: me", r.status === 200 && me?.email === EMAIL, me?.role || "");
    ok("rbac: permissions present", Array.isArray(me?.permissions) || me?.role === "super_admin", me?.role);
  }

  // Silent refresh
  {
    const r = await req("POST", "/auth/refresh");
    ok("auth: silent refresh", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
    const me2 = await req("GET", "/auth/me");
    ok("auth: session after refresh", okHttp(me2.status), `status=${me2.status}`);
  }

  // Assignable staff
  {
    const r = await req("GET", "/users/assignable");
    ok("users: assignable list", r.status === 200 && Array.isArray(r.data) && r.data.length > 0, `n=${r.data?.length}`);
  }

  // user:manage list still gated
  {
    const r = await req("GET", "/users");
    ok("users: manage list (super_admin ok)", r.status === 200, `status=${r.status}`);
  }

  // Create customer + visa case + checklist + assign
  let customerId;
  let appId;
  {
    const code = `QA${Date.now().toString(36).slice(-6)}`;
    const r = await req("POST", "/customers", {
      fullName: "QA Stabilization Customer",
      phone: "01700000000",
      code,
      nationality: "Bangladeshi",
    });
    customerId = r.data?.id;
    ok("workflow: create customer", okHttp(r.status) && !!customerId, `status=${r.status}`);
  }

  {
    const r = await req("POST", "/applications", {
      customerId,
      serviceType: "visa",
      title: "QA China tourist",
      direction: "outbound",
    });
    appId = r.data?.id;
    ok("workflow: create visa application", okHttp(r.status) && !!appId, `status=${r.status}`);
    ok("workflow: CVASC stages instantiated", (r.data?.totalStages || 0) >= 1, `stages=${r.data?.totalStages}`);
  }

  {
    const r = await req("PUT", `/applications/${appId}/visa`, {
      visaType: "tourist",
      destination: "China",
      embassy: "CVASC Dhaka",
      entryType: "single",
    });
    ok("workflow: put visa detail", okHttp(r.status), `status=${r.status}`);
  }

  {
    const r = await req("PUT", `/applications/${appId}/checklist`, {
      updates: [
        { itemKey: "Passport copy", checked: true },
        { itemKey: "Photo", checked: true },
      ],
    });
    const items = r.data?.items || [];
    ok("checklist: put ticks", okHttp(r.status) && items.some((i) => i.checked), `n=${items.length}`);
    const g = await req("GET", `/applications/${appId}/checklist`);
    ok(
      "checklist: get multi-device sync",
      (g.data?.items || []).filter((i) => i.checked).length >= 2,
      `checked=${(g.data?.items || []).filter((i) => i.checked).length}`,
    );
    ok(
      "checklist: audit attribution",
      (g.data?.items || []).some((i) => i.checkedBy && i.checkedAt),
      "checkedBy+checkedAt",
    );
  }

  {
    const staff = await req("GET", "/users/assignable");
    const other = (staff.data || []).find((u) => u.id !== me.id) || { id: me.id };
    const r = await req("POST", `/applications/${appId}/assign`, { assignedTo: other.id });
    ok(
      "assign: to authorized staff",
      okHttp(r.status) && r.data?.assignedTo === other.id,
      `to=${other.email || other.id} status=${r.status}`,
    );
  }

  {
    const r = await req("POST", `/applications/${appId}/note`, { message: "QA smoke note" });
    ok("workflow: note", okHttp(r.status), `status=${r.status}`);
  }

  // Finance smoke (may need accounts)
  {
    const acc = await req("GET", "/accounts");
    ok("finance: list accounts", okHttp(acc.status), `status=${acc.status}`);
    if (Array.isArray(acc.data) && acc.data[0] && customerId) {
      const inv = await req("POST", "/invoices", {
        customerId,
        applicationId: appId,
        items: [{ description: "QA visa fee", quantity: 1, unitPrice: 10000 }],
      });
      ok("finance: create invoice", okHttp(inv.status), `status=${inv.status}`);
      if (inv.data?.id) {
        const issued = await req("POST", `/invoices/${inv.data.id}/issue`);
        ok("finance: issue invoice", okHttp(issued.status), `status=${issued.status}`);
        const pay = await req("POST", "/payments", {
          invoiceId: inv.data.id,
          customerId,
          accountId: acc.data[0].id,
          amount: 10000,
          method: "cash",
        });
        ok("finance: record payment", okHttp(pay.status), `status=${pay.status}`);
      }
    } else {
      ok("finance: create invoice", false, "no accounts — skipped body");
    }
  }

  // OCR probe (may 503 if gated)
  {
    const r = await req("GET", "/ocr");
    ok("ocr: list endpoint reachable", okHttp(r.status) || r.status === 403, `status=${r.status}`);
  }

  // Phase B — air_ticket (manual detail, no GDS)
  let airId;
  {
    const r = await req("POST", "/applications", {
      customerId,
      serviceType: "air_ticket",
      title: "QA Air ticket",
      direction: "outbound",
    });
    airId = r.data?.id;
    ok("ticketing: create air_ticket case", okHttp(r.status) && !!airId, `status=${r.status} stages=${r.data?.totalStages}`);
  }
  {
    const r = await req("PUT", `/applications/${airId}/detail/air_ticket`, {
      pnr: "QA1PNR",
      airline: "CA",
      flightNo: "CA123",
      origin: "DAC",
      destination: "PEK",
      tripType: "one_way",
      cabinClass: "economy",
      passengerName: "QA Passenger",
      ticketNo: "999-1234567890",
      departAt: new Date(Date.now() + 864e5).toISOString(),
    });
    ok("ticketing: put air_ticket detail", okHttp(r.status), `status=${r.status}`);
    const g = await req("GET", `/applications/${airId}`);
    ok(
      "ticketing: reload airTicket on case",
      okHttp(g.status) && g.data?.airTicket?.pnr === "QA1PNR",
      `pnr=${g.data?.airTicket?.pnr}`,
    );
  }
  {
    const r = await req("POST", `/applications/${airId}/note`, {
      message: "Fare quotation: ৳15000 — QA consolidator",
    });
    ok("ticketing: fare quotation note", okHttp(r.status), `status=${r.status}`);
  }
  {
    const r = await req("POST", `/applications/${airId}/advance-stage`, { note: "QA advance to fare" });
    ok("ticketing: advance stage", okHttp(r.status), `status=${r.status} stage=${r.data?.currentStage}`);
  }
  {
    const r = await req("PATCH", `/applications/${airId}`, { status: "cancelled" });
    ok("ticketing: cancel status", okHttp(r.status) && r.data?.status === "cancelled", `status=${r.status} app=${r.data?.status}`);
    const j = await req("GET", `/applications/${airId}/journey`);
    const events = j.data?.events || [];
    const hasStatus = events.some((e) => e.type === "status_changed");
    ok("ticketing: cancel audit event", okHttp(j.status) && hasStatus, `events=${events.length} hasStatus=${hasStatus}`);
  }

  // Phase B2 — hotel (manual detail, hotel master, no bed-bank)
  let hotelId;
  {
    const r = await req("POST", "/applications", {
      customerId,
      serviceType: "hotel",
      title: "QA Hotel booking",
      direction: "outbound",
    });
    hotelId = r.data?.id;
    ok("hotel: create hotel case", okHttp(r.status) && !!hotelId, `status=${r.status} stages=${r.data?.totalStages}`);
  }
  {
    const r = await req("PUT", `/applications/${hotelId}/detail/hotel`, {
      hotelName: "QA Grand Hotel",
      city: "Dhaka",
      country: "Bangladesh",
      roomType: "Deluxe",
      mealPlan: "BB",
      rooms: 1,
      guests: 2,
      nights: 2,
      confirmationNo: "HTL-QA-001",
      checkIn: new Date(Date.now() + 864e5).toISOString(),
      checkOut: new Date(Date.now() + 3 * 864e5).toISOString(),
    });
    ok("hotel: put hotel detail", okHttp(r.status), `status=${r.status}`);
    const g = await req("GET", `/applications/${hotelId}`);
    ok(
      "hotel: reload hotel on case",
      okHttp(g.status) && g.data?.hotel?.mealPlan === "BB" && g.data?.hotel?.hotelName === "QA Grand Hotel",
      `meal=${g.data?.hotel?.mealPlan} name=${g.data?.hotel?.hotelName}`,
    );
  }
  {
    const r = await req("GET", "/reference/hotels?limit=20");
    ok("hotel: list hotel master", okHttp(r.status) && Array.isArray(r.data?.data), `status=${r.status} n=${r.data?.data?.length}`);
  }
  {
    const r = await req("POST", "/reference/hotels", {
      name: `QA Hotel ${Date.now()}`,
      city: "Dhaka",
      country: "Bangladesh",
      stars: 4,
    });
    // settings:manage — super_admin bypass
    ok("hotel: create hotel master", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
    if (r.data?.id) {
      const d = await req("DELETE", `/reference/hotels/${r.data.id}`);
      ok("hotel: soft-delete hotel master", okHttp(d.status), `status=${d.status}`);
    } else {
      ok("hotel: soft-delete hotel master", false, "skipped — create failed");
    }
  }
  {
    const r = await req("GET", "/suppliers?type=hotel&limit=20");
    ok("hotel: list hotel suppliers", okHttp(r.status) || r.status === 403, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/applications/${hotelId}/note`, { message: "Hotel quote: ৳12000 — QA" });
    ok("hotel: quote note", okHttp(r.status), `status=${r.status}`);
  }
  {
    const r = await req("PATCH", `/applications/${hotelId}`, { status: "cancelled" });
    ok("hotel: cancel status", okHttp(r.status) && r.data?.status === "cancelled", `status=${r.status}`);
  }

  // Phase B3 — transport (supplier-based, no fleet)
  let transportId;
  {
    const r = await req("POST", "/applications", {
      customerId,
      serviceType: "transport",
      title: "QA Transport booking",
      direction: "outbound",
    });
    transportId = r.data?.id;
    ok("transport: create transport case", okHttp(r.status) && !!transportId, `status=${r.status} stages=${r.data?.totalStages}`);
  }
  {
    const r = await req("PUT", `/applications/${transportId}/detail/transport`, {
      serviceKind: "airport_transfer",
      vehicleType: "sedan",
      pickupLocation: "DAC Airport",
      dropLocation: "Gulshan 2",
      routeName: "DAC → Gulshan",
      passengers: 2,
      confirmationNo: "TRN-QA-001",
      driverName: "QA Driver",
      vehicleNo: "DHA-QA-1",
      scheduledAt: new Date(Date.now() + 864e5).toISOString(),
    });
    ok("transport: put transport detail", okHttp(r.status), `status=${r.status}`);
    const g = await req("GET", `/applications/${transportId}`);
    ok(
      "transport: reload transport on case",
      okHttp(g.status) &&
        g.data?.transport?.serviceKind === "airport_transfer" &&
        g.data?.transport?.confirmationNo === "TRN-QA-001",
      `kind=${g.data?.transport?.serviceKind} conf=${g.data?.transport?.confirmationNo}`,
    );
  }
  {
    const r = await req("POST", "/reference/transport-vehicles", {
      name: `QA Sedan ${Date.now()}`,
      category: "sedan",
      capacity: 4,
    });
    ok("transport: create vehicle offer", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
    if (r.data?.id) {
      const d = await req("DELETE", `/reference/transport-vehicles/${r.data.id}`);
      ok("transport: soft-delete vehicle offer", okHttp(d.status), `status=${d.status}`);
    } else {
      ok("transport: soft-delete vehicle offer", false, "skipped");
    }
  }
  {
    const r = await req("POST", "/reference/transport-routes", {
      name: `QA Route ${Date.now()}`,
      origin: "DAC Airport",
      destination: "Banani",
      kind: "airport_transfer",
    });
    ok("transport: create route", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
    if (r.data?.id) {
      const d = await req("DELETE", `/reference/transport-routes/${r.data.id}`);
      ok("transport: soft-delete route", okHttp(d.status), `status=${d.status}`);
    } else {
      ok("transport: soft-delete route", false, "skipped");
    }
  }
  {
    const r = await req("GET", "/suppliers?type=transport&limit=20");
    ok("transport: list transport suppliers", okHttp(r.status) || r.status === 403, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/applications/${transportId}/note`, { message: "Transport quote: ৳4500 — QA" });
    ok("transport: quote note", okHttp(r.status), `status=${r.status}`);
  }
  {
    const r = await req("PATCH", `/applications/${transportId}`, { status: "cancelled" });
    ok("transport: cancel status", okHttp(r.status) && r.data?.status === "cancelled", `status=${r.status}`);
  }

  // Phase B4 — tour packages (supplier-curated, not OTA)
  let tourId;
  {
    const r = await req("POST", "/applications", {
      serviceType: "tour",
      customerId,
      priority: "medium",
      title: "QA Tour Package",
      direction: "outbound",
    });
    tourId = r.data?.id;
    ok("tour: create tour case", okHttp(r.status) && !!tourId, `status=${r.status} stages=${r.data?.totalStages}`);
  }
  {
    const r = await req("PUT", `/applications/${tourId}/detail/tour`, {
      packageName: "QA Bali Escape",
      packageCode: "QA-BALI-01",
      packageType: "group",
      category: "international",
      destination: "Bali",
      season: "peak",
      pax: 2,
      itinerary: "Day 1: Arrival\nAirport meet\n\nDay 2: Ubud\nTemples",
      inclusions: "Hotel, transfers",
      exclusions: "Flights",
      supplierCostPoisha: 5000000,
      sellingPricePoisha: 6500000,
      confirmationNo: "TOUR-QA-001",
    });
    ok("tour: put tour detail", okHttp(r.status), `status=${r.status}`);
    const g = await req("GET", `/applications/${tourId}`);
    ok(
      "tour: reload tour on case",
      okHttp(g.status) &&
        g.data?.tour?.packageCode === "QA-BALI-01" &&
        g.data?.tour?.confirmationNo === "TOUR-QA-001",
      `code=${g.data?.tour?.packageCode} conf=${g.data?.tour?.confirmationNo}`,
    );
  }
  let tourPkgId;
  {
    const r = await req("POST", "/reference/tour-packages", {
      code: `QA-PKG-${Date.now().toString(36)}`,
      name: "QA Catalog Package",
      packageType: "family",
      category: "domestic",
      destination: "Cox's Bazar",
      season: "all_year",
      supplierCostPoisha: 1000000,
      sellingPricePoisha: 1400000,
    });
    tourPkgId = r.data?.id;
    ok("tour: create package product", okHttp(r.status) && !!tourPkgId, `status=${r.status}`);
  }
  {
    if (tourPkgId) {
      const r = await req("POST", "/reference/tour-departures", {
        packageId: tourPkgId,
        departAt: new Date("2026-09-01T12:00:00Z").toISOString(),
        returnAt: new Date("2026-09-05T12:00:00Z").toISOString(),
        seats: 20,
        status: "open",
      });
      ok("tour: create departure", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
      if (r.data?.id) {
        const d = await req("DELETE", `/reference/tour-departures/${r.data.id}`);
        ok("tour: soft-delete departure", okHttp(d.status), `status=${d.status}`);
      }
    } else {
      ok("tour: create departure", false, "skipped");
      ok("tour: soft-delete departure", false, "skipped");
    }
  }
  {
    const r = await req("POST", "/reference/tour-destinations", {
      name: `QA Dest ${Date.now().toString(36)}`,
      country: "Bangladesh",
      city: "Cox's Bazar",
      season: "peak",
    });
    ok("tour: create destination", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
    if (r.data?.id) {
      const d = await req("DELETE", `/reference/tour-destinations/${r.data.id}`);
      ok("tour: soft-delete destination", okHttp(d.status), `status=${d.status}`);
    } else {
      ok("tour: soft-delete destination", false, "skipped");
    }
  }
  {
    if (tourPkgId) {
      const d = await req("DELETE", `/reference/tour-packages/${tourPkgId}`);
      ok("tour: soft-delete package product", okHttp(d.status), `status=${d.status}`);
    } else {
      ok("tour: soft-delete package product", false, "skipped");
    }
  }
  {
    const r = await req("POST", `/applications/${tourId}/note`, { message: "Tour quotation: ৳65000 — QA" });
    ok("tour: quotation note", okHttp(r.status), `status=${r.status}`);
  }
  {
    const r = await req("PATCH", `/applications/${tourId}`, { status: "cancelled" });
    ok("tour: cancel status", okHttp(r.status) && r.data?.status === "cancelled", `status=${r.status}`);
  }

  // Phase B5 — Hajj & Umrah (operator packages / pilgrims / groups)
  let hajjId;
  {
    const r = await req("POST", "/applications", {
      serviceType: "hajj",
      customerId,
      priority: "medium",
      title: "QA Hajj Booking",
      direction: "outbound",
    });
    hajjId = r.data?.id;
    ok("hajj: create hajj case", okHttp(r.status) && !!hajjId, `status=${r.status} stages=${r.data?.totalStages}`);
  }
  {
    const r = await req("PUT", `/applications/${hajjId}/detail/hajj`, {
      packageType: "hajj",
      year: "2026",
      pilgrimName: "QA Pilgrim",
      passportNo: "BP1234567",
      mahramName: "QA Mahram",
      packageName: "QA Hajj Standard",
      packageCode: "QA-HAJJ-01",
      packageCategory: "standard",
      visaStatus: "applied",
      passportStatus: "received",
      flightNo: "SV123",
      airline: "Saudia",
      hotelMakkah: "QA Makkah Hotel",
      hotelMadinah: "QA Madinah Hotel",
      roomType: "quad",
      supplierCostPoisha: 20000000,
      sellingPricePoisha: 28000000,
      paidPoisha: 10000000,
      confirmationNo: "HAJJ-QA-001",
      paymentPlanNote: "4 installments",
    });
    ok("hajj: put hajj detail", okHttp(r.status), `status=${r.status}`);
    const g = await req("GET", `/applications/${hajjId}`);
    ok(
      "hajj: reload hajjUmrah on case",
      okHttp(g.status) &&
        g.data?.hajjUmrah?.packageCode === "QA-HAJJ-01" &&
        g.data?.hajjUmrah?.confirmationNo === "HAJJ-QA-001",
      `code=${g.data?.hajjUmrah?.packageCode} conf=${g.data?.hajjUmrah?.confirmationNo}`,
    );
  }
  let hajjPkgId;
  {
    const r = await req("POST", "/reference/hajj-packages", {
      code: `QA-HU-${Date.now().toString(36)}`,
      name: "QA Hajj Catalog Package",
      kind: "hajj",
      category: "economy",
      season: "Hajj 2026",
      year: "2026",
      capacity: 40,
      supplierCostPoisha: 15000000,
      sellingPricePoisha: 21000000,
    });
    hajjPkgId = r.data?.id;
    ok("hajj: create package", okHttp(r.status) && !!hajjPkgId, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/reference/hajj-pilgrims", {
      code: `QA-PIL-${Date.now().toString(36)}`,
      fullName: "QA Pilgrim Profile",
      passportNo: "BP9999999",
      nationality: "Bangladeshi",
      gender: "M",
      visaStatus: "not_applied",
      passportStatus: "pending",
      mahramName: "QA Father",
      mahramRelation: "father",
      emergencyContact: "QA Contact",
      emergencyPhone: "01700000000",
    });
    ok("hajj: create pilgrim", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
    if (r.data?.id) {
      const d = await req("DELETE", `/reference/hajj-pilgrims/${r.data.id}`);
      ok("hajj: soft-delete pilgrim", okHttp(d.status), `status=${d.status}`);
    } else {
      ok("hajj: soft-delete pilgrim", false, "skipped");
    }
  }
  {
    const r = await req("POST", "/reference/hajj-groups", {
      code: `QA-GRP-${Date.now().toString(36)}`,
      name: "QA Group A",
      kind: "hajj",
      packageId: hajjPkgId || undefined,
      leaderName: "QA Leader",
      flightNo: "SV456",
      airline: "Saudia",
      status: "forming",
      capacity: 40,
      departAt: new Date("2026-06-01T12:00:00Z").toISOString(),
      returnAt: new Date("2026-06-25T12:00:00Z").toISOString(),
    });
    ok("hajj: create group", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
    if (r.data?.id) {
      const d = await req("DELETE", `/reference/hajj-groups/${r.data.id}`);
      ok("hajj: soft-delete group", okHttp(d.status), `status=${d.status}`);
    } else {
      ok("hajj: soft-delete group", false, "skipped");
    }
  }
  {
    if (hajjPkgId) {
      const d = await req("DELETE", `/reference/hajj-packages/${hajjPkgId}`);
      ok("hajj: soft-delete package", okHttp(d.status), `status=${d.status}`);
    } else {
      ok("hajj: soft-delete package", false, "skipped");
    }
  }
  {
    const r = await req("POST", `/applications/${hajjId}/note`, {
      message: "Hajj/Umrah installment: ৳100000 — QA",
    });
    ok("hajj: installment note", okHttp(r.status), `status=${r.status}`);
  }
  {
    const r = await req("PATCH", `/applications/${hajjId}`, { status: "cancelled" });
    ok("hajj: cancel status", okHttp(r.status) && r.data?.status === "cancelled", `status=${r.status}`);
  }

  // Phase C1 — Finance ERP foundation (double-entry GL)
  {
    const r = await req("POST", "/gl/bootstrap", {});
    ok("gl: bootstrap foundation", okHttp(r.status), `status=${r.status} boot=${r.data?.bootstrapped}`);
  }
  {
    const r = await req("GET", "/gl/accounts?active=true");
    const n = Array.isArray(r.data) ? r.data.length : 0;
    ok("gl: list chart of accounts", okHttp(r.status) && n >= 1, `status=${r.status} n=${n}`);
  }
  let cashId;
  let revenueId;
  {
    const r = await req("GET", "/gl/accounts?active=true");
    const list = Array.isArray(r.data) ? r.data : [];
    cashId = list.find((a) => a.code === "1100")?.id || list.find((a) => a.isPostable && a.type === "asset")?.id;
    revenueId = list.find((a) => a.code === "4000")?.id || list.find((a) => a.isPostable && a.type === "income")?.id;
    ok("gl: resolve postable accounts", !!cashId && !!revenueId, `cash=${!!cashId} rev=${!!revenueId}`);
  }
  let journalId;
  {
    const r = await req("POST", "/gl/journals", {
      entryDate: new Date().toISOString(),
      type: "opening",
      memo: "QA opening balance",
      currencyCode: "BDT",
      lines: [
        { glAccountId: cashId, debitPoisha: 100000, creditPoisha: 0, currencyCode: "BDT" },
        { glAccountId: revenueId, debitPoisha: 0, creditPoisha: 100000, currencyCode: "BDT" },
      ],
    });
    journalId = r.data?.id;
    ok(
      "gl: create balanced journal",
      okHttp(r.status) && !!journalId && r.data?.totalDebitPoisha === r.data?.totalCreditPoisha,
      `status=${r.status} no=${r.data?.journalNo}`,
    );
  }
  {
    const r = await req("POST", `/gl/journals/${journalId}/submit`, {});
    ok("gl: submit journal", okHttp(r.status) && r.data?.status === "pending_approval", `status=${r.status}`);
  }
  {
    const r = await req("POST", `/gl/journals/${journalId}/approve`, {});
    ok("gl: approve journal", okHttp(r.status) && !!r.data?.approvedBy, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/gl/journals/${journalId}/post`, {});
    ok("gl: post journal", okHttp(r.status) && r.data?.status === "posted", `status=${r.status}`);
  }
  {
    const r = await req("GET", "/gl/reports/trial-balance");
    ok(
      "gl: trial balance balanced",
      okHttp(r.status) && r.data?.balanced === true,
      `status=${r.status} bal=${r.data?.balanced}`,
    );
  }
  {
    const r = await req("GET", "/gl/reports/journal-register");
    ok("gl: journal register", okHttp(r.status) && (r.data?.total ?? 0) >= 1, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/gl/fiscal-years");
    ok("gl: list fiscal years", okHttp(r.status) && Array.isArray(r.data) && r.data.length >= 1, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/gl/journals", {
      entryDate: new Date().toISOString(),
      type: "standard",
      memo: "QA unbalanced should fail",
      lines: [
        { glAccountId: cashId, debitPoisha: 5000, creditPoisha: 0 },
        { glAccountId: revenueId, debitPoisha: 0, creditPoisha: 1000 },
      ],
    });
    ok("gl: reject unbalanced journal", r.status >= 400, `status=${r.status}`);
  }

  // Phase C2 — AR / AP
  let arInvoiceCashId;
  {
    const inv = await req("POST", "/invoices", {
      customerId,
      applicationId: airId,
      items: [{ description: "QA AR bridge fee", quantity: 1, unitPrice: 250000 }],
    });
    arInvoiceCashId = inv.data?.id;
    ok("ar: create operational invoice", okHttp(inv.status) && !!arInvoiceCashId, `status=${inv.status}`);
    if (arInvoiceCashId) {
      const issued = await req("POST", `/invoices/${arInvoiceCashId}/issue`);
      ok("ar: issue operational invoice", okHttp(issued.status), `status=${issued.status}`);
    }
  }
  let arDocId;
  {
    const r = await req("POST", `/ar/bridge/invoice/${arInvoiceCashId}`, {});
    arDocId = r.data?.id;
    ok(
      "ar: bridge invoice posts GL",
      okHttp(r.status) && r.data?.status === "posted" && !!r.data?.journalId,
      `status=${r.status} ar=${r.data?.docNo} je=${r.data?.journalId}`,
    );
  }
  {
    const r = await req("GET", "/ar/documents?limit=20");
    ok("ar: list documents", okHttp(r.status) && Array.isArray(r.data) && r.data.length >= 1, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/ar/reports/aging");
    ok("ar: aging report", okHttp(r.status) && Array.isArray(r.data?.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", `/ar/reports/customer-ledger?customerId=${customerId}`);
    ok("ar: customer ledger", okHttp(r.status) && (r.data?.entries?.length || 0) >= 1, `status=${r.status}`);
  }
  let supplierId;
  {
    const r = await req("POST", "/suppliers", {
      name: `QA AP Supplier ${Date.now()}`,
      type: "other",
      phone: "01700000099",
    });
    supplierId = r.data?.id;
    ok("ap: create supplier", okHttp(r.status) && !!supplierId, `status=${r.status}`);
  }
  let apDocId;
  {
    const r = await req("POST", "/ap/documents", {
      type: "bill",
      supplierId,
      applicationId: hotelId,
      dueDate: new Date(Date.now() + 7 * 864e5).toISOString(),
      lines: [{ description: "QA hotel supplier bill", quantity: 1, unitPricePoisha: 180000, amountPoisha: 180000 }],
    });
    apDocId = r.data?.id;
    ok("ap: create bill draft", okHttp(r.status) && !!apDocId && r.data?.status === "draft", `status=${r.status}`);
  }
  {
    const r = await req("POST", `/ap/documents/${apDocId}/submit`, {});
    ok("ap: submit bill", okHttp(r.status) && r.data?.status === "pending_approval", `status=${r.status}`);
  }
  {
    const r = await req("POST", `/ap/documents/${apDocId}/approve`, {});
    ok("ap: approve bill", okHttp(r.status) && r.data?.status === "approved", `status=${r.status}`);
  }
  {
    const r = await req("POST", `/ap/documents/${apDocId}/post`, {});
    ok(
      "ap: post bill to GL",
      okHttp(r.status) && r.data?.status === "posted" && !!r.data?.journalId,
      `status=${r.status} je=${r.data?.journalId}`,
    );
  }
  {
    const r = await req("GET", "/ap/reports/aging");
    ok("ap: aging report", okHttp(r.status) && Array.isArray(r.data?.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", `/ap/reports/supplier-ledger?supplierId=${supplierId}`);
    ok("ap: supplier ledger", okHttp(r.status) && (r.data?.entries?.length || 0) >= 1, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/ar/reports/outstanding");
    ok(
      "arap: outstanding summary",
      okHttp(r.status) && (r.data?.arOutstandingPoisha ?? 0) >= 0 && (r.data?.apOutstandingPoisha ?? 0) >= 0,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/gl/reports/trial-balance");
    ok(
      "arap: trial balance still balanced",
      okHttp(r.status) && r.data?.balanced === true,
      `status=${r.status} bal=${r.data?.balanced}`,
    );
  }

  // Phase C3 — Banking & cash
  {
    const r = await req("POST", "/banking/bootstrap", {});
    ok("banking: bootstrap", okHttp(r.status), `status=${r.status} boot=${r.data?.bootstrapped}`);
  }
  let cashBankId;
  let operatingBankId;
  {
    const r = await req("GET", "/banking/accounts?active=true");
    const list = Array.isArray(r.data) ? r.data : [];
    cashBankId = list.find((a) => a.kind === "cash")?.id;
    operatingBankId = list.find((a) => a.kind === "bank")?.id;
    ok("banking: list accounts", okHttp(r.status) && !!cashBankId && !!operatingBankId, `status=${r.status} n=${list.length}`);
  }
  {
    const r = await req("POST", "/banking/movements", {
      type: "transfer",
      fromBankAccountId: cashBankId,
      toBankAccountId: operatingBankId,
      amountPoisha: 50000,
      memo: "QA cash to bank",
      postImmediately: true,
    });
    ok(
      "banking: post transfer",
      okHttp(r.status) && r.data?.status === "posted" && !!r.data?.journalId,
      `status=${r.status} no=${r.data?.movementNo}`,
    );
  }
  {
    const r = await req("POST", "/banking/cheques", {
      bankAccountId: operatingBankId,
      direction: "outgoing",
      chequeNo: `QA-${Date.now()}`,
      payeeOrDrawer: "QA Supplier",
      amountPoisha: 120000,
    });
    const chequeId = r.data?.id;
    ok("banking: create cheque", okHttp(r.status) && !!chequeId, `status=${r.status}`);
    if (chequeId) {
      const p = await req("POST", `/banking/cheques/${chequeId}/print`, {});
      ok("banking: print cheque", okHttp(p.status) && !!p.data?.print, `status=${p.status}`);
    }
  }
  {
    const r = await req("POST", "/banking/statements/import-csv", {
      bankAccountId: operatingBankId,
      csv: "date,description,amount,ref\n2026-07-30,QA Deposit,500.00,DEP1\n2026-07-30,QA Charge,-10.00,CHG1",
    });
    ok("banking: import CSV statement", okHttp(r.status) && (r.data?.lines?.length || 0) >= 2, `status=${r.status}`);
    if (r.data?.id) {
      const recon = await req("POST", "/banking/reconciliations", {
        bankAccountId: operatingBankId,
        statementId: r.data.id,
        statementBalancePoisha: 49000,
      });
      ok("banking: start reconciliation", okHttp(recon.status), `status=${recon.status}`);
      if (recon.data?.id) {
        const done = await req("POST", `/banking/reconciliations/${recon.data.id}/complete`, {});
        ok("banking: complete reconciliation", okHttp(done.status) && done.data?.status === "completed", `status=${done.status}`);
      }
    }
  }
  {
    const r = await req("GET", "/banking/reports/daily-cash-position");
    ok("banking: daily cash position", okHttp(r.status) && Array.isArray(r.data?.rows), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/banking/reports/cash-flow-summary");
    ok("banking: cash flow summary", okHttp(r.status) && !!r.data?.summary, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/gl/reports/trial-balance");
    ok(
      "banking: trial balance still balanced",
      okHttp(r.status) && r.data?.balanced === true,
      `status=${r.status} bal=${r.data?.balanced}`,
    );
  }

  // ---------- Phase C4 — Financial statements ----------
  {
    const r = await req("GET", "/fs/trial-balance");
    ok("fs: trial balance", okHttp(r.status) && r.data?.balanced === true, `status=${r.status}`);
  }
  {
    const r = await req("GET", `/fs/balance-sheet?asOf=${encodeURIComponent(new Date().toISOString())}`);
    ok(
      "fs: balance sheet",
      okHttp(r.status) && r.data?.totals?.balanced === true,
      `status=${r.status} bal=${r.data?.totals?.balanced}`,
    );
  }
  {
    const y = new Date().getUTCFullYear();
    const r = await req("GET", `/fs/profit-loss?from=${y}-01-01&to=${y}-12-31`);
    ok("fs: profit & loss", okHttp(r.status) && r.data?.totals != null, `status=${r.status}`);
  }
  {
    const y = new Date().getUTCFullYear();
    const r = await req("GET", `/fs/cash-flow?from=${y}-01-01&to=${y}-12-31`);
    ok("fs: cash flow", okHttp(r.status) && r.data?.method === "simplified_indirect", `status=${r.status}`);
  }
  {
    const y = new Date().getUTCFullYear();
    const r = await req("GET", `/fs/equity?from=${y}-01-01&to=${y}-12-31`);
    ok("fs: equity statement", okHttp(r.status) && r.data?.closingEquityPoisha != null, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/fs/ledger?limit=20");
    ok("fs: ledger inquiry", okHttp(r.status) && Array.isArray(r.data?.entries), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/fs/analysis/branch");
    ok("fs: branch analysis", okHttp(r.status) && Array.isArray(r.data?.rows), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/fs/analysis/currency");
    ok("fs: currency analysis", okHttp(r.status) && Array.isArray(r.data?.rows), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/fs/travel-validation");
    ok(
      "fs: travel validation",
      okHttp(r.status) && r.data?.trialBalanceBalanced === true,
      `status=${r.status} tb=${r.data?.trialBalanceBalanced}`,
    );
  }
  {
    const r = await req("GET", "/fs/export/balance-sheet?format=csv&asOf=" + encodeURIComponent(new Date().toISOString()));
    ok("fs: export csv", okHttp(r.status) && (typeof r.data?.raw === "string" || r.data != null), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/fs/closing-runs");
    ok("fs: closing runs", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  let fsPeriodId = null;
  {
    const r = await req("GET", "/gl/fiscal-years");
    const years = Array.isArray(r.data) ? r.data : r.data?.data || [];
    const closed = years.flatMap((y) => (y.periods || []).filter((p) => p.status === "closed" || p.status === "locked"));
    const open = years.flatMap((y) => (y.periods || []).filter((p) => p.status === "open"));
    fsPeriodId = closed[0]?.id || open[0]?.id || null;
    ok("fs: has period for controls", !!fsPeriodId, `period=${fsPeriodId || "none"}`);
  }
  if (fsPeriodId) {
    const lock = await req("POST", `/fs/periods/${fsPeriodId}/lock`, {});
    // open periods cannot lock — treat 400 as expected when still open
    ok(
      "fs: period lock (or already open/locked)",
      okHttp(lock.status) || lock.status === 400,
      `status=${lock.status}`,
    );
  }

  // ---------- Phase D1 — CRM foundation ----------
  let crmLeadId = null;
  let crmOppId = null;
  let crmQuoteId = null;
  {
    const r = await req("POST", "/crm/leads", {
      name: `CRM Smoke ${Date.now()}`,
      phone: "01700000099",
      source: "whatsapp",
      serviceInterest: "visa",
      priority: "hot",
    });
    crmLeadId = r.data?.id || null;
    ok("crm: create lead", okHttp(r.status) && !!crmLeadId, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/crm/contacts", {
      fullName: "CRM Contact Smoke",
      kind: "individual",
      phone: "01700000088",
    });
    ok("crm: create contact", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/crm/organizations", {
      name: `Corp Smoke ${Date.now()}`,
      type: "corporate",
    });
    ok("crm: create organization", okHttp(r.status) && !!r.data?.code, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/crm/opportunities", {
      title: "China visa opportunity",
      leadId: crmLeadId,
      serviceType: "visa",
      expectedRevenuePoisha: 2500000,
    });
    crmOppId = r.data?.id || null;
    ok("crm: create opportunity", okHttp(r.status) && !!crmOppId, `status=${r.status}`);
  }
  if (crmOppId) {
    const r = await req("POST", `/crm/opportunities/${crmOppId}/stage`, { stage: "proposal" });
    ok("crm: advance opportunity stage", okHttp(r.status) && r.data?.stage === "proposal", `status=${r.status}`);
  }
  {
    const r = await req("POST", "/crm/activities", {
      type: "follow_up",
      subject: "Call back tomorrow",
      relatedType: "lead",
      relatedId: crmLeadId,
    });
    ok("crm: create activity", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/crm/quotations", {
      serviceType: "visa",
      leadId: crmLeadId,
      opportunityId: crmOppId,
      lines: [{ description: "Visa processing", quantity: 1, unitPricePoisha: 500000 }],
    });
    crmQuoteId = r.data?.id || null;
    ok("crm: create quotation", okHttp(r.status) && !!crmQuoteId, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/crm/convert", {
      opportunityId: crmOppId,
      leadId: crmLeadId,
      serviceType: "visa",
    });
    ok(
      "crm: convert to visa case",
      okHttp(r.status) && !!r.data?.application?.referenceNo,
      `status=${r.status} ref=${r.data?.application?.referenceNo}`,
    );
  }
  {
    const r = await req("GET", "/crm/reports/lead-sources");
    ok("crm: lead sources report", okHttp(r.status) && Array.isArray(r.data?.rows), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/crm/reports/conversion");
    ok("crm: conversion report", okHttp(r.status) && r.data?.leadsTotal != null, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/crm/reports/pipeline");
    ok("crm: pipeline report", okHttp(r.status) && Array.isArray(r.data?.rows), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/crm/reports/forecast");
    ok("crm: forecast report", okHttp(r.status) && r.data?.weightedRevenuePoisha != null, `status=${r.status}`);
  }

  // ---------- Phase D2 — Sales Automation ----------
  let salesQuoteId = null;
  let salesOppId = crmOppId;
  {
    const r = await req("POST", "/sales/bootstrap", {});
    ok("sales: bootstrap", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/sales/stages");
    ok("sales: list stages", okHttp(r.status) && Array.isArray(r.data) && r.data.length >= 5, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/sales/lost-reasons");
    ok("sales: list lost reasons", okHttp(r.status) && Array.isArray(r.data) && r.data.length >= 3, `status=${r.status}`);
  }
  if (!salesOppId) {
    const r = await req("POST", "/crm/opportunities", {
      title: `Sales smoke opp ${Date.now()}`,
      serviceType: "hotel",
      expectedRevenuePoisha: 2500000,
    });
    salesOppId = r.data?.id || null;
    ok("sales: ensure opportunity", okHttp(r.status) && !!salesOppId, `status=${r.status}`);
  }
  if (salesOppId) {
    const r = await req("POST", `/sales/opportunities/${salesOppId}/stage`, { stage: "negotiation" });
    ok("sales: set opportunity stage", okHttp(r.status) && r.data?.stage === "negotiation", `status=${r.status}`);
  }
  if (salesOppId) {
    const r = await req("GET", `/sales/opportunities/${salesOppId}/history`);
    ok("sales: stage history", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("POST", "/sales/quotations", {
      serviceType: "hotel",
      opportunityId: salesOppId || undefined,
      leadId: crmLeadId || undefined,
      discountPoisha: 50000,
      taxPoisha: 10000,
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      lines: [{ description: "Deluxe room package", quantity: 2, unitPricePoisha: 800000, productCode: "HTL-DLX" }],
    });
    salesQuoteId = r.data?.id || null;
    ok(
      "sales: create quotation",
      okHttp(r.status) && !!salesQuoteId && r.data?.version === 1 && r.data?.status === "draft",
      `status=${r.status}`,
    );
  }
  if (salesQuoteId) {
    const r = await req("POST", `/sales/quotations/${salesQuoteId}/submit`, {});
    ok("sales: submit quotation", okHttp(r.status) && r.data?.status === "pending_approval", `status=${r.status}`);
  }
  if (salesQuoteId) {
    const r = await req("POST", `/sales/quotations/${salesQuoteId}/approve`, {});
    ok("sales: approve quotation", okHttp(r.status) && r.data?.status === "approved", `status=${r.status}`);
  }
  if (salesQuoteId) {
    const r = await req("POST", `/sales/quotations/${salesQuoteId}/send`, {});
    ok(
      "sales: send quotation email-ready",
      okHttp(r.status) && !!r.data?.emailReady?.html && r.data?.quotation?.status === "sent",
      `status=${r.status}`,
    );
  }
  if (salesQuoteId) {
    const r = await req("POST", `/sales/quotations/${salesQuoteId}/revise`, {});
    ok("sales: revise quotation", okHttp(r.status) && r.data?.version >= 2 && r.data?.status === "draft", `status=${r.status}`);
  }
  {
    const r = await req("POST", "/sales/price-templates", {
      name: `Visa template ${Date.now()}`,
      serviceType: "visa",
      lines: [{ description: "Standard visa fee", productCode: "VISA-STD", unitPricePoisha: 450000 }],
    });
    ok("sales: create price template", okHttp(r.status) && !!r.data?.code, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/sales/price-books", {
      name: `Promo ${Date.now()}`,
      kind: "promo",
      serviceType: "visa",
      unitPricePoisha: 400000,
      discountBps: 500,
    });
    ok("sales: create price book", okHttp(r.status) && r.data?.kind === "promo", `status=${r.status}`);
  }
  {
    const r = await req("POST", "/sales/pricing/resolve", { serviceType: "visa" });
    ok("sales: resolve pricing", okHttp(r.status) && r.data?.unitPricePoisha != null, `status=${r.status}`);
  }
  let salesTaskId = null;
  {
    const r = await req("POST", "/sales/tasks", {
      title: `Follow up ${Date.now()}`,
      type: "follow_up",
      opportunityId: salesOppId || undefined,
      slaHours: 24,
    });
    salesTaskId = r.data?.id || null;
    ok("sales: create task", okHttp(r.status) && !!salesTaskId, `status=${r.status}`);
  }
  if (salesTaskId) {
    const r = await req("POST", `/sales/tasks/${salesTaskId}/escalate`, {});
    ok("sales: escalate task", okHttp(r.status) && r.data?.status === "escalated", `status=${r.status}`);
  }
  // Convert needs approved/accepted — create fresh approved quote for convert
  let convertQuoteId = null;
  {
    const created = await req("POST", "/sales/quotations", {
      serviceType: "tour",
      opportunityId: salesOppId || undefined,
      lines: [{ description: "Cox's Bazar 3D2N", quantity: 1, unitPricePoisha: 1500000 }],
    });
    convertQuoteId = created.data?.id || null;
    if (convertQuoteId) {
      await req("POST", `/sales/quotations/${convertQuoteId}/submit`, {});
      await req("POST", `/sales/quotations/${convertQuoteId}/approve`, {});
    }
    const r = await req("POST", "/sales/convert", { quotationId: convertQuoteId, serviceType: "tour" });
    ok(
      "sales: convert approved quote to booking",
      okHttp(r.status) && !!r.data?.application?.referenceNo,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/sales/reports/quote-status");
    ok("sales: quote status report", okHttp(r.status) && Array.isArray(r.data?.rows), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/sales/reports/win-loss");
    ok("sales: win-loss report", okHttp(r.status) && r.data?.winRate != null, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/sales/reports/funnel");
    ok("sales: funnel report", okHttp(r.status) && Array.isArray(r.data?.rows), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/sales/reports/by-executive");
    ok("sales: by-executive report", okHttp(r.status) && Array.isArray(r.data?.rows), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/sales/reports/conversion-time");
    ok("sales: conversion-time report", okHttp(r.status) && r.data?.avgDays != null, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/sales/reports/forecast-accuracy");
    ok("sales: forecast-accuracy report", okHttp(r.status) && r.data?.sampleSize != null, `status=${r.status}`);
  }

  // ---------- Phase D3 — Communications ----------
  let commsLeadId = crmLeadId;
  if (!commsLeadId) {
    const r = await req("POST", "/crm/leads", {
      name: `Comms smoke ${Date.now()}`,
      phone: "01710000099",
      email: `comms-smoke-${Date.now()}@example.com`,
      source: "whatsapp",
      serviceInterest: "visa",
    });
    commsLeadId = r.data?.id || null;
    ok("comms: ensure lead", okHttp(r.status) && !!commsLeadId, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/comms/bootstrap", {});
    ok("comms: bootstrap templates", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/comms/templates");
    ok("comms: list templates", okHttp(r.status) && Array.isArray(r.data) && r.data.length >= 5, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/comms/log", {
      relatedType: "lead",
      relatedId: commsLeadId,
      channel: "call",
      summary: "Discovery call logged",
      body: "Discussed Schengen visa options",
      partyKind: "prospect",
      attachments: [{ fileName: "notes.txt", mimeType: "text/plain", sizeBytes: 12, storageKey: "local/notes.txt" }],
    });
    ok("comms: log timeline entry", okHttp(r.status) && r.data?.channel === "call", `status=${r.status}`);
  }
  {
    const r = await req("GET", `/comms/timeline?relatedType=lead&relatedId=${encodeURIComponent(commsLeadId)}`);
    ok("comms: unified timeline", okHttp(r.status) && Array.isArray(r.data?.items), `status=${r.status}`);
  }
  {
    const r = await req("POST", "/comms/send", {
      channel: "email",
      to: `guest-${Date.now()}@example.com`,
      relatedType: "lead",
      relatedId: commsLeadId,
      partyKind: "prospect",
      templateCode: "email_quotation",
      vars: { customerName: "Guest", quoteNo: "QT-SMOKE", totalAmount: "৳1,000.00" },
    });
    ok(
      "comms: send email",
      okHttp(r.status) && !!r.data?.message?.id && ["sent", "queued", "delivered"].includes(r.data?.message?.status),
      `status=${r.status} msg=${r.data?.message?.status}`,
    );
  }
  {
    const r = await req("POST", "/comms/send", {
      channel: "whatsapp",
      to: "8801712345678",
      relatedType: "lead",
      relatedId: commsLeadId,
      partyKind: "prospect",
      templateCode: "wa_payment_reminder",
      vars: { amount: "৳500", referenceNo: "APP-SMOKE" },
    });
    ok(
      "comms: send whatsapp",
      okHttp(r.status) && !!r.data?.message?.id,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("POST", "/comms/send", {
      channel: "sms",
      to: "8801712345678",
      relatedType: "lead",
      relatedId: commsLeadId,
      partyKind: "prospect",
      templateCode: "sms_otp",
      vars: { otp: "654321", minutes: "5" },
    });
    ok("comms: send sms otp", okHttp(r.status) && !!r.data?.message?.id, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/comms/delivery");
    ok("comms: delivery history", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/comms/threads?channel=email");
    ok("comms: email threads", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  let commsActivityId = null;
  {
    const r = await req("POST", "/comms/activities", {
      subject: `Follow-up ${Date.now()}`,
      type: "follow_up",
      relatedType: "lead",
      relatedId: commsLeadId,
      dueAt: new Date(Date.now() + 3600_000).toISOString(),
      recurrenceRule: "weekly",
      slaHours: 24,
    });
    commsActivityId = r.data?.id || null;
    ok("comms: create activity", okHttp(r.status) && !!commsActivityId, `status=${r.status}`);
  }
  if (commsActivityId) {
    const r = await req("POST", `/comms/activities/${commsActivityId}/escalate`, {});
    ok("comms: escalate activity", okHttp(r.status) && r.data?.status === "escalated", `status=${r.status}`);
  }
  {
    const r = await req("GET", "/comms/calendar");
    ok("comms: calendar", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/comms/sla");
    ok("comms: sla dashboard", okHttp(r.status) && r.data?.compliancePct != null, `status=${r.status}`);
  }
  {
    const r = await req("GET", `/comms/portal/prospect/${encodeURIComponent(commsLeadId)}/timeline`);
    ok(
      "comms: portal timeline API",
      okHttp(r.status) && r.data?.meta?.forPortal === true && Array.isArray(r.data?.items),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/comms/reports/volume");
    ok("comms: volume report", okHttp(r.status) && Array.isArray(r.data?.messages), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/comms/reports/response-time");
    ok("comms: response-time report", okHttp(r.status) && r.data?.avgResponseHours != null, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/comms/reports/sla-compliance");
    ok("comms: sla-compliance report", okHttp(r.status) && r.data?.open != null, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/comms/reports/activity-completion");
    ok("comms: activity-completion report", okHttp(r.status) && Array.isArray(r.data?.rows), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/comms/reports/executive-productivity");
    ok("comms: executive-productivity report", okHttp(r.status) && Array.isArray(r.data?.rows), `status=${r.status}`);
  }

  // ---------- Phase D4 — Analytics ----------
  {
    const r = await req("POST", "/analytics/bootstrap", {});
    ok("analytics: bootstrap", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/analytics/executive");
    ok(
      "analytics: executive dashboard",
      okHttp(r.status) && r.data?.pipeline && r.data?.revenueForecast && r.data?.bookingConversion,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/analytics/customer");
    ok(
      "analytics: customer dashboard",
      okHttp(r.status) && r.data?.lifetimeValue && r.data?.repeatCustomerRate != null,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/analytics/sales");
    ok("analytics: sales dashboard", okHttp(r.status) && r.data?.winLoss && r.data?.quotationAcceptance, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/analytics/comms");
    ok("analytics: comms dashboard", okHttp(r.status) && r.data?.slaCompliance && r.data?.emailMetrics, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/analytics/finance");
    ok(
      "analytics: finance dashboard",
      okHttp(r.status) && Array.isArray(r.data?.revenueByService) && r.data?.collections != null,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/analytics/templates");
    ok("analytics: list templates", okHttp(r.status) && Array.isArray(r.data) && r.data.length >= 3, `status=${r.status}`);
  }
  let analyticsTplId = null;
  {
    const r = await req("POST", "/analytics/templates", {
      code: `custom_${Date.now()}`,
      name: "Custom exec slice",
      category: "executive",
      definition: { metrics: ["pipeline"], defaultFilters: {} },
    });
    analyticsTplId = r.data?.id || null;
    ok("analytics: create template", okHttp(r.status) && !!analyticsTplId, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/analytics/schedules", {
      templateId: analyticsTplId,
      name: `Weekly exec ${Date.now()}`,
      cronExpr: "0 8 * * 1",
      format: "csv",
      filters: {},
      recipients: ["ops@example.com"],
    });
    ok("analytics: create schedule definition", okHttp(r.status) && !!r.data?.id && r.data?.cronExpr === "0 8 * * 1", `status=${r.status}`);
  }
  {
    const r = await req("GET", "/analytics/schedules");
    ok("analytics: list schedules", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/analytics/export/executive?format=csv");
    const body = typeof r.data === "string" ? r.data : r.data?.raw || "";
    ok("analytics: export csv", okHttp(r.status) && String(body).includes("executive"), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/analytics/export/sales?format=html");
    const body = typeof r.data === "string" ? r.data : r.data?.raw || "";
    ok("analytics: export html/pdf", okHttp(r.status) && String(body).includes("<html"), `status=${r.status}`);
  }

  // ---------- Phase E1 Website & CMS ----------
  {
    const r = await req("POST", "/cms/bootstrap", {});
    ok("cms: bootstrap", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
  }
  let cmsPageId = null;
  {
    const r = await req("GET", "/cms/pages");
    ok("cms: list pages", okHttp(r.status) && Array.isArray(r.data) && r.data.length >= 1, `status=${r.status} n=${r.data?.length}`);
    cmsPageId = r.data?.[0]?.id || null;
  }
  {
    const slug = `smoke-page-${Date.now().toString().slice(-6)}`;
    const r = await req("POST", "/cms/pages", {
      title: "CMS Smoke Page",
      slug,
      body: "Smoke body",
      seoTitle: "CMS Smoke",
      seoDescription: "SEO smoke",
      blocks: [{ type: "richtext", props: { html: "<p>Smoke</p>" } }],
    });
    cmsPageId = r.data?.id || cmsPageId;
    ok("cms: create page", okHttp(r.status) && !!cmsPageId, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/cms/pages/${cmsPageId}/submit-review`, {});
    ok("cms: submit review", okHttp(r.status) && (r.data?.status === "in_review" || r.data?.status === "published"), `status=${r.status} pageStatus=${r.data?.status}`);
  }
  {
    const r = await req("POST", `/cms/pages/${cmsPageId}/publish`, {});
    ok("cms: publish page", okHttp(r.status) && (r.data?.status === "published" || r.data?.published === true), `status=${r.status}`);
  }
  {
    const r = await req("POST", "/cms/menus", {
      code: "smoke-main",
      name: "Smoke menu",
      items: [{ label: "Home", href: "/#/site", sortOrder: 10 }],
    });
    ok("cms: upsert menu", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/cms/media", {
      fileName: `smoke-${Date.now()}.jpg`,
      storageKey: `https://example.com/smoke-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      altText: "smoke",
    });
    ok("cms: create media", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/cms/banners", {
      code: `smoke-banner-${Date.now().toString().slice(-6)}`,
      title: "Smoke banner",
      placement: "hero",
      linkHref: "/#/site/enquire",
    });
    ok("cms: create banner", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/cms/redirects", {
      fromPath: `/p/smoke-old-${Date.now().toString().slice(-6)}`,
      toPath: "/#/site/p/home",
      statusCode: 301,
    });
    ok("cms: create redirect", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/cms/content", {
      type: "blog",
      title: `Smoke blog ${Date.now()}`,
      summary: "smoke",
      body: "body",
    });
    const id = r.data?.id;
    ok("cms: create content", okHttp(r.status) && !!id, `status=${r.status}`);
    if (id) {
      const p = await req("POST", `/cms/content/${id}/publish`, {});
      ok("cms: publish content", okHttp(p.status) && p.data?.status === "published", `status=${p.status}`);
    }
  }
  {
    const r = await req("POST", "/cms/travel", {
      serviceType: "tour",
      title: `Smoke Tour ${Date.now()}`,
      destination: "Shanghai",
      summary: "smoke tour",
      status: "published",
      priceFromPoisha: 5000000,
    });
    ok("cms: create travel offer", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/cms/forms");
    ok("cms: list forms", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/cms/reports");
    ok(
      "cms: reports",
      okHttp(r.status) && r.data?.publishing && Array.isArray(r.data?.pageViews),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/site/pages/home");
    ok("site: public page", okHttp(r.status) && !!r.data?.page?.slug, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/site/menus/main");
    ok("site: public menu", okHttp(r.status) && (r.data?.code === "main" || r.data === null || !!r.data?.id), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/site/banners?placement=hero");
    ok("site: public banners", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/site/content?type=blog");
    ok("site: public content", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/site/travel?serviceType=tour");
    ok("site: public travel", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/site/search?q=visa");
    ok(
      "site: search",
      okHttp(r.status) && Array.isArray(r.data?.pages) && Array.isArray(r.data?.packages),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("POST", "/site/forms", {
      formType: "enquiry",
      name: `Smoke Enquirer ${Date.now()}`,
      phone: "01700000999",
      email: `cms-smoke-${Date.now()}@example.com`,
      message: "Phase E1 smoke enquiry",
      pageSlug: "enquire",
      serviceInterest: "visa",
    });
    ok(
      "site: form creates CRM lead",
      okHttp(r.status) && r.data?.ok === true && !!r.data?.leadId,
      `status=${r.status} leadId=${r.data?.leadId}`,
    );
  }
  {
    const r = await req("POST", "/site/forms", {
      formType: "career",
      name: `Smoke Applicant ${Date.now()}`,
      email: `career-smoke-${Date.now()}@example.com`,
      message: "CV attached (smoke)",
      pageSlug: "careers",
    });
    ok(
      "site: career form no lead",
      okHttp(r.status) && r.data?.ok === true && (r.data?.leadId == null || r.data?.leadId === null),
      `status=${r.status} leadId=${r.data?.leadId}`,
    );
  }
  {
    const r = await req("GET", "/site/robots.txt");
    const body = typeof r.data === "string" ? r.data : r.data?.raw || "";
    ok("site: robots.txt", okHttp(r.status) && String(body).includes("Sitemap:"), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/site/sitemap.xml");
    const body = typeof r.data === "string" ? r.data : r.data?.raw || "";
    ok("site: sitemap.xml", okHttp(r.status) && String(body).includes("<urlset"), `status=${r.status}`);
  }

  // ---------- Phase F1 Customer Portal ----------
  const portalEmail = `portal.smoke.${Date.now()}@example.com`;
  const portalPassword = "PortalSmoke1!";
  let portalDevCode = null;
  {
    const r = await req("POST", "/portal/customer/register", {
      email: portalEmail,
      password: portalPassword,
      fullName: "Portal Smoke User",
      phone: `017${String(Date.now()).slice(-8)}`,
    });
    portalDevCode = r.data?.devCode || null;
    ok("portal: register", okHttp(r.status) && r.data?.ok === true && !!r.data?.email, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/customer/verify-email", { email: portalEmail, code: portalDevCode || "000000" });
    ok("portal: verify email", okHttp(r.status) && r.data?.ok === true, `status=${r.status} code=${portalDevCode}`);
  }
  {
    const r = await req("POST", "/portal/customer/login", { email: portalEmail, password: portalPassword });
    ok("portal: login", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/customer/me");
    ok("portal: me", okHttp(r.status) && !!r.data?.customer?.id, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/customer/dashboard");
    ok(
      "portal: dashboard",
      okHttp(r.status) && r.data?.applications && r.data?.invoices,
      `status=${r.status}`,
    );
  }
  let portalAppId = null;
  {
    const r = await req("POST", "/portal/customer/applications", {
      serviceType: "visa",
      title: "Portal smoke visa",
      message: "smoke",
    });
    portalAppId = r.data?.id || null;
    ok("portal: create application", okHttp(r.status) && !!portalAppId && !!r.data?.referenceNo, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/customer/applications");
    ok("portal: list applications", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", `/portal/customer/applications/${portalAppId}`);
    ok("portal: get application", okHttp(r.status) && r.data?.id === portalAppId, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/customer/documents");
    ok("portal: list documents", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/customer/finance");
    ok("portal: finance", okHttp(r.status) && Array.isArray(r.data?.invoices), `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/customer/support", {
      subject: "Smoke support",
      body: "Need assistance with visa documents",
    });
    ok("portal: support request", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/customer/communications");
    ok(
      "portal: communications",
      okHttp(r.status) && Array.isArray(r.data?.messages) && Array.isArray(r.data?.support),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("POST", "/portal/customer/profile/passports", {
      passportNo: `P${Date.now().toString().slice(-8)}`,
      issuingCountry: "BD",
      isPrimary: true,
    });
    ok("portal: upsert passport", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/customer/profile/family", { fullName: "Family Smoke", relationship: "spouse" });
    ok("portal: add family", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/customer/profile/travellers", { fullName: "Traveller Smoke" });
    ok("portal: add traveller", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/customer/profile/emergency", {
      fullName: "Emergency Smoke",
      phone: "01700001111",
    });
    ok("portal: add emergency", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/customer/reports");
    ok(
      "portal: reports",
      okHttp(r.status) && Array.isArray(r.data?.bookingHistory) && Array.isArray(r.data?.paymentHistory),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("POST", "/portal/customer/forgot-password", { email: portalEmail });
    const code = r.data?.devCode;
    ok("portal: forgot password", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
    if (code) {
      const reset = await req("POST", "/portal/customer/reset-password", {
        email: portalEmail,
        code,
        newPassword: "PortalSmoke2!",
      });
      ok("portal: reset password", okHttp(reset.status) && reset.data?.ok === true, `status=${reset.status}`);
    } else {
      ok("portal: reset password", false, "no devCode");
    }
  }
  {
    const r = await req("POST", "/portal/customer/otp/request", { email: portalEmail });
    const code = r.data?.devCode;
    ok("portal: otp request", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
    if (code) {
      const v = await req("POST", "/portal/customer/otp/verify", { email: portalEmail, code });
      ok("portal: otp verify login", okHttp(v.status) && v.data?.ok === true, `status=${v.status}`);
    } else {
      ok("portal: otp verify login", false, "no devCode");
    }
  }
  {
    const r = await req("POST", "/portal/customer/logout");
    ok("portal: logout", okHttp(r.status), `status=${r.status}`);
  }

  {
    const r = await req("POST", "/auth/logout");
    ok("auth: logout", okHttp(r.status), `status=${r.status}`);
  }

  const failed = results.filter((r) => !r.pass);
  console.log("\n--- summary ---");
  console.log(`passed ${results.length - failed.length}/${results.length}`);
  const out = path.join(root, "coverage", "api-smoke-report.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ base: BASE, results, failed: failed.length }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
