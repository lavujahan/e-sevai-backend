import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

/** Backward-compat shim for old bookmarked/linked URLs from before templates were split into
 * side + variant-group-scoped routes -- redirects to FRONT's oldest variant group (the closest
 * equivalent to what this URL used to show back when there was only ever one current row). */
export default async function TemplateDetailRedirectPage({
  params,
}: {
  params: Promise<{ docType: string }>;
}) {
  const { docType } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("document_templates")
    .select("side, variant_group_id, created_at")
    .eq("doc_type", docType)
    .order("side")
    .order("created_at")
    .limit(1);

  const target = data?.[0];
  if (!target) notFound();

  redirect(`/admin/learning/templates/${docType}/${target.side}/${target.variant_group_id}`);
}
