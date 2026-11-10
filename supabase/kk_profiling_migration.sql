create table if not exists public.kk_import_batches (
  id uuid primary key default gen_random_uuid(),
  file_checksum text not null unique check (file_checksum ~ '^[0-9a-f]{64}$'),
  source_filename text not null,
  status text not null default 'staged'
    check (status in ('staged', 'imported', 'rolled_back', 'failed')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  summary jsonb not null default '{}'::jsonb
    check (jsonb_typeof(summary) = 'object')
);

create table if not exists public.kk_responses (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('google_form_legacy', 'portal')),
  source_record_id text,
  portal_application_id text,
  google_form_response_id text,
  import_batch_id uuid references public.kk_import_batches (id) on delete restrict,
  ref_number text not null unique,
  original_timestamp timestamptz,
  original_timestamp_raw text,
  status text not null default 'needs_review'
    check (status in ('pending', 'verified', 'needs_review', 'rejected')),
  needs_review boolean not null default false,
  review_notes text not null default '',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  first_name text not null default '',
  middle_name text not null default '',
  last_name text not null default '',
  email text,
  email_address text,
  email_account text,
  gender_identity text not null default '',
  age integer,
  birthday date,
  birthplace text not null default '',
  contact_number text not null default '',
  civil_status text not null default '',
  sitio_address text not null default '',
  sitio_other text not null default '',
  complete_address text not null default '',
  voter_status text not null default '',
  voted_last_sk_election text not null default '',
  sk_election_vote_count text not null default '',
  sk_election_vote_count_other text not null default '',
  national_voter text not null default '',
  precinct_number text not null default '',
  youth_classifications text[] not null default '{}',
  work_status text not null default '',
  educational_background text not null default '',
  source_payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(source_payload) = 'object'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  privacy_consent_at timestamptz,
  privacy_notice_version text,
  constraint kk_response_age_range check (age is null or age between 0 and 120)
);

create unique index if not exists kk_responses_source_record_id_uidx
  on public.kk_responses (source, source_record_id)
  where source_record_id is not null;

create unique index if not exists kk_responses_google_form_response_id_uidx
  on public.kk_responses (google_form_response_id)
  where google_form_response_id is not null;

create unique index if not exists kk_responses_portal_application_id_uidx
  on public.kk_responses (portal_application_id)
  where portal_application_id is not null;

create index if not exists kk_responses_status_created_idx
  on public.kk_responses (status, created_at desc);
create index if not exists kk_responses_source_created_idx
  on public.kk_responses (source, created_at desc);
create index if not exists kk_responses_age_idx
  on public.kk_responses (age);
create index if not exists kk_responses_birthday_idx
  on public.kk_responses (birthday);
create index if not exists kk_responses_sitio_idx
  on public.kk_responses (sitio_address);
create index if not exists kk_responses_categories_idx
  on public.kk_responses using gin (youth_classifications);

