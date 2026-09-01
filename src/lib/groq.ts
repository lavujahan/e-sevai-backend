// Server-side-only Groq client for /api/match. Mirrors the request/response shape Phase 1's
// GroqRepository/GroqDtos.kt already use for the (image-based) parse call, but this is a
// text-only prompt: given a form's field labels and the citizen data keys available for this
// session, ask Groq to map one to the other.

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const MATCH_MODEL = "llama-3.1-8b-instant";

export interface FormFieldDescriptor {
  id: string;
  label: string;
  type: string;
}

export interface FieldMatchResult {
  matches: { formFieldId: string; dataKey: string | null; confidence: number }[];
}

const matchJsonSchema = {
  type: "object",
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          formFieldId: { type: "string" },
          dataKey: { type: ["string", "null"] },
          confidence: { type: "number" },
        },
        required: ["formFieldId", "dataKey", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["matches"],
  additionalProperties: false,
};

export interface GroqMatchCallResult {
  result: FieldMatchResult;
  tokensUsed: number | null;
}

export async function matchFormFields(
  formFields: FormFieldDescriptor[],
  availableDataKeys: string[],
): Promise<GroqMatchCallResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const fieldList = formFields.map((f) => `- id=${f.id}, label="${f.label}", type=${f.type}`).join("\n");
  const dataKeyList = availableDataKeys.map((k) => `- ${k}`).join("\n");

  const prompt = `A citizen service form has these fields:\n${fieldList}\n\nThe citizen data on file has these keys available:\n${dataKeyList}\n\nFor each form field, pick the single best-matching data key (or null if none fits) and a confidence 0-1.`;

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
      response_format: {
        type: "json_schema",
        json_schema: { name: "field_match", strict: true, schema: matchJsonSchema },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status} ${await response.text()}`);
  }

  const body = await response.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no content");

  return {
    result: JSON.parse(content) as FieldMatchResult,
    tokensUsed: body.usage?.total_tokens ?? null,
  };
}
