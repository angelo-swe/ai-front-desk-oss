import { describe, expect, test } from "bun:test";
import { deriveCallerName, maskPhone } from "./phone";

describe("maskPhone", () => {
  test("masks a 10-digit US number to the snapshot style", () => {
    expect(maskPhone("5551237098")).toBe("+1 ••• ••• 7098");
  });
  test("masks an 11-digit (+1) number", () => {
    expect(maskPhone("+1 555 123 7098")).toBe("+1 ••• ••• 7098");
    expect(maskPhone("15551237098")).toBe("+1 ••• ••• 7098");
  });
  test("preserves a multi-digit country code", () => {
    expect(maskPhone("+44 20 7946 0958")).toBe("+44 ••• ••• 0958");
  });
  test("never leaks more than the last 4 digits", () => {
    const masked = maskPhone("5551237098");
    expect(masked).not.toContain("555");
    expect(masked).not.toContain("123");
  });
  test("returns empty for missing/too-short input", () => {
    expect(maskPhone(null)).toBe("");
    expect(maskPhone(undefined)).toBe("");
    expect(maskPhone("")).toBe("");
    expect(maskPhone("12")).toBe("");
  });
});

describe("deriveCallerName", () => {
  test("uses a real contact name when present", () => {
    expect(deriveCallerName("Dustin K.", "5551237098")).toBe("Dustin K.");
  });
  test("trims whitespace-only names and falls back to phone", () => {
    expect(deriveCallerName("   ", "5551237098")).toBe("Caller ••7098");
  });
  test("falls back to a masked-phone label when name is null/empty", () => {
    expect(deriveCallerName(null, "5551237098")).toBe("Caller ••7098");
    expect(deriveCallerName("", "+15551237098")).toBe("Caller ••7098");
  });
  test("never returns the literal 'Unknown caller'", () => {
    expect(deriveCallerName(null, null)).toBe("Caller");
    expect(deriveCallerName(null, null)).not.toMatch(/unknown/i);
  });
});
