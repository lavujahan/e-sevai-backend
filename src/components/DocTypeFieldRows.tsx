"use client";

import { useState } from "react";
import { Input } from "@/components/ui";

interface Row {
  id: number;
}

let nextId = 0;

/** Repeatable "expected field" rows for the New Document Type form -- just a display label per
 * row (field_key[] is slugified server-side from it, same as the type's own key). Plain named
 * inputs so the server action can read them back with formData.getAll("field_label"). */
export function DocTypeFieldRows() {
  const [rows, setRows] = useState<Row[]>(() => [{ id: nextId++ }]);

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={row.id} className="flex items-center gap-2">
          <Input name="field_label" placeholder={`Field ${i + 1} (e.g. License Number)`} />
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
        onClick={() => setRows((r) => [...r, { id: nextId++ }])}
        className="rounded-lg border border-dashed border-zinc-300 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
      >
        + Add field
      </button>
    </div>
  );
}
