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
    .eq("is_current", true)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "No template for this document type/side" }, { status: 404 });
  }
  return NextResponse.json(data);
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
  const body = (await request.json()) as { side?: string; fields: TemplateField[] };
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
    })
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
