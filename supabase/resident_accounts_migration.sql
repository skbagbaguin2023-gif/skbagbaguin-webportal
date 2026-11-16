alter table public.portal_records
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null;

create index if not exists portal_records_owner_applications_idx
  on public.portal_records (owner_user_id, updated_at desc)
  where collection = 'applications';

create or replace function public.assign_application_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.collection = 'applications' then
    new.owner_user_id := (select auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists assign_application_owner_before_insert on public.portal_records;
create trigger assign_application_owner_before_insert
  before insert on public.portal_records
  for each row execute function public.assign_application_owner();

create or replace function public.update_application_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.collection = 'applications' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists update_application_updated_at_before_update on public.portal_records;
create trigger update_application_updated_at_before_update
  before update on public.portal_records
  for each row execute function public.update_application_updated_at();

create policy "Residents can read their own applications"
  on public.portal_records for select to authenticated
  using (
    collection = 'applications'
    and owner_user_id = (select auth.uid())
  );

create table if not exists public.application_edit_history (
  id uuid primary key default gen_random_uuid(),
  application_id text not null,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  changed_fields text[] not null default '{}',
  removed_document_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists application_edit_history_owner_idx
  on public.application_edit_history (owner_user_id, created_at desc);

alter table public.application_edit_history enable row level security;

create policy "Residents and admins can read application edit history"
  on public.application_edit_history for select to authenticated
  using (
    owner_user_id = (select auth.uid())
    or (select public.is_portal_admin())
  );

create table if not exists public.resident_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status_email_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.resident_preferences enable row level security;

create policy "Residents can read their own preferences"
  on public.resident_preferences for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Residents can create their own preferences"
  on public.resident_preferences for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Residents can update their own preferences"
  on public.resident_preferences for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public.claim_my_applications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  resident_email text;
  claimed_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'SIGN_IN_REQUIRED';
  end if;

  select lower(trim(email))
  into resident_email
  from auth.users
  where id = (select auth.uid())
    and email_confirmed_at is not null;

  if resident_email is null then
    raise exception 'VERIFIED_EMAIL_REQUIRED';
  end if;

  update public.portal_records
  set owner_user_id = (select auth.uid())
  where collection = 'applications'
    and owner_user_id is null
    and (
      lower(trim(data ->> 'email')) = resident_email
      or lower(trim(data #>> '{kkProfile,email}')) = resident_email
    );

  get diagnostics claimed_count = row_count;
  return claimed_count;
end;
$$;

revoke all on function public.claim_my_applications() from public, anon;
grant execute on function public.claim_my_applications() to authenticated;

create or replace function public.update_my_application(
  p_application_id text,
  p_application jsonb,
  p_reason text,
  p_removed_document_paths text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_record public.portal_records%rowtype;
  updated_data jsonb;
  editable_field text;
  editable_fields constant text[] := array[
    'applicantName', 'age', 'birthday', 'gender', 'sitio', 'address',
    'contactNumber', 'notificationPreference', 'messengerName',
    'messengerProfileUrl', 'email', 'schoolOrOrg', 'yearLevel', 'details',
    'requestedDate', 'dateNeeded', 'copiesNeeded', 'kkProfile',
    'documentsAttached'
  ];
  changed_fields text[] := '{}';
begin
  if (select auth.uid()) is null then
    raise exception 'SIGN_IN_REQUIRED';
  end if;
  if p_application is null or jsonb_typeof(p_application) <> 'object' then
    raise exception 'INVALID_APPLICATION';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 5 or length(trim(coalesce(p_reason, ''))) > 1000 then
    raise exception 'EDIT_REASON_REQUIRED';
  end if;

  select *
  into existing_record
  from public.portal_records
  where collection = 'applications'
    and id = p_application_id
    and owner_user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'APPLICATION_NOT_FOUND';
  end if;
  if existing_record.data ->> 'status' <> 'Pending' then
    raise exception 'APPLICATION_NOT_PENDING';
  end if;
  if p_application ->> 'id' is distinct from p_application_id
     or p_application ->> 'serviceType' is distinct from existing_record.data ->> 'serviceType' then
    raise exception 'PROTECTED_APPLICATION_FIELDS';
  end if;

  updated_data := existing_record.data;
  foreach editable_field in array editable_fields loop
    if p_application ? editable_field then
      updated_data := jsonb_set(updated_data, array[editable_field], p_application -> editable_field, true);
      changed_fields := array_append(changed_fields, editable_field);
    end if;
  end loop;

  if updated_data -> 'kkProfile' is distinct from existing_record.data -> 'kkProfile'
     and existing_record.data ->> 'googleSyncStatus' = 'Synced' then
    updated_data := jsonb_set(updated_data, '{googleSyncStatus}', '"Portal Updated"', true);
    updated_data := jsonb_set(
      updated_data,
      '{googleSyncError}',
      '"Resident edited this profile after Google Forms sync; the original Google response was not changed."',
      true
    );
    changed_fields := array_append(changed_fields, 'googleSyncStatus');
  end if;

  if length(trim(coalesce(updated_data ->> 'applicantName', ''))) not between 1 and 120 then
    raise exception 'INVALID_APPLICANT_NAME';
  end if;
  if case
    when jsonb_typeof(updated_data -> 'documentsAttached') = 'array'
      then jsonb_array_length(updated_data -> 'documentsAttached') <= 10
    else false
  end is not true then
    raise exception 'INVALID_APPLICATION_DOCUMENTS';
  end if;
  if updated_data ? 'age' and case
    when updated_data ->> 'age' ~ '^[0-9]{1,2}$'
      then (updated_data ->> 'age')::integer between 15 and 30
    else false
  end is not true then
    raise exception 'INVALID_APPLICANT_AGE';
  end if;
  if updated_data ? 'contactNumber'
     and not coalesce(updated_data ->> 'contactNumber' ~ '^(09[0-9]{9}|\+639[0-9]{9})$', false) then
    raise exception 'INVALID_CONTACT_NUMBER';
  end if;
  if updated_data ? 'kkProfile' and case
    when jsonb_typeof(updated_data -> 'kkProfile') = 'object'
      and jsonb_typeof(updated_data #> '{kkProfile,age}') = 'number'
      and updated_data #>> '{kkProfile,age}' ~ '^[0-9]{1,2}$'
      then (updated_data #>> '{kkProfile,age}')::integer between 15 and 30
    else false
  end is not true then
    raise exception 'INVALID_KK_PROFILE_AGE';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(updated_data -> 'documentsAttached') as documents(document)
    where document ? 'storagePath'
      and (
        jsonb_typeof(document -> 'storagePath') is distinct from 'string'
        or
        document ->> 'storagePath' !~ '^(submissions|printing-requests)/[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|png)$'
        or not (
          exists (
            select 1
            from jsonb_array_elements(existing_record.data -> 'documentsAttached') as old_documents(old_document)
            where old_document ->> 'storagePath' = document ->> 'storagePath'
          )
          or document ->> 'storagePath' ~ (
            '^(submissions|printing-requests)/'
            || (select auth.uid())::text
            || '/[0-9a-f-]{36}\.(pdf|jpg|png)$'
          )
        )
      )
  ) then
    raise exception 'INVALID_APPLICATION_DOCUMENT_PATH';
  end if;
  if exists (
    select 1
    from unnest(coalesce(p_removed_document_paths, '{}')) as removed_paths(removed_path)
    where not exists (
      select 1
      from jsonb_array_elements(existing_record.data -> 'documentsAttached') as documents(document)
      where document ->> 'storagePath' = removed_path
    )
  ) then
    raise exception 'INVALID_REMOVED_DOCUMENT';
  end if;

  insert into public.application_edit_history (
    application_id,
    owner_user_id,
    reason,
    changed_fields,
    removed_document_paths
  ) values (
    p_application_id,
    (select auth.uid()),
    trim(p_reason),
    changed_fields,
    coalesce(p_removed_document_paths, '{}')
  );

  update public.portal_records
  set data = updated_data,
      updated_at = now()
  where collection = 'applications'
    and id = p_application_id;
end;
$$;

revoke all on function public.update_my_application(text, jsonb, text, text[]) from public, anon;
grant execute on function public.update_my_application(text, jsonb, text, text[]) to authenticated;

create or replace function public.cancel_my_application(
  p_application_id text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_record public.portal_records%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'SIGN_IN_REQUIRED';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 5 or length(trim(coalesce(p_reason, ''))) > 1000 then
    raise exception 'CANCELLATION_REASON_REQUIRED';
  end if;

  select *
  into existing_record
  from public.portal_records
  where collection = 'applications'
    and id = p_application_id
    and owner_user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'APPLICATION_NOT_FOUND';
  end if;
  if existing_record.data ->> 'status' <> 'Pending' then
    raise exception 'APPLICATION_NOT_PENDING';
  end if;

  insert into public.application_edit_history (
    application_id, owner_user_id, reason, changed_fields
  ) values (
    p_application_id, (select auth.uid()), trim(p_reason), array['status']
  );

  update public.portal_records
  set data = jsonb_set(existing_record.data, '{status}', '"Cancelled"', true),
      updated_at = now()
  where collection = 'applications'
    and id = p_application_id;
end;
$$;

revoke all on function public.cancel_my_application(text, text) from public, anon;
grant execute on function public.cancel_my_application(text, text) to authenticated;

drop policy if exists "Visitors can upload application documents" on storage.objects;
create policy "Visitors can upload application documents"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'application-documents'
    and (
      (
        (storage.foldername(name))[1] = 'submissions'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and lower(coalesce(metadata ->> 'mimetype', '')) in ('application/pdf', 'image/jpeg', 'image/png')
        and (
          (select auth.uid()) is null
          or public.is_portal_admin()
          or (storage.foldername(name))[2] = (select auth.uid())::text
        )
      )
      or (
        (storage.foldername(name))[1] = 'printing-requests'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and name ~* '\.pdf$'
        and lower(coalesce(metadata ->> 'mimetype', '')) = 'application/pdf'
        and (
          (select auth.uid()) is null
          or public.is_portal_admin()
          or (storage.foldername(name))[2] = (select auth.uid())::text
        )
      )
    )
  );

drop policy if exists "Residents can delete their own application documents" on storage.objects;
create policy "Residents can delete their own application documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'application-documents'
    and (
      (storage.foldername(name))[2] = (select auth.uid())::text
      or exists (
        select 1
        from public.application_edit_history history
        where history.owner_user_id = (select auth.uid())
          and name = any(history.removed_document_paths)
      )
    )
  );
