"use client";

import { useState } from "react";
import { Input } from "@/components/ui";

interface Row {
  id: number;
  fieldId: string;
  label: string;
}

interface ExistingField {
  id: string;
  display_label: string;
}

let nextId = 0;

/** Repeatable "expected field" rows, used by both the New and Edit Document Type forms. Each row
 * is a display label input plus a hidden field_id (empty for a brand-new field, the existing
 * document_type_fields.id when editing) -- the server action reads both back with
 * formData.getAll("field_id")/getAll("field_label") in lockstep to tell new fields apart from
 * edits to existing ones, and field_key is always slugified server-side, never here. */
export function DocTypeFieldRows({ initialFields = [] }: { initialFields?: ExistingField[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    initialFields.length > 0
      ? initialFields.map((f) => ({ id: nextId++, fieldId: f.id, label: f.display_label }))
      : [{ id: nextId++, fieldId: "", label: "" }],
  );

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={row.id} className="flex items-center gap-2">
          <input type="hidden" name="field_id" value={row.fieldId} />
          <Input
            name="field_label"
            defaultValue={row.label}
            placeholder={`Field ${i + 1} (e.g. License Number)`}
          />
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
              className="shrink-0 text-xs font-medium text-red-600 dark:text-red-400"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows((r) => [...r, { id: nextId++, fieldId: "", label: "" }])}
        className="rounded-lg border border-dashed border-zinc-300 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
      >
        + Add field
      </button>
    </div>
  );
}
