import { describe, expect, it } from "vitest";
import {
  emptyLine,
  journalLinesPayload,
  toPoisha,
  validateJournalLines,
  type JournalLineForm,
} from "@/lib/gl";

describe("gl helpers", () => {
  it("rejects unbalanced journals and builds payload", () => {
    const lines: JournalLineForm[] = [
      { ...emptyLine(), glAccountId: "a1", debitBdt: "1000" },
      { ...emptyLine(), glAccountId: "a2", creditBdt: "500" },
    ];
    expect(validateJournalLines(lines)).toMatch(/Unbalanced/);
    lines[1].creditBdt = "1000";
    expect(validateJournalLines(lines)).toBeNull();
    const payload = journalLinesPayload(lines);
    expect(payload).toHaveLength(2);
    expect(payload[0].debitPoisha).toBe(toPoisha("1000"));
    expect(payload[1].creditPoisha).toBe(100_000);
  });

  it("requires debit xor credit per line", () => {
    const lines: JournalLineForm[] = [
      { ...emptyLine(), glAccountId: "a1", debitBdt: "10", creditBdt: "10" },
      { ...emptyLine(), glAccountId: "a2", creditBdt: "10" },
    ];
    expect(validateJournalLines(lines)).toMatch(/either debit or credit/);
  });
});
