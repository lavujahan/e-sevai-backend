import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffAuth, apiAuthErrorResponse } from "@/lib/auth";
import { matchFormFields, type FormFieldDescriptor } from "@/lib/groq";
import { getAppSettings } from "@/lib/settings";

interface MatchRequestBody {
  formFields: FormFieldDescriptor[];
  availableDataKeys: string[];
  urlPattern?: string;
}

export async function POST(request: Request) {
  let staff;
  try {
    staff = await requireStaffAuth(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const body = (await request.json()) as MatchRequestBody;
  if (!Array.isArray(body.formFields) || !Array.isArray(body.availableDataKeys)) {
    return NextResponse.json(
      { error: "formFields and availableDataKeys are required" },
      { status: 400 },
    );
  }

  const settings = await getAppSettings();
  // The admin-managed key (settings.groq_api_key) is the source of truth —
  // it's already what /api/staff/me ships to devices — with the env var
  // only as a fallback for deployments that haven't set it via the
  // dashboard yet.
  const apiKey = settings.groq_api_key ?? process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Groq API key is not configured" }, { status: 502 });
  }

  let matchResult;
  try {
    matchResult = await matchFormFields(body.formFields, body.availableDataKeys, apiKey);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Groq match failed" },
      { status: 502 },
    );
  }

  const supabase = createAdminClient();

  await supabase.from("ai_usage_log").insert({
    type: "match",
    center_id: staff.centerId,
    tokens_used: matchResult.tokensUsed,
    estimated_cost: null,
  });

  const lowConfidence = matchResult.result.matches.filter(
    (m) => m.confidence < settings.confidence_threshold,
  );
  if (lowConfidence.length > 0) {
    await supabase.from("failure_log").insert(
      lowConfidence.map((m) => ({
        kind: "match" as const,
        url_pattern: body.urlPattern ?? null,
        field_key: m.formFieldId,
        confidence: m.confidence,
        center_id: staff.centerId,
      })),
    );
  }

  return NextResponse.json(matchResult.result);
}
