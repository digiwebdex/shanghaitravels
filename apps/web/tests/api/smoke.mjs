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
