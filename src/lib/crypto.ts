import { randomInt, createHash } from "crypto";
import { WORDLIST } from "@/lib/wordlist";

const WORDS_PER_KEY = 5;

/** Generates a readable, diceware-style staff API key -- e.g. "shadow-marble-canyon-velvet-orbit"
 * -- easier to read off a screen and type into the Android app's Settings screen than an opaque
 * random string. 5 words from a ~1200-word list is ~51 bits of entropy: far stronger than a
 * typical password, though weaker than a long random token -- an acceptable tradeoff for a
 * manually-entered device credential. Shown to the admin exactly once (create/reset); only its
 * hash is ever persisted, mirroring Phase 1's SecureSettingsStore keeping secrets out of
 * plaintext storage. Admins can also set their own value instead (see lib/actions/staff.ts) --
 * this is only the suggested default. */
export function generateApiKey(): string {
  return Array.from({ length: WORDS_PER_KEY }, () => WORDLIST[randomInt(WORDLIST.length)]).join("-");
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}
