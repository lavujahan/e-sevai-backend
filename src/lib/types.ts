// Mirrors the Room entities in the Phase 1 Android app (core/data/db/entity) so the
// session JSON shape synced from the device needs no re-shaping on either side.

export type ExtractionSource = "TEMPLATE" | "AI" | "MANUAL" | "PENDING_AI";
export type ExtractionStatus = "PENDING" | "EXTRACTED" | "QUEUED_AI" | "FAILED";

export interface SessionField {
  fieldKey: string;
  displayValue: string;
  confidence: number;
  isUserCorrected: boolean;
}

export interface SessionDocument {
  documentId: string;
  documentTypeKey: string;
  capturedAt: number;
  extractionSource: ExtractionSource;
  extractionStatus: ExtractionStatus;
  fields: SessionField[];
}

export interface FieldIndexEntry {
  value: string;
  confidence: number;
  documentId: string;
}

export type FieldIndex = Record<string, FieldIndexEntry>;

export interface Center {
  id: string;
  name: string;
  location: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export type StaffRole = "field_staff" | "center_admin";

export interface Staff {
  id: string;
  center_id: string;
  name: string;
  role: StaffRole;
  auth_user_id: string | null;
  api_key_hash: string;
  api_key_last_reset_at: string;
  created_at: string;
}

export interface SessionRow {
  session_id: string;
  center_id: string;
  staff_id: string;
  citizen_display_name: string | null;
  documents: SessionDocument[];
  field_index: FieldIndex;
  code: string | null;
  code_expires_at: string | null;
  created_at: string;
}

export interface TemplateField {
  field_key: string;
  position_strategy: string;
  pattern_or_selector: string;
  confidence: number;
}

export interface DocumentTemplateRow {
  id: string;
  doc_type: string;
  layout_version: number;
  fields: TemplateField[];
  is_current: boolean;
  last_verified: string;
  created_at: string;
  created_by: "device" | "admin";
}

export interface FormMappingField {
  field_key: string;
  label_selector: string;
  data_key: string;
  confidence: number;
}

export interface FormMappingRow {
  id: string;
  url_pattern: string;
  url_hash: string;
  label_fingerprint: string;
  version: number;
  fields: FormMappingField[];
  is_current: boolean;
  last_verified: string;
  created_at: string;
}

export interface AiUsageLogRow {
  id: string;
  type: "parse" | "match";
  center_id: string | null;
  tokens_used: number | null;
  estimated_cost: number | null;
  created_at: string;
}

export interface FailureLogRow {
  id: string;
  kind: "extraction" | "match";
  doc_type: string | null;
  url_pattern: string | null;
  field_key: string | null;
  confidence: number | null;
  center_id: string | null;
  session_id: string | null;
  resolved: boolean;
  created_at: string;
}

export interface AppSettingsRow {
  id: 1;
  confidence_threshold: number;
  session_code_expiry_minutes: number;
  feature_flags: Record<string, boolean>;
  updated_at: string;
}
