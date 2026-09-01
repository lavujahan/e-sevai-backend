import { randomInt } from "crypto";

/** 6-digit handoff code: the Android app displays this after sync, staff key it into the
 * Phase 3 Chrome extension to pull that citizen's session data for form autofill. */
export function generateSessionCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
