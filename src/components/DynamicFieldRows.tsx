"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui";

interface Row {
  id: number;
}

const STRATEGIES = ["LABEL_ANCHORED", "REGEX_PATTERN", "RELATIVE_POSITION"];

let nextId = 0;

/** Renders repeatable field-definition rows for the "New Template" form. Uses plain named
 * inputs (field_key[], position_strategy[], pattern_or_selector[], confidence[]) so the server
 * action can read them back with formData.getAll -- no client-side state is sent to the server,
 * only the rendered inputs. */
export function DynamicFieldRows() {
  const [rows, setRows] = useState<Row[]>(() => [{ id: nextId++ }, { id: nextId++ }]);

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <div key={row.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Field {i + 1}
            </span>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
                className="text-xs font-medium text-red-600 dark:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Input name="field_key" placeholder="field_key (e.g. full_name)" required />
            <Select name="position_strategy" defaultValue={STRATEGIES[0]}>
              {STRATEGIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input name="pattern_or_selector" placeholder="Pattern / anchor label text" />
            <Input
              name="confidence"
              type="number"
              step="0.05"
              min="0"
              max="1"
              defaultValue="1"
              placeholder="Confidence (0-1)"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows((r) => [...r, { id: nextId++ }])}
        className="rounded-lg border border-dashed border-zinc-300 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
      >
        + Add another field
      </button>
    </div>
  );
}