create table if not exists public.kk_import_rows (
  id bigint generated always as identity primary key,
  batch_id uuid not null references public.kk_import_batches (id) on delete cascade,
  source_row_number integer not null check (source_row_number > 1),
  source_response_id text,
  raw_data jsonb not null check (jsonb_typeof(raw_data) = 'object'),
  normalized_data jsonb not null check (jsonb_typeof(normalized_data) = 'object'),
  disposition text not null default 'staged'
    check (disposition in ('staged', 'inserted', 'skipped', 'flagged', 'rejected')),
  review_reasons text[] not null default '{}',
  response_id uuid references public.kk_responses (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (batch_id, source_row_number)
);

create index if not exists kk_import_rows_batch_disposition_idx
  on public.kk_import_rows (batch_id, disposition);

create table if not exists public.kk_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  response_id uuid references public.kk_responses (id) on delete set null,
  batch_id uuid references public.kk_import_batches (id) on delete set null,
  purpose text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists kk_audit_log_created_idx
  on public.kk_audit_log (created_at desc);
create index if not exists kk_audit_log_actor_created_idx
  on public.kk_audit_log (actor_id, created_at desc);

alter table public.kk_import_batches enable row level security;
alter table public.kk_responses enable row level security;
alter table public.kk_import_rows enable row level security;
alter table public.kk_audit_log enable row level security;

drop policy if exists "portal admins can manage KK import batches" on public.kk_import_batches;
create policy "portal admins can manage KK import batches"
  on public.kk_import_batches for all to authenticated
  using ((select public.is_portal_admin()))
  with check ((select public.is_portal_admin()));

drop policy if exists "portal admins can manage KK responses" on public.kk_responses;
create policy "portal admins can manage KK responses"
  on public.kk_responses for all to authenticated
  using ((select public.is_portal_admin()))
  with check ((select public.is_portal_admin()));

drop policy if exists "portal admins can manage KK import rows" on public.kk_import_rows;
create policy "portal admins can manage KK import rows"
  on public.kk_import_rows for all to authenticated
  using ((select public.is_portal_admin()))
  with check ((select public.is_portal_admin()));

drop policy if exists "portal admins can read KK audit log" on public.kk_audit_log;
create policy "portal admins can read KK audit log"
  on public.kk_audit_log for select to authenticated
  using ((select public.is_portal_admin()));

revoke all on public.kk_import_batches, public.kk_responses,
  public.kk_import_rows, public.kk_audit_log from anon;
grant select, insert, update, delete on public.kk_import_batches,
  public.kk_responses, public.kk_import_rows to authenticated;
grant select on public.kk_audit_log to authenticated;
grant all on public.kk_import_batches, public.kk_responses,
  public.kk_import_rows, public.kk_audit_log to service_role;
grant usage, select on sequence public.kk_import_rows_id_seq,
  public.kk_audit_log_id_seq to service_role;

create or replace function public.submit_kk_profile(p_profile jsonb)
returns table (application_id text, ref_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile jsonb := p_profile;
  app_id text;
  new_ref text;
  full_name text;
  service_name text;
  birth_date date;
  current_age integer;
  normalized_phone text;
  response_id uuid := gen_random_uuid();
  has_candidate_match boolean;
begin
  if coalesce(jsonb_typeof(profile), '') <> 'object'
    or octet_length(profile::text) > 20000 then
    raise exception 'Invalid KK profile.';
  end if;

  if coalesce(jsonb_typeof(profile -> 'age'), '') <> 'number'
    or (profile ->> 'age') !~ '^[0-9]{1,2}$'
    or (profile ->> 'age')::integer not between 15 and 30 then
    raise exception 'KK profiling is for youth ages 15 to 30.';
  end if;

  if coalesce(profile ->> 'birthday', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Enter a valid birthday.';
  end if;
  begin
    birth_date := (profile ->> 'birthday')::date;
  exception when others then
    raise exception 'Enter a valid birthday.';
  end;
  current_age := date_part('year', age(current_date, birth_date))::integer;
  if current_age <> (profile ->> 'age')::integer then
    raise exception 'The age does not match the birthday.';
  end if;

  normalized_phone := regexp_replace(
    coalesce(profile ->> 'contactNumber', ''),
    '[[:space:]-]',
    '',
    'g'
  );
  if coalesce(profile ->> 'email', '') !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or normalized_phone !~ '^(09[0-9]{9}|\+639[0-9]{9})$' then
    raise exception 'Enter a valid email address and Philippine mobile number.';
  end if;
  if coalesce(jsonb_typeof(profile -> 'youthClassifications'), '') <> 'array' then
    raise exception 'Choose at least one valid youth classification.';
  end if;
  if jsonb_array_length(profile -> 'youthClassifications') = 0
    or exists (
      select 1
      from jsonb_array_elements_text(profile -> 'youthClassifications') as item(value)
      where item.value not in (
        'In School Youth',
        'Out of School Youth',
        'Working Youth',
        'Youth w/ Special Needs (PWD)',
        'Single/Solo Parent Youth'
      )
    ) then
    raise exception 'Choose at least one valid youth classification.';
  end if;
  if profile ->> 'privacyConsent' is distinct from 'true' then
    raise exception 'Data privacy consent is required.';
  end if;
  if exists (
    select 1
    from unnest(array[
      'firstName', 'lastName', 'genderIdentity', 'birthplace', 'civilStatus',
      'sitioAddress', 'completeAddress', 'voterStatus', 'votedLastSkElection',
      'skElectionVoteCount', 'nationalVoter', 'workStatus',
      'educationalBackground'
    ]) as field(key)
    where length(trim(coalesce(profile ->> field.key, ''))) = 0
  ) then
    raise exception 'Complete all required KK profile fields.';
  end if;
  if profile ->> 'skElectionVoteCount' not in ('1', '2', '3', '4', '5', 'Iba pa:') then
    raise exception 'Choose a valid SK election vote count.';
  end if;
  if profile ->> 'genderIdentity' not in (
    'MALE', 'FEMALE', 'GAY', 'LESBIAN', 'BISEXUAL', 'Prefer not to say'
  ) then
    raise exception 'Choose a valid gender identity.';
  end if;
  if profile ->> 'civilStatus' not in (
    'SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED', 'SEPARATED', 'ANNUALLED', 'LIVE IN'
  ) then
    raise exception 'Choose a valid civil status.';
  end if;
  if profile ->> 'workStatus' not in (
    'Employed', 'Unemployed', 'Self-Employed',
    'Currently looking for a job / 1st time job seeker', 'Not Interested'
  ) then
    raise exception 'Choose a valid work status.';
  end if;
  if profile ->> 'educationalBackground' not in (
    'Elementary Level', 'Elementary Graduate', 'Highschool Level', 'Highschool Graduate',
    'Senior Highschool Level', 'Senior Highschool Graduate', 'College Level',
    'College Graduate', 'Vocational Graduate', 'ALS Level', 'ALS Graduate'
  ) then
    raise exception 'Choose a valid educational background.';
  end if;
  if profile ->> 'voterStatus' not in ('Voter', 'Resident Only', 'Voter & Resident')
    or profile ->> 'votedLastSkElection' not in ('Yes', 'No')
    or profile ->> 'nationalVoter' not in ('YES', 'NO') then
    raise exception 'Choose valid voter profile options.';
  end if;
  if profile ->> 'sitioAddress' = 'Iba pa:'
    and length(trim(coalesce(profile ->> 'sitioOther', ''))) = 0 then
    raise exception 'Enter your street or sitio.';
  end if;
  if profile ->> 'skElectionVoteCount' = 'Iba pa:'
    and length(trim(coalesce(profile ->> 'skElectionVoteCountOther', ''))) = 0 then
    raise exception 'Enter the number of SK elections.';
  end if;

  select data ->> 'name'
    into service_name
    from public.portal_records
    where collection = 'services'
      and data ->> 'isActive' = 'true'
      and data ->> 'name' ilike '%profil%'
    order by id
    limit 1;
  if service_name is null then
    raise exception 'KK profiling is currently unavailable.';
  end if;

  has_candidate_match := exists (
    select 1
    from public.kk_responses existing
    where lower(existing.email) = lower(trim(profile ->> 'email'))
      or regexp_replace(existing.contact_number, '[[:space:]-]', '', 'g') = normalized_phone
      or (
        lower(trim(existing.first_name)) = lower(trim(profile ->> 'firstName'))
        and lower(trim(existing.last_name)) = lower(trim(profile ->> 'lastName'))
        and existing.birthday = birth_date
      )
  );
  full_name := trim(concat_ws(' ',
    nullif(trim(profile ->> 'firstName'), ''),
    nullif(trim(profile ->> 'middleName'), ''),
    nullif(trim(profile ->> 'lastName'), '')
  ));
  app_id := 'app-' || gen_random_uuid()::text;
  new_ref := 'KK-' || upper(replace(gen_random_uuid()::text, '-', ''));

  insert into public.portal_records (collection, id, data)
  values (
    'applications',
    app_id,
    jsonb_build_object(
      'id', app_id,
      'refNumber', new_ref,
      'applicantName', full_name,
      'age', (profile ->> 'age')::integer,
      'birthday', birth_date,
      'gender', profile ->> 'genderIdentity',
      'sitio', case
        when profile ->> 'sitioAddress' = 'Iba pa:' then trim(profile ->> 'sitioOther')
        else profile ->> 'sitioAddress'
      end,
      'address', trim(profile ->> 'completeAddress'),
      'contactNumber', normalized_phone,
      'email', lower(trim(profile ->> 'email')),
      'serviceType', service_name,
      'details', 'Katipunan ng Kabataan profiling form submission.',
      'kkProfile', profile || jsonb_build_object(
        'email', lower(trim(profile ->> 'email')),
        'contactNumber', normalized_phone
      ) - 'privacyConsent',
      'dataPrivacyConsent', true,
      'privacyConsentAt', now(),
      'googleSyncStatus', 'Pending',
      'status', 'Pending',
      'submittedAt', now(),
      'adminNotes', '',
      'documentsAttached', '[]'::jsonb
    )
  );

  insert into public.kk_responses (
    id, source, source_record_id, portal_application_id, ref_number, status,
    needs_review, privacy_consent_at, privacy_notice_version,
    first_name, middle_name, last_name, email, gender_identity, age, birthday,
    birthplace, contact_number, civil_status, sitio_address, sitio_other,
    complete_address, voter_status, voted_last_sk_election,
    sk_election_vote_count, sk_election_vote_count_other, national_voter,
    precinct_number, youth_classifications, work_status, educational_background,
    source_payload
  )
  values (
    response_id, 'portal', app_id, app_id, new_ref,
    case when has_candidate_match then 'needs_review' else 'pending' end,
    has_candidate_match, now(), coalesce(profile ->> 'privacyNoticeVersion', 'kk-2026-01'),
    trim(profile ->> 'firstName'), trim(coalesce(profile ->> 'middleName', '')),
    trim(profile ->> 'lastName'), lower(trim(profile ->> 'email')),
    trim(profile ->> 'genderIdentity'), (profile ->> 'age')::integer, birth_date,
    trim(profile ->> 'birthplace'), normalized_phone,
    trim(profile ->> 'civilStatus'), trim(profile ->> 'sitioAddress'),
    trim(coalesce(profile ->> 'sitioOther', '')), trim(profile ->> 'completeAddress'),
    trim(profile ->> 'voterStatus'), trim(profile ->> 'votedLastSkElection'),
    trim(profile ->> 'skElectionVoteCount'), trim(coalesce(profile ->> 'skElectionVoteCountOther', '')),
    trim(profile ->> 'nationalVoter'), trim(coalesce(profile ->> 'precinctNumber', '')),
    array(select jsonb_array_elements_text(profile -> 'youthClassifications')),
    trim(profile ->> 'workStatus'), trim(profile ->> 'educationalBackground'),
    profile
  );

  insert into public.kk_audit_log (action, response_id, metadata)
  values (
    case when has_candidate_match then 'public_registration_flagged' else 'public_registration_submitted' end,
    response_id,
    jsonb_build_object('source', 'portal', 'possible_duplicate', has_candidate_match)
  );

  return query select app_id, new_ref;
end;
$$;

revoke all on function public.submit_kk_profile(jsonb) from public, anon, authenticated;
grant execute on function public.submit_kk_profile(jsonb) to service_role;

create or replace function public.check_kk_registration_status(
  p_ref_number text,
  p_identifier text
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select response.status
    from public.kk_responses as response
    where upper(response.ref_number) = upper(trim(p_ref_number))
      and (
        lower(response.email) = lower(trim(p_identifier))
        or regexp_replace(response.contact_number, '[[:space:]-]', '', 'g')
          = regexp_replace(trim(p_identifier), '[[:space:]-]', '', 'g')
      )
    limit 1
  ), 'not_found');
$$;

revoke all on function public.check_kk_registration_status(text, text)
  from public, anon, authenticated;
grant execute on function public.check_kk_registration_status(text, text)
  to service_role;

create or replace function public.create_kk_import_batch(
  p_file_checksum text,
  p_source_filename text,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  batch_id uuid;
begin
  if p_file_checksum !~ '^[0-9a-f]{64}$'
    or length(trim(coalesce(p_source_filename, ''))) = 0 then
    raise exception 'Invalid import batch metadata.';
  end if;
  if p_created_by is null or not exists (
    select 1 from public.admin_users where user_id = p_created_by
  ) then
    raise exception 'An authorized administrator is required.';
  end if;

  insert into public.kk_import_batches (
    file_checksum, source_filename, created_by
  )
  values (p_file_checksum, p_source_filename, p_created_by)
  on conflict (file_checksum) do update
    set file_checksum = excluded.file_checksum
  returning id into batch_id;

  return batch_id;
end;
$$;

revoke all on function public.create_kk_import_batch(text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_kk_import_batch(text, text, uuid)
  to service_role;

create or replace function public.stage_kk_import_rows(
  p_batch_id uuid,
  p_rows jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  staged_count integer;
begin
  if coalesce(jsonb_typeof(p_rows), '') <> 'array' then
    raise exception 'Import chunks must contain between 1 and 250 rows.';
  end if;
  if jsonb_array_length(p_rows) = 0 or jsonb_array_length(p_rows) > 250 then
    raise exception 'Import chunks must contain between 1 and 250 rows.';
  end if;
  if not exists (
    select 1 from public.kk_import_batches
    where id = p_batch_id and status = 'staged'
  ) then
    raise exception 'The import batch is not available for staging.';
  end if;

  insert into public.kk_import_rows (
    batch_id, source_row_number, source_response_id, raw_data,
    normalized_data, review_reasons
  )
  select
    p_batch_id,
    (item ->> 'source_row_number')::integer,
    nullif(item ->> 'source_response_id', ''),
    item -> 'raw_data',
    item -> 'normalized_data',
    array(select jsonb_array_elements_text(item -> 'review_reasons'))
  from jsonb_array_elements(p_rows) as row(item)
  on conflict (batch_id, source_row_number) do nothing;

  get diagnostics staged_count = row_count;
  return staged_count;
end;
$$;

revoke all on function public.stage_kk_import_rows(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.stage_kk_import_rows(uuid, jsonb)
  to service_role;

create or replace function public.finalize_kk_import_batch(p_batch_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  staged_row record;
  new_response_id uuid;
  new_ref text;
  candidate_match boolean;
  inserted_count integer := 0;
  flagged_count integer := 0;
  skipped_count integer := 0;
  rejected_count integer := 0;
begin
  if not exists (
    select 1 from public.kk_import_batches
    where id = p_batch_id and status = 'staged'
  ) then
    raise exception 'The import batch is not available for finalization.';
  end if;

  for staged_row in
    select * from public.kk_import_rows
    where batch_id = p_batch_id and disposition = 'staged'
    order by source_row_number
    for update
  loop
    if staged_row.source_response_id is not null and exists (
      select 1 from public.kk_responses
      where google_form_response_id = staged_row.source_response_id
    ) then
      update public.kk_import_rows
      set disposition = 'skipped'
      where id = staged_row.id;
      skipped_count := skipped_count + 1;
      continue;
    end if;

    candidate_match := exists (
      select 1
      from public.kk_responses existing
      where (
        nullif(trim(staged_row.normalized_data ->> 'first_name'), '') is not null
        and lower(trim(existing.first_name)) = lower(trim(staged_row.normalized_data ->> 'first_name'))
        and lower(trim(existing.last_name)) = lower(trim(staged_row.normalized_data ->> 'last_name'))
        and existing.birthday = nullif(staged_row.normalized_data ->> 'birthday', '')::date
      )
      or (
        nullif(staged_row.normalized_data ->> 'email', '') is not null
        and lower(existing.email) = lower(staged_row.normalized_data ->> 'email')
      )
      or (
        nullif(staged_row.normalized_data ->> 'contact_number', '') is not null
        and regexp_replace(existing.contact_number, '[[:space:]-]', '', 'g')
          = regexp_replace(staged_row.normalized_data ->> 'contact_number', '[[:space:]-]', '', 'g')
      )
    );

    new_response_id := gen_random_uuid();
    new_ref := 'KK-' || upper(replace(gen_random_uuid()::text, '-', ''));

    insert into public.kk_responses (
      id, source, source_record_id, google_form_response_id, import_batch_id,
      ref_number, original_timestamp, original_timestamp_raw, status, needs_review,
      first_name, middle_name, last_name, email, email_address, email_account,
      gender_identity, age, birthday, birthplace, contact_number, civil_status,
      sitio_address, sitio_other, complete_address, voter_status,
      voted_last_sk_election, sk_election_vote_count, sk_election_vote_count_other,
      national_voter, precinct_number, youth_classifications, work_status,
      educational_background, source_payload
    )
    values (
      new_response_id, 'google_form_legacy',
      'sha256:' || (select file_checksum from public.kk_import_batches where id = p_batch_id)
        || ':' || staged_row.source_row_number::text,
      staged_row.source_response_id, p_batch_id, new_ref,
      nullif(staged_row.normalized_data ->> 'original_timestamp', '')::timestamptz,
      nullif(staged_row.normalized_data ->> 'original_timestamp_raw', ''),
      'needs_review', true,
      coalesce(staged_row.normalized_data ->> 'first_name', ''),
      coalesce(staged_row.normalized_data ->> 'middle_name', ''),
      coalesce(staged_row.normalized_data ->> 'last_name', ''),
      nullif(staged_row.normalized_data ->> 'email', ''),
      nullif(staged_row.normalized_data ->> 'email_address', ''),
      nullif(staged_row.normalized_data ->> 'email_account', ''),
      coalesce(staged_row.normalized_data ->> 'gender_identity', ''),
      case when staged_row.normalized_data ->> 'age' ~ '^[0-9]{1,3}$'
        then (staged_row.normalized_data ->> 'age')::integer else null end,
      case when staged_row.normalized_data ->> 'birthday' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        then (staged_row.normalized_data ->> 'birthday')::date else null end,
      coalesce(staged_row.normalized_data ->> 'birthplace', ''),
      coalesce(staged_row.normalized_data ->> 'contact_number', ''),
      coalesce(staged_row.normalized_data ->> 'civil_status', ''),
      coalesce(staged_row.normalized_data ->> 'sitio_address', ''),
      coalesce(staged_row.normalized_data ->> 'sitio_other', ''),
      coalesce(staged_row.normalized_data ->> 'complete_address', ''),
      coalesce(staged_row.normalized_data ->> 'voter_status', ''),
      coalesce(staged_row.normalized_data ->> 'voted_last_sk_election', ''),
      coalesce(staged_row.normalized_data ->> 'sk_election_vote_count', ''),
      coalesce(staged_row.normalized_data ->> 'sk_election_vote_count_other', ''),
      coalesce(staged_row.normalized_data ->> 'national_voter', ''),
      coalesce(staged_row.normalized_data ->> 'precinct_number', ''),
      coalesce(array(
        select jsonb_array_elements_text(
          coalesce(staged_row.normalized_data -> 'youth_classifications', '[]'::jsonb)
        )
      ), '{}'),
      coalesce(staged_row.normalized_data ->> 'work_status', ''),
      coalesce(staged_row.normalized_data ->> 'educational_background', ''),
      staged_row.raw_data
    )
    on conflict do nothing
    returning id into new_response_id;

    if new_response_id is null then
      update public.kk_import_rows
      set disposition = 'skipped'
      where id = staged_row.id;
      skipped_count := skipped_count + 1;
      continue;
    end if;

    if candidate_match or cardinality(staged_row.review_reasons) > 0 then
      update public.kk_import_rows
      set disposition = 'flagged', response_id = new_response_id
      where id = staged_row.id;
      flagged_count := flagged_count + 1;
    else
      update public.kk_import_rows
      set disposition = 'inserted', response_id = new_response_id
      where id = staged_row.id;
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  update public.kk_import_batches
  set status = 'imported',
      completed_at = now(),
      summary = jsonb_build_object(
        'source_rows', (select count(*) from public.kk_import_rows where batch_id = p_batch_id),
        'inserted', inserted_count,
        'flagged', flagged_count,
        'skipped', skipped_count,
        'rejected', rejected_count
      )
  where id = p_batch_id;

  insert into public.kk_audit_log (actor_id, action, batch_id, metadata)
  select created_by, 'legacy_import_finalized', p_batch_id,
    jsonb_build_object(
      'inserted', inserted_count,
      'flagged', flagged_count,
      'skipped', skipped_count,
      'rejected', rejected_count
    )
  from public.kk_import_batches
  where id = p_batch_id;

  return jsonb_build_object(
    'inserted', inserted_count,
    'flagged', flagged_count,
    'skipped', skipped_count,
    'rejected', rejected_count
  );
end;
$$;

revoke all on function public.finalize_kk_import_batch(uuid)
  from public, anon, authenticated;
grant execute on function public.finalize_kk_import_batch(uuid)
  to service_role;

create or replace function public.rollback_kk_import_batch(p_batch_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed_count integer;
  changed_count integer;
begin
  if not exists (
    select 1 from public.kk_import_batches
    where id = p_batch_id and status = 'imported'
  ) then
    raise exception 'Only an imported batch can be rolled back.';
  end if;

  select count(*) into changed_count
  from public.kk_responses response
  join public.kk_import_rows row on row.response_id = response.id
  where row.batch_id = p_batch_id
    and row.disposition in ('inserted', 'flagged')
    and (
      response.updated_at > response.created_at
      or response.status <> 'needs_review'
      or response.reviewed_at is not null
    );
  if changed_count > 0 then
    raise exception 'Rollback blocked: one or more batch records have been reviewed or changed.';
  end if;

  delete from public.kk_responses response
  using public.kk_import_rows row
  where row.batch_id = p_batch_id
    and row.response_id = response.id
    and row.disposition in ('inserted', 'flagged')
    and response.import_batch_id = p_batch_id;
  get diagnostics removed_count = row_count;

  update public.kk_import_rows
  set disposition = 'skipped', response_id = null
  where batch_id = p_batch_id and disposition in ('inserted', 'flagged');
  update public.kk_import_batches
  set status = 'rolled_back', completed_at = now(),
      summary = summary || jsonb_build_object('rolled_back', removed_count)
  where id = p_batch_id;
  insert into public.kk_audit_log (actor_id, action, batch_id, metadata)
  select created_by, 'legacy_import_rolled_back', p_batch_id,
    jsonb_build_object('removed', removed_count)
  from public.kk_import_batches
  where id = p_batch_id;

  return jsonb_build_object('removed', removed_count);
end;
$$;

revoke all on function public.rollback_kk_import_batch(uuid)
  from public, anon, authenticated;
grant execute on function public.rollback_kk_import_batch(uuid)
  to service_role;

create or replace function public.audit_kk_response_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_fields jsonb;
begin
  select coalesce(jsonb_agg(new_field.key), '[]'::jsonb)
    into changed_fields
    from jsonb_each(to_jsonb(new)) as new_field(key, value)
    join jsonb_each(to_jsonb(old)) as old_field(key, value)
      on old_field.key = new_field.key
    where new_field.value is distinct from old_field.value;

  insert into public.kk_audit_log (actor_id, action, response_id, metadata)
  values (
    (select auth.uid()),
    'response_updated',
    new.id,
    jsonb_build_object(
      'old_status', old.status,
      'new_status', new.status,
      'old_needs_review', old.needs_review,
      'new_needs_review', new.needs_review,
      'changed_fields', changed_fields
    )
  );
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists kk_response_update_audit on public.kk_responses;
create trigger kk_response_update_audit
  before update on public.kk_responses
  for each row execute function public.audit_kk_response_update();

revoke all on function public.audit_kk_response_update() from public, anon, authenticated;
grant execute on function public.audit_kk_response_update() to service_role;

insert into public.kk_responses (
  source, source_record_id, portal_application_id, ref_number, status, needs_review,
  first_name, middle_name, last_name, email, gender_identity, age, birthday,
  birthplace, contact_number, civil_status, sitio_address, sitio_other,
  complete_address, voter_status, voted_last_sk_election,
  sk_election_vote_count, sk_election_vote_count_other, national_voter,
  precinct_number, youth_classifications, work_status, educational_background,
  source_payload, original_timestamp, created_at
)
select
  'portal',
  record.id,
  record.id,
  record.data ->> 'refNumber',
  'needs_review',
  true,
  coalesce(record.data -> 'kkProfile' ->> 'firstName', ''),
  coalesce(record.data -> 'kkProfile' ->> 'middleName', ''),
  coalesce(record.data -> 'kkProfile' ->> 'lastName', ''),
  nullif(record.data -> 'kkProfile' ->> 'email', ''),
  coalesce(record.data -> 'kkProfile' ->> 'genderIdentity', ''),
  case when record.data -> 'kkProfile' ->> 'age' ~ '^[0-9]{1,3}$'
    then (record.data -> 'kkProfile' ->> 'age')::integer else null end,
  case when record.data -> 'kkProfile' ->> 'birthday' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    then (record.data -> 'kkProfile' ->> 'birthday')::date else null end,
  coalesce(record.data -> 'kkProfile' ->> 'birthplace', ''),
  coalesce(record.data -> 'kkProfile' ->> 'contactNumber', ''),
  coalesce(record.data -> 'kkProfile' ->> 'civilStatus', ''),
  coalesce(record.data -> 'kkProfile' ->> 'sitioAddress', ''),
  coalesce(record.data -> 'kkProfile' ->> 'sitioOther', ''),
  coalesce(record.data -> 'kkProfile' ->> 'completeAddress', ''),
  coalesce(record.data -> 'kkProfile' ->> 'voterStatus', ''),
  coalesce(record.data -> 'kkProfile' ->> 'votedLastSkElection', ''),
  coalesce(record.data -> 'kkProfile' ->> 'skElectionVoteCount', ''),
  coalesce(record.data -> 'kkProfile' ->> 'skElectionVoteCountOther', ''),
  coalesce(record.data -> 'kkProfile' ->> 'nationalVoter', ''),
  coalesce(record.data -> 'kkProfile' ->> 'precinctNumber', ''),
  coalesce(array(
    select jsonb_array_elements_text(
      coalesce(record.data -> 'kkProfile' -> 'youthClassifications', '[]'::jsonb)
    )
  ), '{}'),
  coalesce(record.data -> 'kkProfile' ->> 'workStatus', ''),
  coalesce(record.data -> 'kkProfile' ->> 'educationalBackground', ''),
  record.data,
  case
    when record.data ->> 'submittedAt' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
      then (record.data ->> 'submittedAt')::timestamptz
    else null
  end,
  coalesce(record.created_at, now())
from public.portal_records as record
where record.collection = 'applications'
  and record.data ? 'kkProfile'
  and jsonb_typeof(record.data -> 'kkProfile') = 'object'
  and nullif(record.data ->> 'refNumber', '') is not null
on conflict do nothing;

comment on table public.kk_responses is
  'Restricted KK profile records. Public access is provided only through server-validated functions.';
comment on table public.kk_import_rows is
  'Restricted raw staging rows for approved KK imports; contains sensitive personal data.';

create or replace function public.get_kk_responses(
  p_status text default null,
  p_search text default '',
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (response jsonb, total_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_search text := lower(trim(coalesce(p_search, '')));
  matched_count bigint;
begin
  if not (select public.is_portal_admin()) then
    raise exception 'Administrator access is required.';
  end if;
  if p_status is not null and p_status not in ('pending', 'verified', 'needs_review', 'rejected') then
    raise exception 'Invalid KK response status filter.';
  end if;
  if length(normalized_search) > 100
    or p_limit not between 1 and 100
    or p_offset < 0
    or p_offset > 10000 then
    raise exception 'Invalid KK response query.';
  end if;

  select count(*)
    into matched_count
    from public.kk_responses as r
    where (p_status is null or r.status = p_status)
      and (
        normalized_search = ''
        or position(normalized_search in lower(concat_ws(
          ' ', r.ref_number, r.first_name, r.middle_name, r.last_name
        ))) > 0
      );

  insert into public.kk_audit_log (actor_id, action, metadata)
  values (
    (select auth.uid()),
    'response_list_viewed',
    jsonb_build_object(
      'status_filter', p_status,
      'query_characters', length(normalized_search),
      'result_count', matched_count,
      'page_size', p_limit,
      'page_offset', p_offset
    )
  );

  return query
    select
      to_jsonb(page_row) - 'record_count' - 'source_payload' - 'created_by',
      page_row.record_count
    from (
      select r.*, count(*) over () as record_count
      from public.kk_responses as r
      where (p_status is null or r.status = p_status)
        and (
          normalized_search = ''
          or position(normalized_search in lower(concat_ws(
            ' ', r.ref_number, r.first_name, r.middle_name, r.last_name
          ))) > 0
        )
      order by r.created_at desc, r.id
      limit p_limit offset p_offset
    ) as page_row;
end;
$$;

revoke all on function public.get_kk_responses(text, text, integer, integer)
  from public, anon;
grant execute on function public.get_kk_responses(text, text, integer, integer)
  to authenticated;

create or replace function public.review_kk_response(
  p_response_id uuid,
  p_status text,
  p_review_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_portal_admin()) then
    raise exception 'Administrator access is required.';
  end if;
  if p_status not in ('pending', 'verified', 'needs_review', 'rejected')
    or length(coalesce(p_review_notes, '')) > 2000 then
    raise exception 'Invalid KK review update.';
  end if;

  update public.kk_responses
  set status = p_status,
      needs_review = p_status = 'needs_review',
      review_notes = trim(coalesce(p_review_notes, '')),
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      verified_at = case
        when p_status = 'verified' then coalesce(verified_at, now())
        else null
      end
  where id = p_response_id;

  if not found then
    raise exception 'KK response not found.';
  end if;
end;
$$;

revoke all on function public.review_kk_response(uuid, text, text)
  from public, anon;
grant execute on function public.review_kk_response(uuid, text, text)
  to authenticated;

create or replace function public.get_kk_aggregate_report()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  report jsonb;
begin
  if not (select public.is_portal_admin()) then
    raise exception 'Administrator access is required.';
  end if;

  insert into public.kk_audit_log (actor_id, action)
  values ((select auth.uid()), 'aggregate_report_viewed');

  with counts as (
    select
      count(*) filter (where status = 'pending') as pending,
      count(*) filter (where status = 'verified') as verified,
      count(*) filter (where status = 'needs_review') as needs_review,
      count(*) filter (where status = 'rejected') as rejected
    from public.kk_responses
  )
  select jsonb_build_object(
    'pending', case when pending < 5 then to_jsonb('<5'::text) else to_jsonb(pending) end,
    'verified', case when verified < 5 then to_jsonb('<5'::text) else to_jsonb(verified) end,
    'needs_review', case when needs_review < 5 then to_jsonb('<5'::text) else to_jsonb(needs_review) end,
    'rejected', case when rejected < 5 then to_jsonb('<5'::text) else to_jsonb(rejected) end
  )
  into report
  from counts;

  return report;
end;
$$;

revoke all on function public.get_kk_aggregate_report() from public, anon;
grant execute on function public.get_kk_aggregate_report() to authenticated;

create or replace function public.kk_csv_value(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select '"' || replace(coalesce(p_value, ''), '"', '""') || '"'
$$;

revoke all on function public.kk_csv_value(text) from public, anon, authenticated;

create or replace function public.export_kk_responses_csv(p_purpose text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  csv_content text;
  exported_count bigint;
  export_purpose text := trim(coalesce(p_purpose, ''));
begin
  if not (select public.is_portal_admin()) then
    raise exception 'Administrator access is required.';
  end if;
  if length(export_purpose) < 8 or length(export_purpose) > 200 then
    raise exception 'Enter an export purpose between 8 and 200 characters.';
  end if;

  select count(*) into exported_count from public.kk_responses;
  insert into public.kk_audit_log (actor_id, action, purpose, metadata)
  values (
    (select auth.uid()),
    'full_response_csv_exported',
    export_purpose,
    jsonb_build_object('record_count', exported_count)
  );

  select
    'id,source,source_record_id,portal_application_id,google_form_response_id,import_batch_id,ref_number,original_timestamp,original_timestamp_raw,status,needs_review,review_notes,reviewed_by,reviewed_at,first_name,middle_name,last_name,email,email_address,email_account,gender_identity,age,birthday,birthplace,contact_number,civil_status,sitio_address,sitio_other,complete_address,voter_status,voted_last_sk_election,sk_election_vote_count,sk_election_vote_count_other,national_voter,precinct_number,youth_classifications,work_status,educational_background,source_payload,created_by,created_at,updated_at,verified_at,privacy_consent_at,privacy_notice_version'
    || E'\n'
    || coalesce(string_agg(
      concat_ws(',',
        public.kk_csv_value(r.id::text),
        public.kk_csv_value(r.source),
        public.kk_csv_value(r.source_record_id),
        public.kk_csv_value(r.portal_application_id),
        public.kk_csv_value(r.google_form_response_id),
        public.kk_csv_value(r.import_batch_id::text),
        public.kk_csv_value(r.ref_number),
        public.kk_csv_value(r.original_timestamp::text),
        public.kk_csv_value(r.original_timestamp_raw),
        public.kk_csv_value(r.status),
        public.kk_csv_value(r.needs_review::text),
        public.kk_csv_value(r.review_notes),
        public.kk_csv_value(r.reviewed_by::text),
        public.kk_csv_value(r.reviewed_at::text),
        public.kk_csv_value(r.first_name),
        public.kk_csv_value(r.middle_name),
        public.kk_csv_value(r.last_name),
        public.kk_csv_value(r.email),
        public.kk_csv_value(r.email_address),
        public.kk_csv_value(r.email_account),
        public.kk_csv_value(r.gender_identity),
        public.kk_csv_value(r.age::text),
        public.kk_csv_value(r.birthday::text),
        public.kk_csv_value(r.birthplace),
        public.kk_csv_value(r.contact_number),
        public.kk_csv_value(r.civil_status),
        public.kk_csv_value(r.sitio_address),
        public.kk_csv_value(r.sitio_other),
        public.kk_csv_value(r.complete_address),
        public.kk_csv_value(r.voter_status),
        public.kk_csv_value(r.voted_last_sk_election),
        public.kk_csv_value(r.sk_election_vote_count),
        public.kk_csv_value(r.sk_election_vote_count_other),
        public.kk_csv_value(r.national_voter),
        public.kk_csv_value(r.precinct_number),
        public.kk_csv_value(array_to_string(r.youth_classifications, '|')),
        public.kk_csv_value(r.work_status),
        public.kk_csv_value(r.educational_background),
        public.kk_csv_value(r.source_payload::text),
        public.kk_csv_value(r.created_by::text),
        public.kk_csv_value(r.created_at::text),
        public.kk_csv_value(r.updated_at::text),
        public.kk_csv_value(r.verified_at::text),
        public.kk_csv_value(r.privacy_consent_at::text),
        public.kk_csv_value(r.privacy_notice_version)
      ),
      E'\n' order by r.created_at, r.id
    ), '')
  into csv_content
  from public.kk_responses as r;

  return csv_content;
end;
$$;

revoke all on function public.export_kk_responses_csv(text) from public, anon;
grant execute on function public.export_kk_responses_csv(text) to authenticated;

revoke select, insert, update, delete on public.kk_responses from authenticated;
