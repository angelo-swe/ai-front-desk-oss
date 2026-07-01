import { describe, expect, test } from "bun:test";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  test("verifies a correct password", () => {
    const h = hashPassword("s3cret-pw");
    expect(verifyPassword("s3cret-pw", h)).toBe(true);
  });

  test("rejects a wrong password", () => {
    const h = hashPassword("s3cret-pw");
    expect(verifyPassword("wrong", h)).toBe(false);
  });

  test("uses a random salt (no plaintext, distinct hashes)", () => {
    const a = hashPassword("same");
    const b = hashPassword("same");
    expect(a).not.toBe(b);
    expect(a).not.toContain("same");
    expect(verifyPassword("same", a)).toBe(true);
    expect(verifyPassword("same", b)).toBe(true);
  });

  test("rejects malformed stored values", () => {
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "nocolon")).toBe(false);
    expect(verifyPassword("x", "deadbeef:")).toBe(false);
  });
});
