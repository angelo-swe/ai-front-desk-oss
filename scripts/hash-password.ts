// Generate a scrypt password hash for an AFD_TENANTS entry.
// Usage: bun scripts/hash-password.ts <password>
import { hashPassword } from "../src/lib/password";

const pw = process.argv[2];
if (!pw) {
  console.error("usage: bun scripts/hash-password.ts <password>");
  process.exit(1);
}
console.log(hashPassword(pw));
