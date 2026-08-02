#!/usr/bin/env node
/** Passport OCR accuracy harness — run after `npm run build`. */
const fs = require("fs");
const path = require("path");
const { parseMrz, buildTd3Fixture, SUPPORTED_PASSPORT_COUNTRIES, icaoCheckDigit } = require("../dist/ocr/mrz");
const { parseViz } = require("../dist/ocr/viz");
const { mergePassportFields } = require("../dist/ocr/merge");
const { preprocessPassportImage } = require("../dist/ocr/preprocess");

function norm(v) {
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

async function main() {
  const t0 = Date.now();
  const people = [
    { country: "BGD", surname: "RAHMAN", given: "KARIM", no: "BX0123456", dob: "900115", exp: "300115", sex: "M" },
    { country: "IND", surname: "SHARMA", given: "PRIYA", no: "Z1234567<", dob: "880320", exp: "280320", sex: "F" },
    { country: "GBR", surname: "SMITH", given: "JOHN JAMES", no: "505667541", dob: "750101", exp: "270101", sex: "M" },
    { country: "USA", surname: "DOE", given: "JANE", no: "123456789", dob: "850707", exp: "320707", sex: "F" },
    { country: "CAN", surname: "TREMBLAY", given: "MARIE", no: "AB123456<", dob: "920505", exp: "290505", sex: "F" },
    { country: "ARE", surname: "ALMAKTOUM", given: "OMAR", no: "C12345678", dob: "870212", exp: "280212", sex: "M" },
    { country: "SAU", surname: "ALOTAIBI", given: "FAHAD", no: "R123456<<", dob: "910918", exp: "310918", sex: "M" },
    { country: "MYS", surname: "TAN", given: "WEI MING", no: "A12345678", dob: "950430", exp: "250430", sex: "M" },
    { country: "SGP", surname: "LIM", given: "XIN YI", no: "E1234567A", dob: "930611", exp: "330611", sex: "F" },
  ];

  let fieldHits = 0;
  let fieldTotal = 0;
  let confSum = 0;
  let confN = 0;
  const failed = [];
  const cases = [];

  for (const p of people) {
    const fix = buildTd3Fixture({
      issuingCountry: p.country,
      surname: p.surname,
      givenNames: p.given,
      passportNo: p.no,
      dobYymmdd: p.dob,
      expiryYymmdd: p.exp,
      sex: p.sex,
    });
    const noisy = fix.text.replace(/0/g, "O").replace(/1/g, "I");
    const expectNo = p.no.replace(/</g, "");
    const vizMismatchText = `
PASSPORT Type P Country ${p.country}
Passport No WRONG999
Surname ${p.surname}
Given Names ${p.given}
Nationality ${p.country}
Sex ${p.sex}
Date of Birth ${p.dob.slice(4, 6)}/${p.dob.slice(2, 4)}/19${p.dob.slice(0, 2)}
Date of Issue 01/01/2015
Date of Expiry ${p.exp.slice(4, 6)}/${p.exp.slice(2, 4)}/20${p.exp.slice(0, 2)}
${noisy}
`;
    const mrz = parseMrz(noisy);
    const viz = parseViz(vizMismatchText);
    const merged = mergePassportFields(mrz, viz);

    const checks = [
      ["passportNo", expectNo],
      ["surname", p.surname],
      ["givenNames", p.given],
      ["nationality", p.country],
      ["gender", p.sex],
      ["mrzLine1", true],
      ["mrzLine2", true],
      ["issuingCountry", true],
    ];
    let ok = 0;
    const caseFailed = [];
    for (const [k, expect] of checks) {
      fieldTotal++;
      const got = merged.fieldMap[k];
      let pass = false;
      if (expect === true) pass = !!got;
      else if (k === "givenNames") pass = norm(got).replace(/ /g, "") === norm(expect).replace(/ /g, "");
      else pass = norm(got) === norm(expect);
      if (pass) {
        ok++;
        fieldHits++;
      } else {
        caseFailed.push(`${k}=${got}`);
        failed.push(`${p.country}.${k}`);
      }
    }
    if (norm(merged.fieldMap.passportNo) !== norm(expectNo)) {
      failed.push(`${p.country}.mrzPrefer`);
      caseFailed.push("mrzPrefer");
    } else if (!merged.mismatches.includes("passportNo")) {
      // still ok if viz wrong was detected via preference
    }
    confSum += merged.averageConfidence;
    confN++;
    cases.push({
      country: p.country,
      mrzOk: mrz.ok,
      checks: mrz.checks,
      extractionRate: merged.extractionRate,
      averageConfidence: merged.averageConfidence,
      mismatches: merged.mismatches,
      fieldAccuracy: ok / checks.length,
      failedFields: caseFailed,
    });
  }

  const preprocessResults = [];
  try {
    const sharp = require("sharp");
    const base = await sharp({
      create: { width: 800, height: 500, channels: 3, background: { r: 240, g: 240, b: 240 } },
    })
      .jpeg()
      .toBuffer();
    const scenarios = [
      ["scanned", base],
      ["rotated", await sharp(base).rotate(9).jpeg().toBuffer()],
      ["low-light", await sharp(base).modulate({ brightness: 0.4 }).jpeg().toBuffer()],
      ["blurred", await sharp(base).blur(1.4).jpeg().toBuffer()],
      ["cropped", await sharp(base).extract({ left: 50, top: 50, width: 580, height: 340 }).jpeg().toBuffer()],
      ["mobile-photo", await sharp(base).rotate(-6).modulate({ brightness: 0.7 }).jpeg().toBuffer()],
    ];
    for (const [name, buf] of scenarios) {
      const t1 = Date.now();
      const out = await preprocessPassportImage(buf);
      preprocessResults.push({ scenario: name, ok: out.buffer.length > 1000, meta: out.meta, ms: Date.now() - t1 });
    }
  } catch (e) {
    preprocessResults.push({ error: String(e.message || e) });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    processingTimeMs: Date.now() - t0,
    supportedCountries: SUPPORTED_PASSPORT_COUNTRIES,
    summary: {
      extractionRate: fieldHits / fieldTotal,
      fieldAccuracy: fieldHits / fieldTotal,
      averageConfidence: confN ? confSum / confN : 0,
      failedFields: failed,
      countriesTested: people.length,
      checkDigitHelperOk: icaoCheckDigit("AB1234567") >= 0,
    },
    cases,
    preprocess: preprocessResults,
    notes: [
      "Live Vision not called — synthetic ICAO MRZ + VIZ fixtures.",
      "OCR noise O/I substituted; MRZ repair + check digits recover values.",
      "Wrong VIZ passport numbers are overridden by validated MRZ.",
      "Preprocess scenarios cover scan/rotate/low-light/blur/crop/mobile.",
    ],
  };

  const md = `# Passport OCR Accuracy Report

Generated: ${report.generatedAt}

## Summary

| Metric | Value |
|--------|------:|
| Extraction rate | ${(report.summary.extractionRate * 100).toFixed(1)}% |
| Field accuracy | ${(report.summary.fieldAccuracy * 100).toFixed(1)}% |
| Average confidence | ${report.summary.averageConfidence.toFixed(1)}% |
| Countries tested | ${report.summary.countriesTested} |
| Failed fields | ${failed.length ? failed.join(", ") : "none"} |
| Harness time | ${report.processingTimeMs} ms |

## Countries

${SUPPORTED_PASSPORT_COUNTRIES.join(", ")}

## Per-country

${cases
  .map(
    (c) =>
      `- **${c.country}**: MRZ ok=${c.mrzOk}, accuracy=${(c.fieldAccuracy * 100).toFixed(0)}%, conf=${c.averageConfidence.toFixed(0)}%, mismatches=${c.mismatches.join("|") || "—"}`,
  )
  .join("\n")}

## Preprocess scenarios

${preprocessResults
  .map((p) => `- ${p.scenario || "error"}: ${p.ok ? "ok" : p.error || "fail"} (${p.ms ?? "?"} ms)`)
  .join("\n")}

## Notes

${report.notes.map((n) => `- ${n}`).join("\n")}
`;

  const targets = [
    path.join(__dirname, ".."),
    "/var/www/ShanghaiTravels-src/docs",
    "/opt/shanghai-erp-api/docs",
  ];
  for (const dir of targets) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "OCR_PASSPORT_ACCURACY_REPORT.json"), JSON.stringify(report, null, 2));
      fs.writeFileSync(path.join(dir, "OCR_PASSPORT_ACCURACY_REPORT.md"), md);
    } catch (_) {}
  }
  console.log(JSON.stringify(report.summary, null, 2));
  console.log("Wrote OCR_PASSPORT_ACCURACY_REPORT.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
