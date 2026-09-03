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
  const fieldList = formFields.map((f) => `- id=${f.id}, label="${f.label}", type=${f.type}`).join("\n");
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
