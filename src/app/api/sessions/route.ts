import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffAuth, apiAuthErrorResponse } from "@/lib/auth";
import { findRawAadhaarViolation } from "@/lib/aadhaar";
import { generateSessionCode } from "@/lib/session-code";
import { getAppSettings } from "@/lib/settings";
import type { FieldIndex, SessionDocument } from "@/lib/types";

interface SessionPushBody {
  sessionId: string;
  citizenDisplayName?: string | null;
  documents: SessionDocument[];
}

function buildFieldIndex(documents: SessionDocument[]): FieldIndex {
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

export async function POST(request: Request) {
  let staff;
  try {
    staff = await requireStaffAuth(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const body = (await request.json()) as SessionPushBody;
  if (!body.sessionId || !Array.isArray(body.documents)) {
    return NextResponse.json({ error: "sessionId and documents are required" }, { status: 400 });
  }

  const violation = findRawAadhaarViolation(body.documents);
  if (violation) {
    return NextResponse.json(
      { error: `Unmasked Aadhaar-shaped value rejected at ${violation}` },
      { status: 400 },
    );
  }

  const settings = await getAppSettings();
  const supabase = createAdminClient();

  const code = generateSessionCode();
  const codeExpiresAt = new Date(
    Date.now() + settings.session_code_expiry_minutes * 60_000,
  ).toISOString();

  const { error: upsertError } = await supabase
    .from("sessions")
    .upsert(
      {
        session_id: body.sessionId,
        center_id: staff.centerId,
        staff_id: staff.staffId,
        citizen_display_name: body.citizenDisplayName ?? null,
        documents: body.documents,
        field_index: buildFieldIndex(body.documents),
        code,
        code_expires_at: codeExpiresAt,
      },
      { onConflict: "session_id" },
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const aiDocuments = body.documents.filter((d) => d.extractionSource === "AI");
  if (aiDocuments.length > 0) {
    await supabase.from("ai_usage_log").insert(
      aiDocuments.map(() => ({
        type: "parse" as const,
        center_id: staff.centerId,
        tokens_used: null,
        estimated_cost: null,
      })),
    );
  }

  const failures = body.documents.flatMap((doc) =>
    (doc.fields ?? [])
      .filter((f) => f.isUserCorrected || f.confidence < settings.confidence_threshold)
      .map((f) => ({
        kind: "extraction" as const,
        doc_type: doc.documentTypeKey,
        field_key: f.fieldKey,
        confidence: f.confidence,
        center_id: staff.centerId,
        session_id: body.sessionId,
      })),
  );
  if (failures.length > 0) {
    await supabase.from("failure_log").insert(failures);
  }

  return NextResponse.json({ code });
}
