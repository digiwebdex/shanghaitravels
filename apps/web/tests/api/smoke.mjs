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

async function reqForm(method, p, form) {
  const res = await fetch(`${BASE}${p}`, {
    method,
    headers: { Cookie: cookieHeader() },
    body: form,
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
    const r = await req("GET", "/site/packages?collection=featured&limit=6");
    ok(
      "site: packages list",
      okHttp(r.status) && (Array.isArray(r.data) || Array.isArray(r.data?.data)),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/site/destinations?collection=home");
    ok(
      "site: destinations list",
      okHttp(r.status) && (Array.isArray(r.data) || Array.isArray(r.data?.data)),
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

  // ---------- Phase G1 Agent Portal ----------
  // Staff session still present (customer cookies are separate). Create agent + invite.
  const agentEmail = `agent.smoke.${Date.now()}@example.com`;
  const agentPhone = `019${String(Date.now()).slice(-8)}`;
  let agentId = null;
  let agentTempPassword = null;
  {
    const r = await req("POST", "/agents", {
      name: "Smoke Agent Co",
      phone: agentPhone,
      email: agentEmail,
      commissionRateBps: 250,
    });
    agentId = r.data?.id || null;
    ok("agent-portal: create agent", okHttp(r.status) && !!agentId, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/agent-accounts/${agentId}`, { email: agentEmail });
    agentTempPassword = r.data?.tempPassword || null;
    ok(
      "agent-portal: invite",
      okHttp(r.status) && r.data?.invited === true && !!agentTempPassword,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("POST", "/portal/agent/login", { email: agentEmail, password: agentTempPassword });
    ok(
      "agent-portal: login",
      okHttp(r.status) && r.data?.ok === true && r.data?.mustChangePassword === true,
      `status=${r.status}`,
    );
    ok("agent-portal: agent cookie", jar.has("st_agent"), `cookies=${[...jar.keys()].join(",")}`);
  }
  {
    const r = await req("POST", "/portal/agent/change-password", {
      currentPassword: agentTempPassword,
      newPassword: "AgentSmoke1!",
    });
    ok("agent-portal: change password", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/agent/me");
    ok(
      "agent-portal: me",
      okHttp(r.status) && r.data?.agent?.id === agentId && r.data?.user?.mustChangePassword === false,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/portal/agent/dashboard");
    ok(
      "agent-portal: dashboard",
      okHttp(r.status) && r.data?.bookings && typeof r.data?.walletBalance === "number" && r.data?.salesSummary,
      `status=${r.status}`,
    );
  }
  let agentCustomerId = null;
  {
    const r = await req("POST", "/portal/agent/customers", {
      fullName: "Agent Smoke Customer",
      phone: `016${String(Date.now()).slice(-8)}`,
      email: `cust.${Date.now()}@example.com`,
    });
    agentCustomerId = r.data?.id || null;
    ok("agent-portal: create customer", okHttp(r.status) && !!agentCustomerId, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/agent/customers");
    ok("agent-portal: list customers", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("POST", `/portal/agent/customers/${agentCustomerId}/passports`, {
      passportNo: `AP${Date.now().toString().slice(-8)}`,
      issuingCountry: "BD",
      isPrimary: true,
    });
    ok("agent-portal: passport", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/portal/agent/customers/${agentCustomerId}/travellers`, {
      fullName: "Agent Traveller Smoke",
    });
    ok("agent-portal: traveller", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  let agentCaseId = null;
  {
    const r = await req("POST", "/portal/agent/cases", {
      serviceType: "visa",
      customerName: "Agent Case Customer",
      customerPhone: `015${String(Date.now()).slice(-8)}`,
      title: "Agent smoke visa",
      message: "smoke",
    });
    agentCaseId = r.data?.id || null;
    ok(
      "agent-portal: create booking",
      okHttp(r.status) && !!agentCaseId && !!r.data?.reference,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/portal/agent/cases");
    ok("agent-portal: list bookings", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", `/portal/agent/cases/${agentCaseId}`);
    ok(
      "agent-portal: get booking",
      okHttp(r.status) && r.data?.id === agentCaseId && r.data?.agentId === agentId,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/portal/agent/finance");
    ok(
      "agent-portal: finance",
      okHttp(r.status) && r.data?.wallet && Array.isArray(r.data?.commissions) && Array.isArray(r.data?.invoices),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/portal/agent/wallet");
    ok("agent-portal: wallet", okHttp(r.status) && typeof r.data?.balance === "number", `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/agent/commissions");
    ok("agent-portal: commissions", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/agent/documents");
    ok("agent-portal: documents", okHttp(r.status) && Array.isArray(r.data), `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/agent/support", {
      subject: "Agent smoke support",
      body: "Need help with commission payout",
    });
    ok("agent-portal: support", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/agent/communications");
    ok(
      "agent-portal: communications",
      okHttp(r.status) && Array.isArray(r.data?.messages) && Array.isArray(r.data?.support),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/portal/agent/reports");
    ok(
      "agent-portal: reports",
      okHttp(r.status) &&
        r.data?.sales &&
        Array.isArray(r.data?.bookingHistory) &&
        r.data?.outstanding &&
        r.data?.commissions,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("POST", "/portal/agent/forgot-password", { email: agentEmail });
    const code = r.data?.devCode;
    ok("agent-portal: forgot password", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
    if (code) {
      const reset = await req("POST", "/portal/agent/reset-password", {
        email: agentEmail,
        code,
        newPassword: "AgentSmoke2!",
      });
      ok("agent-portal: reset password", okHttp(reset.status) && reset.data?.ok === true, `status=${reset.status}`);
    } else {
      ok("agent-portal: reset password", false, "no devCode — set PORTAL_RETURN_CODES=true");
    }
  }
  {
    const r = await req("POST", "/portal/agent/otp/request", { email: agentEmail });
    const code = r.data?.devCode;
    ok("agent-portal: otp request", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
    if (code) {
      const v = await req("POST", "/portal/agent/otp/verify", { email: agentEmail, code });
      ok("agent-portal: otp verify", okHttp(v.status) && v.data?.ok === true, `status=${v.status}`);
    } else {
      ok("agent-portal: otp verify", false, "no devCode");
    }
  }
  {
    const r = await req("POST", "/portal/agent/logout");
    ok("agent-portal: logout", okHttp(r.status), `status=${r.status}`);
  }

  // ---------- Phase G1 Agent Portal security regression ----------
  const secTs = Date.now();
  const secAEmail = `agent.sec.a.${secTs}@example.com`;
  const secBEmail = `agent.sec.b.${secTs}@example.com`;
  let secAgentA = null;
  let secAgentB = null;
  let secATemp = null;
  let secBTemp = null;
  let secACustomerId = null;
  let secAPhone = `013${String(secTs).slice(-8)}`;
  let secACaseId = null;
  let secADocId = null;
  let secAInvoiceId = null;
  {
    const a = await req("POST", "/agents", {
      name: "Sec Agent A",
      phone: `011${String(secTs).slice(-8)}`,
      email: secAEmail,
      commissionRateBps: 100,
    });
    secAgentA = a.data?.id || null;
    const b = await req("POST", "/agents", {
      name: "Sec Agent B",
      phone: `012${String(secTs).slice(-8)}`,
      email: secBEmail,
      commissionRateBps: 100,
    });
    secAgentB = b.data?.id || null;
    ok("agent-sec: create two agents", !!secAgentA && !!secAgentB, `a=${secAgentA} b=${secAgentB}`);
  }
  {
    const a = await req("POST", `/agent-accounts/${secAgentA}`, { email: secAEmail, branchId: "br-corporate" });
    const b = await req("POST", `/agent-accounts/${secAgentB}`, { email: secBEmail, branchId: "br-head" });
    secATemp = a.data?.tempPassword || null;
    secBTemp = b.data?.tempPassword || null;
    ok("agent-sec: invite A/B multi-branch", !!secATemp && !!secBTemp, `status=${a.status}/${b.status}`);
  }
  {
    await req("POST", "/portal/agent/login", { email: secAEmail, password: secATemp });
    await req("POST", "/portal/agent/change-password", {
      currentPassword: secATemp,
      newPassword: "AgentSecA1!",
    });
    const me = await req("GET", "/portal/agent/me");
    ok(
      "agent-sec: A branch bound",
      okHttp(me.status) && me.data?.agent?.branchId === "br-corporate",
      `branchId=${me.data?.agent?.branchId}`,
    );
  }
  {
    const r = await req("POST", "/portal/agent/customers", {
      fullName: "Sec Customer A",
      phone: secAPhone,
    });
    secACustomerId = r.data?.id || null;
    ok("agent-sec: A create customer", okHttp(r.status) && !!secACustomerId, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/agent/cases", {
      serviceType: "visa",
      customerName: "Sec Customer A",
      customerPhone: secAPhone,
      title: "Sec booking A",
    });
    secACaseId = r.data?.id || null;
    ok(
      "agent-sec: A create booking on own branch",
      okHttp(r.status) && !!secACaseId,
      `status=${r.status}`,
    );
    const detail = await req("GET", `/portal/agent/cases/${secACaseId}`);
    ok(
      "agent-sec: A booking branchId=corporate",
      okHttp(detail.status) && detail.data?.branchId === "br-corporate",
      `branchId=${detail.data?.branchId}`,
    );
  }
  {
    const form = new FormData();
    const pdf = Buffer.from("%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    form.append("file", new Blob([pdf], { type: "application/pdf" }), "sec-a.pdf");
    form.append("applicationId", secACaseId);
    form.append("category", "passport");
    const r = await reqForm("POST", "/portal/agent/documents", form);
    secADocId = r.data?.id || null;
    ok("agent-sec: A upload document", okHttp(r.status) && !!secADocId, `status=${r.status}`);
  }
  {
    // Staff creates invoice for A's customer — B must not see it
    const inv = await req("POST", "/invoices", {
      customerId: secACustomerId,
      applicationId: secACaseId,
      items: [{ description: "Sec visa fee", quantity: 1, unitPrice: 50000 }],
    });
    secAInvoiceId = inv.data?.id || null;
    if (secAInvoiceId) await req("POST", `/invoices/${secAInvoiceId}/issue`);
    ok("agent-sec: staff invoice for A customer", !!secAInvoiceId, `status=${inv.status}`);
  }
  {
    const fin = await req("GET", "/portal/agent/finance");
    const ids = (fin.data?.invoices || []).map((i) => i.id);
    ok(
      "agent-sec: A sees own customer invoice",
      okHttp(fin.status) && ids.includes(secAInvoiceId),
      `n=${ids.length}`,
    );
  }
  {
    await req("POST", "/portal/agent/logout");
    await req("POST", "/portal/agent/login", { email: secBEmail, password: secBTemp });
    await req("POST", "/portal/agent/change-password", {
      currentPassword: secBTemp,
      newPassword: "AgentSecB1!",
    });
    const me = await req("GET", "/portal/agent/me");
    ok(
      "agent-sec: B branch bound",
      okHttp(me.status) && me.data?.agent?.branchId === "br-head" && me.data?.agent?.id === secAgentB,
      `branchId=${me.data?.agent?.branchId}`,
    );
  }
  {
    const r = await req("GET", `/portal/agent/customers/${secACustomerId}`);
    ok("agent-sec: B cannot read A customer", r.status === 404, `status=${r.status}`);
  }
  {
    const r = await req("GET", `/portal/agent/cases/${secACaseId}`);
    ok("agent-sec: B cannot read A booking", r.status === 404, `status=${r.status}`);
  }
  {
    const r = await req("GET", `/portal/agent/documents/${secADocId}/download`);
    ok("agent-sec: B cannot download A document", r.status === 404, `status=${r.status}`);
  }
  {
    const r = await req("GET", `/portal/agent/documents/${secADocId}/versions`);
    ok("agent-sec: B cannot list A document versions", r.status === 404, `status=${r.status}`);
  }
  {
    const fin = await req("GET", "/portal/agent/finance");
    const ids = (fin.data?.invoices || []).map((i) => i.id);
    ok(
      "agent-sec: B cannot see A customer invoices",
      okHttp(fin.status) && !ids.includes(secAInvoiceId),
      `ids=${ids.join(",")}`,
    );
  }
  {
    const r = await req("POST", "/portal/agent/cases", {
      serviceType: "hotel",
      customerName: "Hijack Attempt",
      customerPhone: secAPhone,
      title: "Should fail",
    });
    ok(
      "agent-sec: B cannot hijack A customer via phone",
      r.status >= 400 && r.status < 500,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("POST", "/portal/agent/cases", {
      serviceType: "visa",
      customerId: secACustomerId,
      customerName: "IDOR Attempt",
      customerPhone: `014${String(secTs).slice(-8)}`,
      title: "Should reject customerId",
    });
    ok(
      "agent-sec: B cannot pass foreign customerId",
      r.status >= 400 && r.status < 500,
      `status=${r.status}`,
    );
  }
  {
    const form = new FormData();
    const pdf = Buffer.from("%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    form.append("file", new Blob([pdf], { type: "application/pdf" }), "sec-b.pdf");
    form.append("applicationId", secACaseId);
    form.append("category", "passport");
    const r = await reqForm("POST", "/portal/agent/documents", form);
    ok(
      "agent-sec: B cannot upload to A applicationId",
      r.status >= 400 && r.status < 500,
      `status=${r.status}`,
    );
  }
  {
    // Cookie isolation: agent session must not satisfy staff APIs
    const staffBefore = jar.has("st_access");
    jar.delete("st_access");
    jar.delete("st_refresh");
    const meStaff = await req("GET", "/auth/me");
    ok("agent-sec: agent cookie ≠ staff", meStaff.status === 401, `status=${meStaff.status} hadStaff=${staffBefore}`);
    // Restore staff via re-login for remaining checks
    await req("POST", "/auth/login", { email: EMAIL, password: PASS });
  }
  {
    // Staff session must not satisfy agent portal APIs
    jar.delete("st_agent");
    jar.delete("st_agent_refresh");
    const meAgent = await req("GET", "/portal/agent/me");
    ok("agent-sec: staff cookie ≠ agent", meAgent.status === 401, `status=${meAgent.status}`);
  }
  {
    // Customer cookie must not satisfy agent portal
    const regEmail = `agent.sec.cust.${secTs}@example.com`;
    const regPass = "PortalSec1!";
    const reg = await req("POST", "/portal/customer/register", {
      email: regEmail,
      password: regPass,
      fullName: "Sec Cust",
      phone: `017${String(secTs).slice(-8)}`,
    });
    const code = reg.data?.devCode;
    if (code) {
      await req("POST", "/portal/customer/verify-email", { email: regEmail, code });
      await req("POST", "/portal/customer/login", { email: regEmail, password: regPass });
    }
    jar.delete("st_agent");
    jar.delete("st_agent_refresh");
    const meAgent = await req("GET", "/portal/agent/me");
    ok(
      "agent-sec: customer cookie ≠ agent",
      meAgent.status === 401 && jar.has("st_customer"),
      `status=${meAgent.status}`,
    );
    await req("POST", "/portal/customer/logout");
  }
  {
    const r = await req("GET", "/portal/agent/dashboard");
    ok("agent-sec: unauthenticated agent API → 401", r.status === 401, `status=${r.status}`);
  }
  {
    // Staff invite endpoint requires agent:manage (RBAC)
    const r = await req("POST", `/agent-accounts/${secAgentA}`, { email: secAEmail });
    ok("agent-sec: staff invite RBAC ok for test user", okHttp(r.status) && !!r.data?.tempPassword, `status=${r.status}`);
  }

  // ---------- Phase H1 Corporate Portal ----------
  jar.delete("st_agent");
  jar.delete("st_agent_refresh");
  jar.delete("st_customer");
  jar.delete("st_customer_refresh");
  await req("POST", "/auth/login", { email: EMAIL, password: PASS });

  const corpTs = Date.now();
  const corpEmail = `corp.portal.${corpTs}@example.com`;
  let corpClientId = null;
  let corpTemp = null;
  let corpEmpId = null;
  let corpReqId = null;
  let corpAppId = null;
  {
    const r = await req("POST", "/corporate-clients", {
      companyName: "Portal Smoke Corp",
      phone: `018${String(corpTs).slice(-8)}`,
      email: corpEmail,
      creditLimit: 5000000,
      paymentTermsDays: 45,
      branchId: "br-corporate",
    });
    corpClientId = r.data?.id || null;
    ok("corp-portal: create client", okHttp(r.status) && !!corpClientId, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/corporate-accounts/${corpClientId}`, { email: corpEmail, role: "admin" });
    corpTemp = r.data?.tempPassword || null;
    ok("corp-portal: invite", okHttp(r.status) && r.data?.invited === true && !!corpTemp, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/corporate/login", { email: corpEmail, password: corpTemp });
    ok(
      "corp-portal: login",
      okHttp(r.status) && r.data?.ok === true && r.data?.mustChangePassword === true,
      `status=${r.status}`,
    );
    ok("corp-portal: corporate cookie", jar.has("st_corporate"), `cookies=${[...jar.keys()].join(",")}`);
  }
  {
    const r = await req("POST", "/portal/corporate/change-password", {
      currentPassword: corpTemp,
      newPassword: "CorpSmoke1!",
    });
    ok("corp-portal: change password", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/corporate/me");
    ok(
      "corp-portal: me",
      okHttp(r.status) && r.data?.company?.id === corpClientId && r.data?.user?.role === "admin",
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/portal/corporate/dashboard");
    ok(
      "corp-portal: dashboard",
      okHttp(r.status) && r.data?.travelRequests && r.data?.finance,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("PATCH", "/portal/corporate/company", {
      billingAddress: "123 Smoke Road, Dhaka",
      preferredServices: ["visa", "air_ticket", "hotel"],
      contactPerson: "Smoke Admin",
    });
    ok("corp-portal: patch company", okHttp(r.status) && r.data?.billingAddress, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/corporate/employees", {
      fullName: "Corp Traveller One",
      phone: `016${String(corpTs).slice(-8)}`,
      department: "Sales",
      designation: "Executive",
      passportNo: `CP${String(corpTs).slice(-7)}`,
      isFrequentTraveller: true,
    });
    corpEmpId = r.data?.id || null;
    ok("corp-portal: create employee", okHttp(r.status) && !!corpEmpId, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/portal/corporate/employees/${corpEmpId}/emergency`, {
      fullName: "Emergency Contact",
      phone: "01700009999",
      relationship: "spouse",
    });
    ok("corp-portal: emergency contact", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/corporate/travel-requests", {
      employeeId: corpEmpId,
      serviceType: "visa",
      title: "Smoke visa request",
      destination: "China",
      message: "Business trip",
    });
    corpReqId = r.data?.id || null;
    ok("corp-portal: create travel request", okHttp(r.status) && !!corpReqId, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/portal/corporate/travel-requests/${corpReqId}/submit`);
    ok("corp-portal: submit request", okHttp(r.status) && r.data?.status === "submitted", `status=${r.status}`);
  }
  {
    // Admin can approve every chain step (list returns requests with nested approvals)
    for (let i = 0; i < 6; i++) {
      const pending = await req("GET", "/portal/corporate/approvals");
      const rows = Array.isArray(pending.data) ? pending.data : [];
      const travel = rows.find((r) => r.id === corpReqId) || rows[0];
      const step = (travel?.approvals || []).find(
        (a) => a.levelNo === travel.currentLevel && a.decision === "pending",
      );
      if (!step?.id) {
        ok("corp-portal: approval chain → ERP booking", false, `no pending step at i=${i}`);
        break;
      }
      const d = await req("POST", `/portal/corporate/approvals/${step.id}/decide`, {
        decision: "approved",
        note: `smoke level ${i + 1}`,
      });
      if (!okHttp(d.status)) {
        ok("corp-portal: approval chain → ERP booking", false, `failed at step ${i} status=${d.status}`);
        break;
      }
      const reqRow = await req("GET", `/portal/corporate/travel-requests/${corpReqId}`);
      if (reqRow.data?.status === "approved") {
        corpAppId = reqRow.data?.applicationId || null;
        ok("corp-portal: approval chain → ERP booking", !!corpAppId, `applicationId=${corpAppId}`);
        break;
      }
      if (i === 5) ok("corp-portal: approval chain → ERP booking", false, `status=${reqRow.data?.status}`);
    }
  }
  {
    const r = await req("GET", "/portal/corporate/bookings");
    ok(
      "corp-portal: list bookings",
      okHttp(r.status) && Array.isArray(r.data) && (!corpAppId || r.data.some((b) => b.id === corpAppId)),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/portal/corporate/finance");
    ok(
      "corp-portal: finance",
      okHttp(r.status) && r.data?.creditLimit != null && Array.isArray(r.data?.invoices),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("POST", "/portal/corporate/support", {
      subject: "Corp smoke support",
      body: "Need consolidated invoice copy",
    });
    ok("corp-portal: support", okHttp(r.status) && !!r.data?.id, `status=${r.status}`);
  }
  {
    const r = await req("GET", "/portal/corporate/communications");
    ok(
      "corp-portal: communications",
      okHttp(r.status) && (Array.isArray(r.data?.support) || Array.isArray(r.data?.messages)),
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/portal/corporate/reports");
    ok(
      "corp-portal: reports",
      okHttp(r.status) && r.data?.travel && r.data?.bookings && r.data?.finance,
      `status=${r.status}`,
    );
  }
  {
    const r = await req("GET", "/portal/corporate/approval-chain");
    ok(
      "corp-portal: approval chain config",
      okHttp(r.status) && Array.isArray(r.data?.steps) && r.data.steps.length >= 4,
      `status=${r.status} n=${r.data?.steps?.length}`,
    );
  }
  // Tenant isolation: company B cannot see company A request
  const corpBEmail = `corp.portal.b.${corpTs}@example.com`;
  let corpBId = null;
  let corpBTemp = null;
  {
    const c = await req("POST", "/corporate-clients", {
      companyName: "Portal Smoke Corp B",
      phone: `019${String(corpTs).slice(-8)}`,
      email: corpBEmail,
      creditLimit: 100000,
      paymentTermsDays: 15,
      branchId: "br-head",
    });
    corpBId = c.data?.id || null;
    const inv = await req("POST", `/corporate-accounts/${corpBId}`, { email: corpBEmail, role: "admin" });
    corpBTemp = inv.data?.tempPassword || null;
    ok("corp-portal: create/invite company B", !!corpBId && !!corpBTemp, `status=${c.status}/${inv.status}`);
  }
  {
    await req("POST", "/portal/corporate/logout");
    await req("POST", "/portal/corporate/login", { email: corpBEmail, password: corpBTemp });
    await req("POST", "/portal/corporate/change-password", {
      currentPassword: corpBTemp,
      newPassword: "CorpSmokeB1!",
    });
    const r = await req("GET", `/portal/corporate/travel-requests/${corpReqId}`);
    ok("corp-portal: B cannot read A request", r.status === 404, `status=${r.status}`);
    if (corpAppId) {
      const b = await req("GET", `/portal/corporate/bookings/${corpAppId}`);
      ok("corp-portal: B cannot read A booking", b.status === 404, `status=${b.status}`);
    } else {
      ok("corp-portal: B cannot read A booking", true, "skipped — no app");
    }
  }
  {
    const r = await req("POST", "/portal/corporate/forgot-password", { email: corpBEmail });
    const code = r.data?.devCode;
    ok("corp-portal: forgot password", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
    if (code) {
      const reset = await req("POST", "/portal/corporate/reset-password", {
        email: corpBEmail,
        code,
        newPassword: "CorpSmokeB2!",
      });
      ok("corp-portal: reset password", okHttp(reset.status) && reset.data?.ok === true, `status=${reset.status}`);
    } else {
      ok("corp-portal: reset password", false, "no devCode");
    }
  }
  {
    const r = await req("POST", "/portal/corporate/otp/request", { email: corpBEmail });
    const code = r.data?.devCode;
    ok("corp-portal: otp request", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
    if (code) {
      const v = await req("POST", "/portal/corporate/otp/verify", { email: corpBEmail, code });
      ok("corp-portal: otp verify", okHttp(v.status) && v.data?.ok === true, `status=${v.status}`);
    } else {
      ok("corp-portal: otp verify", false, "no devCode");
    }
  }
  {
    jar.delete("st_corporate");
    jar.delete("st_corporate_refresh");
    const r = await req("GET", "/portal/corporate/me");
    ok("corp-portal: staff cookie ≠ corporate", r.status === 401, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/corporate/logout");
    ok("corp-portal: logout", okHttp(r.status) || r.status === 201 || r.status === 200, `status=${r.status}`);
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
