import type { FieldIndex, SessionDocument } from "@/lib/types";

/** Flattened key -> value lookup built from a session's documents, last document wins on a
 * fieldKey collision. Shared by POST /api/sessions (building it fresh) and the document-type
 * delete cascade (rebuilding it after stripping a document) so both use the identical rule. */
export function buildFieldIndex(documents: SessionDocument[]): FieldIndex {
  const index: FieldIndex = {};
  for (const doc of documents) {
    for (const field of doc.fields ?? []) {
      index[field.fieldKey] = {
        value: field.displayValue,
        confidence: field.confidence,
        documentId: doc.documentId,
      };
    }
  }
  return index;
}
