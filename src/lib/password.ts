import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Password hashing with Node's built-in scrypt (no dependency). Stored format is
// "saltHex:hashHex". Verification is constant-time via timingSafeEqual.
// Never store or compare plaintext passwords. Generate hashes with
// `bun scripts/hash-password.ts <password>`.

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = (stored || "").split(":");
  if (!saltHex || !hashHex) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
