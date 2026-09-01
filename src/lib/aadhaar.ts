import type { SessionDocument } from "@/lib/types";

// Same 12-digit format Phase 1's DocumentFieldSchemas/AadhaarMasker recognize. The masked form
// ("XXXX XXXX 1234") never matches this -- it's exactly 4 X's, a space, 4 X's, a space, 4 digits.
const RAW_AADHAAR = /^\d{4}\s?\d{4}\s?\d{4}$/;
const MASKED_AADHAAR = /^XXXX\s?XXXX\s?\d{4}$/;

/** Defense-in-depth check: Phase 1 masks Aadhaar numbers before they ever leave the device, but
 * the client is untrusted, so re-check server-side before anything reaches Postgres. */
export function looksLikeRawAadhaar(value: string): boolean {
  const trimmed = value.trim();
  if (MASKED_AADHAAR.test(trimmed)) return false;
  return RAW_AADHAAR.test(trimmed);
}

export function findRawAadhaarViolation(documents: SessionDocument[]): string | null {
  for (const doc of documents) {
    for (const field of doc.fields ?? []) {
      if (looksLikeRawAadhaar(field.displayValue)) {
        return `${doc.documentId}/${field.fieldKey}`;
      }
    }
  }
  return null;
}
