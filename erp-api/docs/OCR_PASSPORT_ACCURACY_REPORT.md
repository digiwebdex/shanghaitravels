# Passport OCR Accuracy Report

Generated: 2026-08-02T19:42:24.468Z

## Summary

| Metric | Value |
|--------|------:|
| Extraction rate | 100.0% |
| Field accuracy | 100.0% |
| Average confidence | 94.3% |
| Countries tested | 9 |
| Failed fields | none |
| Harness time | 1229 ms |

## Countries

BGD, IND, GBR, USA, CAN, ARE, SAU, MYS, SGP

## Per-country

- **BGD**: MRZ ok=true, accuracy=100%, conf=94%, mismatches=passportNo
- **IND**: MRZ ok=true, accuracy=100%, conf=94%, mismatches=passportNo
- **GBR**: MRZ ok=true, accuracy=100%, conf=94%, mismatches=passportNo
- **USA**: MRZ ok=true, accuracy=100%, conf=94%, mismatches=passportNo
- **CAN**: MRZ ok=true, accuracy=100%, conf=94%, mismatches=passportNo
- **ARE**: MRZ ok=true, accuracy=100%, conf=94%, mismatches=passportNo
- **SAU**: MRZ ok=true, accuracy=100%, conf=94%, mismatches=passportNo
- **MYS**: MRZ ok=true, accuracy=100%, conf=94%, mismatches=passportNo
- **SGP**: MRZ ok=true, accuracy=100%, conf=94%, mismatches=passportNo

## Preprocess scenarios

- scanned: ok (218 ms)
- rotated: ok (243 ms)
- low-light: ok (188 ms)
- blurred: ok (158 ms)
- cropped: ok (78 ms)
- mobile-photo: ok (195 ms)

## Notes

- Live Vision not called — synthetic ICAO MRZ + VIZ fixtures.
- OCR noise O/I substituted; MRZ repair + check digits recover values.
- Wrong VIZ passport numbers are overridden by validated MRZ.
- Preprocess scenarios cover scan/rotate/low-light/blur/crop/mobile.
