import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffAuth, apiAuthErrorResponse } from "@/lib/auth";
import { getAppSettings } from "@/lib/settings";
import type { FormMappingField } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ urlHash: string }> },
) {
  try {
    await requireStaffAuth(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const { urlHash } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("form_mappings")
    .select("*")
    .eq("url_hash", urlHash)
    .eq("is_current", true)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "No mapping for this URL" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ urlHash: string }> },
) {
  try {
    await requireStaffAuth(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const settings = await getAppSettings();
  if (settings.feature_flags.form_mapping_ingestion_enabled === false) {
    return NextResponse.json(
      { error: "Form-mapping submissions are disabled by administrator" },
      { status: 403 },
    );
  }

  const { urlHash } = await params;
  const body = (await request.json()) as {
    urlPattern: string;
    labelFingerprint: string;
    fields: FormMappingField[];
  };
  if (!body.urlPattern || !body.labelFingerprint || !Array.isArray(body.fields)) {
    return NextResponse.json(
      { error: "urlPattern, labelFingerprint and fields are required" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .rpc("upsert_form_mapping_version", {
      p_url_pattern: body.urlPattern,
      p_url_hash: urlHash,
      p_label_fingerprint: body.labelFingerprint,
      p_fields: body.fields,
    })
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
