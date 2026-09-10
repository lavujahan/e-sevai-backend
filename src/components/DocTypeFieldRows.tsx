"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import { suggestFieldRegex } from "@/lib/actions/documentTypes";

interface Row {
  id: number;
  fieldId: string;
  label: string;
  description: string;
  regex: string;
  sensitive: boolean;
  suggestConfidence: number | null;
  suggesting: boolean;
  suggestError: string | null;
}

interface ExistingField {
  id: string;
  display_label: string;
  description?: string | null;
  format_regex?: string | null;
  sensitive?: boolean | null;
}

let nextId = 0;

function makeRow(f?: ExistingField): Row {
  return {
    id: nextId++,
    fieldId: f?.id ?? "",
    label: f?.display_label ?? "",
    description: f?.description ?? "",
    regex: f?.format_regex ?? "",
    sensitive: f?.sensitive ?? false,
    suggestConfidence: null,
    suggesting: false,
    suggestError: null,
  };
}

/** Repeatable "expected field" rows, used by both the New and Edit Document Type forms.
 *
 * Every document type gets the same full controls here (no document type is built-in): label, an
 * optional description (surfaced to the AI extraction prompt), an optional format regex with a
 * "Suggest regex" button that asks Groq for one from the label+description and fills it in for
 * review, a "sensitive" checkbox (drives masking on-device -- see FieldMaskingRules.kt), and
 * add/remove.
 *
 * The server action reads all five back in lockstep via formData.getAll("field_id")/
 * ("field_label")/("field_description")/("field_regex")/("field_sensitive"), matched by array
 * index, to tell new fields apart from edits to existing ones -- field_key is always slugified
 * server-side, never here. */
export function DocTypeFieldRows({ initialFields = [] }: { initialFields?: ExistingField[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    initialFields.length > 0 ? initialFields.map((f) => makeRow(f)) : [makeRow()],
  );

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function handleSuggest(rowId: number) {
    const row = rows.find((r) => r.id === rowId);
    if (!row || !row.label.trim()) return;
    updateRow(rowId, { suggesting: true, suggestError: null });
    const result = await suggestFieldRegex(row.label, row.description);
    if ("error" in result) {
      updateRow(rowId, { suggesting: false, suggestError: result.error });
    } else {
      updateRow(rowId, { suggesting: false, regex: result.regex ?? "", suggestConfidence: result.confidence });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <div key={row.id} className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <input type="hidden" name="field_id" value={row.fieldId} />
            <Input
              name="field_label"
              value={row.label}
              onChange={(e) => updateRow(row.id, { label: e.target.value })}
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
          <Input
            name="field_description"
            value={row.description}
            onChange={(e) => updateRow(row.id, { description: e.target.value })}
            placeholder='Optional description — helps AI extraction (e.g. "the 10-character code near the top-right")'
          />
          <div className="flex items-center gap-2">
            <Input
              name="field_regex"
              value={row.regex}
              onChange={(e) => updateRow(row.id, { regex: e.target.value })}
              placeholder="Format regex (optional — leave blank for free-form text)"
              className="font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => handleSuggest(row.id)}
              disabled={row.suggesting || !row.label.trim()}
              className="shrink-0 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs font-medium text-zinc-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              {row.suggesting ? "Suggesting…" : "Suggest regex"}
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input type="hidden" name="field_sensitive" value={row.sensitive ? "true" : "false"} />
            <input
              type="checkbox"
              checked={row.sensitive}
              onChange={(e) => updateRow(row.id, { sensitive: e.target.checked })}
              className="h-3.5 w-3.5"
            />
            Sensitive (mask this value, e.g. an ID number)
          </label>
          {row.suggestConfidence !== null && (
            <p
              className={`text-xs ${
                row.suggestConfidence >= 0.75 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              Suggested at {Math.round(row.suggestConfidence * 100)}% confidence — review before saving.
            </p>
          )}
          {row.suggestError && <p className="text-xs text-red-600 dark:text-red-400">{row.suggestError}</p>}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows((r) => [...r, makeRow()])}
        className="rounded-lg border border-dashed border-zinc-300 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
      >
        + Add field
      </button>
    </div>
  );
}
