import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffAuth, apiAuthErrorResponse } from "@/lib/auth";
import type { TemplateField } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ docType: string }> },
) {
  try {
    await requireStaffAuth(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const { docType } = await params;
  const side = new URL(request.url).searchParams.get("side") ?? "FRONT";
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("doc_type", docType)
    .eq("side", side)
    .eq("is_current", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No template for this document type/side" }, { status: 404 });
  }

  // One entry per variant group -- a doc_type+side can now have more than one genuinely different
  // physical layout learned fleet-wide, not just one "current" row.
  return NextResponse.json({
    variants: data.map((row) => ({
      variantGroupId: row.variant_group_id,
      layoutFingerprint: row.layout_fingerprint,
      layoutVersion: row.layout_version,
      fields: row.fields,
      lastVerified: row.last_verified,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ docType: string }> },
) {
  try {
    await requireStaffAuth(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const { docType } = await params;
  const body = (await request.json()) as {
    side?: string;
    fields: TemplateField[];
    fingerprint?: string | null;
    variantGroupId?: string | null;
  };
  if (!Array.isArray(body.fields)) {
    return NextResponse.json({ error: "fields is required" }, { status: 400 });
  }
  const side = body.side ?? "FRONT";

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .rpc("upsert_template_version", {
      p_doc_type: docType,
      p_side: side,
      p_fields: body.fields,
      p_created_by: "device",
      p_variant_group_id: body.variantGroupId ?? null,
      p_layout_fingerprint: body.fingerprint ?? null,
    })
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
