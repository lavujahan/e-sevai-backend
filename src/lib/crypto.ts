import { randomBytes, createHash } from "crypto";

/** Generates a new plaintext staff API key. Shown to the admin exactly once (create/reset) --
 * only its hash is ever persisted, mirroring Phase 1's SecureSettingsStore keeping secrets out
 * of plaintext storage. */
export function generateApiKey(): string {
  return `esk_${randomBytes(24).toString("base64url")}`;
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}
