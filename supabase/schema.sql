-- e-Sevai Phase 2 schema (Supabase/Postgres)
-- Run in the Supabase SQL editor, or via `supabase db push` if using the CLI.

create extension if not exists pgcrypto;

create table if not exists centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references centers(id) on delete cascade,
  name text not null,
  role text not null default 'field_staff' check (role in ('field_staff','center_admin')),
  auth_user_id uuid references auth.users(id),
  api_key_hash text not null,
  api_key_last_reset_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists staff_center_id_idx on staff(center_id);
create unique index if not exists staff_api_key_hash_idx on staff(api_key_hash);

create table if not exists sessions (
  session_id text primary key,
  center_id uuid not null references centers(id),
  staff_id uuid not null references staff(id),
  citizen_display_name text,
  documents jsonb not null,
  field_index jsonb not null,
  code text,
  code_expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists sessions_center_id_idx on sessions(center_id);
create index if not exists sessions_created_at_idx on sessions(created_at desc);
create unique index if not exists sessions_code_idx on sessions(code) where code is not null;

create table if not exists document_templates (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null,
  layout_version int not null,
  fields jsonb not null,
  is_current boolean not null default true,
  last_verified timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by text not null default 'device' check (created_by in ('device','admin')),
  unique (doc_type, layout_version)
);
create unique index if not exists one_current_template_per_type
  on document_templates(doc_type) where is_current;

create table if not exists form_mappings (
  id uuid primary key default gen_random_uuid(),
  url_pattern text not null,
  url_hash text not null,
  label_fingerprint text not null,
  version int not null,
  fields jsonb not null,
  is_current boolean not null default true,
  last_verified timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (url_hash, version)
);
create unique index if not exists one_current_mapping_per_url
  on form_mappings(url_hash) where is_current;

create table if not exists ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('parse','match')),
  center_id uuid references centers(id),
  tokens_used int,
  estimated_cost numeric(10,4),
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_log_created_at_idx on ai_usage_log(created_at desc);
create index if not exists ai_usage_log_center_id_idx on ai_usage_log(center_id);

create table if not exists failure_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('extraction','match')),
  doc_type text,
  url_pattern text,
  field_key text,
  confidence real,
  center_id uuid references centers(id),
  session_id text references sessions(session_id),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists failure_log_resolved_idx on failure_log(resolved);
create index if not exists failure_log_created_at_idx on failure_log(created_at desc);

-- Admin-managed catalog of document types staff can tag a scan as, and the fields the Android app
-- should learn per type. Fetched by the Android app via GET /api/document-types and cached locally
-- (Room) so staff can keep scanning offline between syncs.
create table if not exists document_types (
  type_key text primary key,
  display_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists document_type_fields (
  id uuid primary key default gen_random_uuid(),
  type_key text not null references document_types(type_key) on delete cascade,
  field_key text not null,
  display_label text not null,
  sort_order int not null default 0,
  unique (type_key, field_key)
);
create index if not exists document_type_fields_type_key_idx on document_type_fields(type_key);

-- Singleton row of admin-tunable settings (System Settings screen).
create table if not exists app_settings (
  id int primary key default 1,
  confidence_threshold real not null default 0.7,
  session_code_expiry_minutes int not null default 10,
  feature_flags jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (id = 1)
);
insert into app_settings (id) values (1) on conflict (id) do nothing;

-- Atomic version-bump helpers (called via supabase.rpc from the API routes) -- supabase-js has
-- no client-side transaction API, so the "flip old is_current off, insert new row as current"
-- pair has to happen inside a single Postgres function to stay atomic under the partial unique
-- indexes above (one_current_template_per_type / one_current_mapping_per_url).
create or replace function upsert_template_version(
  p_doc_type text,
  p_fields jsonb,
  p_created_by text
) returns document_templates
language plpgsql
as $$
declare
  v_next_version int;
  v_row document_templates;
begin
  select coalesce(max(layout_version), 0) + 1 into v_next_version
  from document_templates where doc_type = p_doc_type;

  update document_templates set is_current = false
  where doc_type = p_doc_type and is_current = true;

  insert into document_templates (doc_type, layout_version, fields, is_current, created_by)
  values (p_doc_type, v_next_version, p_fields, true, p_created_by)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function reactivate_template_version(p_id uuid) returns void
language plpgsql
as $$
declare
  v_doc_type text;
begin
  select doc_type into v_doc_type from document_templates where id = p_id;
  if v_doc_type is null then
    raise exception 'template version not found';
  end if;
  update document_templates set is_current = false where doc_type = v_doc_type and is_current = true;
  update document_templates set is_current = true, last_verified = now() where id = p_id;
end;
$$;

create or replace function upsert_form_mapping_version(
  p_url_pattern text,
  p_url_hash text,
  p_label_fingerprint text,
  p_fields jsonb
) returns form_mappings
language plpgsql
as $$
declare
  v_next_version int;
  v_row form_mappings;
begin
  select coalesce(max(version), 0) + 1 into v_next_version
  from form_mappings where url_hash = p_url_hash;

  update form_mappings set is_current = false
  where url_hash = p_url_hash and is_current = true;

  insert into form_mappings (url_pattern, url_hash, label_fingerprint, version, fields, is_current)
  values (p_url_pattern, p_url_hash, p_label_fingerprint, v_next_version, p_fields, true)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function reactivate_form_mapping_version(p_id uuid) returns void
language plpgsql
as $$
declare
  v_url_hash text;
begin
  select url_hash into v_url_hash from form_mappings where id = p_id;
  if v_url_hash is null then
    raise exception 'form mapping version not found';
  end if;
  update form_mappings set is_current = false where url_hash = v_url_hash and is_current = true;
  update form_mappings set is_current = true, last_verified = now() where id = p_id;
end;
$$;

-- RLS: all access to these tables goes through Next.js server code using the Supabase
-- service-role key (API routes authenticate via the staff bearer key in lib/auth.ts; admin
-- panel pages authenticate via Supabase Auth + middleware). The service role bypasses RLS,
-- so enabling RLS here with no permissive policies simply blocks the anon/public key from
-- ever reading or writing these tables directly (defense-in-depth, not the primary gate).
alter table centers enable row level security;
alter table staff enable row level security;
alter table sessions enable row level security;
alter table document_templates enable row level security;
alter table form_mappings enable row level security;
alter table ai_usage_log enable row level security;
alter table failure_log enable row level security;
alter table app_settings enable row level security;
alter table document_types enable row level security;
alter table document_type_fields enable row level security;
