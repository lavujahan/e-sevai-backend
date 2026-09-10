// Server-side-only Groq client for /api/match. Mirrors the request/response shape Phase 1's
// GroqRepository/GroqDtos.kt already use for the (image-based) parse call, but this is a
// text-only prompt: given a form's field labels and the citizen data keys available for this
// session, ask Groq to map one to the other.

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
// llama-3.1-8b-instant was decommissioned by Groq on 2026-08-16; this is
// their own recommended replacement for that exact use case (small/fast
// instant-tier chat model). See https://console.groq.com/docs/deprecations.
const MATCH_MODEL = "openai/gpt-oss-20b";

export interface FormFieldDescriptor {
  id: string;
  label: string;
  type: string;
  /** Only present when the extension's deterministic label detection found nothing at all for this field. */
  context?: string;
}

export interface FieldMatchResult {
  matches: { formFieldId: string; dataKey: string | null; confidence: number }[];
}

export interface GroqMatchCallResult {
  result: FieldMatchResult;
  tokensUsed: number | null;
}

export async function matchFormFields(
  formFields: FormFieldDescriptor[],
  availableDataKeys: string[],
  apiKey: string,
): Promise<GroqMatchCallResult> {
  // A field the extension's deterministic detection couldn't find any label
  // text for at all gets a "context" snippet instead (surrounding HTML) —
  // give the model that raw context to infer purpose from, rather than
  // just an empty label it has nothing to work with.
  const fieldList = formFields
    .map((f) => {
      const base = `- id=${f.id}, label="${f.label}", type=${f.type}`;
      return f.context ? `${base}, context=${JSON.stringify(f.context)}` : base;
    })
    .join("\n");
  const dataKeyList = availableDataKeys.map((k) => `- ${k}`).join("\n");

  // json_schema/strict mode is documented as supported by gpt-oss models but
  // is known to be unreliable in practice (Groq's own docs ask for repros;
  // community reports of it being silently ignored or 400ing under load).
  // json_object mode is the documented, broadly-compatible fallback: it
  // guarantees syntactically valid JSON but not schema conformance, so the
  // exact shape is spelled out in the prompt instead and validated below.
  const prompt = `A citizen service form has these fields:
${fieldList}

The citizen data on file has these keys available:
${dataKeyList}

For each form field, pick the single best-matching data key (or null if none fits) and a confidence 0-1.
Some fields have no label — use their "context" (surrounding HTML) to infer what the field represents instead.

Respond with ONLY a JSON object, no other text, matching exactly this shape:
{"matches": [{"formFieldId": "<the field's id, copied exactly>", "dataKey": "<a key from the list above, or null>", "confidence": <number 0-1>}]}
Include exactly one entry per form field listed above, in the same order.`;

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MATCH_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_completion_tokens: 1024,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status} ${await response.text()}`);
  }

  const body = await response.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no content");

  return {
    result: parseFieldMatchResult(content),
    tokensUsed: body.usage?.total_tokens ?? null,
  };
}

/**
 * json_object mode only guarantees valid JSON, not this specific shape, so
 * unlike the old strict-schema path this has to defensively validate and
 * normalize rather than trust JSON.parse's result directly. Malformed
 * entries are dropped rather than thrown on the whole response — the caller
 * (match/route.ts) already treats a low/absent match per field as normal.
 */
function parseFieldMatchResult(content: string): FieldMatchResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Groq did not return valid JSON");
  }

  const matches = (parsed as { matches?: unknown })?.matches;
  if (!Array.isArray(matches)) {
    throw new Error("Groq response was missing a 'matches' array");
  }

  const validMatches = matches.filter(
    (m): m is FieldMatchResult["matches"][number] =>
      typeof m === "object" &&
      m !== null &&
      typeof (m as Record<string, unknown>).formFieldId === "string" &&
      ((m as Record<string, unknown>).dataKey === null ||
        typeof (m as Record<string, unknown>).dataKey === "string") &&
      typeof (m as Record<string, unknown>).confidence === "number",
  );

  return { matches: validMatches };
}

export interface FieldRegexSuggestion {
  regex: string | null;
  confidence: number;
}

/** Given a custom document-type field's label + description, asks Groq whether the value follows
 * a checkable format and, if so, for a regex matching it -- e.g. "License Number" / "10-character
 * alphanumeric code" -> a pattern the app's REGEX_PATTERN local-matching strategy can use, the same
 * benefit built-in fields like Aadhaar/PAN already get from their hand-written regexes. Never
 * applied automatically -- the caller (the admin dashboard's "Suggest regex" action) always shows
 * this for review/edit before it's saved. */
export async function deriveFieldRegex(
  label: string,
  description: string,
  apiKey: string,
): Promise<FieldRegexSuggestion> {
  const prompt = `A form field is labeled "${label}"${description ? ` and described as: "${description}"` : ""}.

If this field's value follows a consistent, checkable format (e.g. a fixed-length number, a code with a known letter/digit pattern), give a single JavaScript-compatible regular expression (no leading/trailing slashes, no flags) that matches valid values. If the value is free-form text with no checkable format (like a name or address), the regex should be null.

Respond with ONLY a JSON object, no other text, matching exactly this shape:
{"regex": "<a JS-compatible regex pattern, or null>", "confidence": <number 0-1>}`;

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MATCH_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_completion_tokens: 256,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status} ${await response.text()}`);
  }

  const body = await response.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no content");

  return parseFieldRegexSuggestion(content);
}

/** Same defensive-parse rationale as parseFieldMatchResult -- json_object mode guarantees valid
 * JSON, not this specific shape. A malformed/missing regex just becomes null rather than throwing,
 * since the caller already treats "no format detected" as a normal outcome. */
function parseFieldRegexSuggestion(content: string): FieldRegexSuggestion {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Groq did not return valid JSON");
  }

  const obj = parsed as Record<string, unknown>;
  const regex = typeof obj.regex === "string" && obj.regex.trim() !== "" ? obj.regex : null;
  const confidence = typeof obj.confidence === "number" ? obj.confidence : 0;

  if (regex !== null) {
    try {
      new RegExp(regex);
    } catch {
      return { regex: null, confidence: 0 };
    }
  }

  return { regex, confidence };
}
