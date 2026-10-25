create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.portal_records (
  collection text not null check (collection in (
    'programs',
    'events',
    'announcements',
    'applications',
    'transparencyDocs',
    'council',
    'feedbacks',
    'registrations',
    'services'
  )),
  id text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id),
  constraint portal_record_matches_id check (data ? 'id' and data ->> 'id' = id)
);

create index if not exists portal_records_collection_idx
  on public.portal_records (collection);

alter table public.admin_users enable row level security;
alter table public.portal_records enable row level security;

create or replace function public.is_portal_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_portal_admin() from public;
grant execute on function public.is_portal_admin() to anon, authenticated;

create policy "admins can read admin membership"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create policy "public content and admins can read portal records"
  on public.portal_records for select to anon, authenticated
  using (
    (select public.is_portal_admin())
    or collection in ('programs', 'events', 'council')
    or (collection = 'services' and data ->> 'isActive' = 'true')
    or collection = 'announcements'
    or (collection = 'transparencyDocs' and data ->> 'isPublic' = 'true')
  );

create policy "visitors can submit applications"
  on public.portal_records for insert to anon, authenticated
  with check (
    collection = 'applications'
    and data ? 'id'
    and data ->> 'id' = id
    and data ?& array[
      'refNumber', 'applicantName', 'age', 'birthday', 'gender',
      'sitio', 'address', 'contactNumber', 'email', 'serviceType',
      'status', 'submittedAt', 'documentsAttached'
    ]
    and length(data ->> 'applicantName') between 1 and 120
    and case
      when (data ->> 'age') ~ '^[0-9]{1,2}$'
        then (data ->> 'age')::integer between 15 and 30
      else false
    end
    and data ->> 'status' = 'Pending'
    and case
      when jsonb_typeof(data -> 'documentsAttached') = 'array'
        then jsonb_array_length(data -> 'documentsAttached') <= 10
      else false
    end
  );

create policy "visitors can submit feedback"
  on public.portal_records for insert to anon, authenticated
  with check (
    collection = 'feedbacks'
    and data ? 'id'
    and data ->> 'id' = id
    and data ?& array[
      'senderName', 'email', 'sitio', 'isAnonymous', 'category',
      'subject', 'message', 'priority', 'status', 'submittedAt'
    ]
    and length(data ->> 'subject') between 1 and 160
    and length(data ->> 'message') between 1 and 5000
    and data ->> 'status' = 'New'
  );

create policy "admins can insert portal records"
  on public.portal_records for insert to authenticated
  with check ((select public.is_portal_admin()));

create policy "admins can update portal records"
  on public.portal_records for update to authenticated
  using ((select public.is_portal_admin()))
  with check ((select public.is_portal_admin()));

create policy "admins can delete portal records"
  on public.portal_records for delete to authenticated
  using ((select public.is_portal_admin()));

create or replace function public.register_for_event(
  p_event_id text,
  p_registration jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_record public.portal_records%rowtype;
  registered_count integer;
  event_capacity integer;
  registration_id text;
  registration_age integer;
begin
  if p_registration is null
     or jsonb_typeof(p_registration) <> 'object'
     or not (p_registration ?& array[
       'id', 'eventId', 'eventTitle', 'fullName', 'age', 'sitio',
       'contactNumber', 'email', 'emergencyContact', 'registeredAt',
       'status', 'registrationCode'
     ]) then
    raise exception 'INVALID_REGISTRATION';
  end if;

  select *
  into event_record
  from public.portal_records
  where collection = 'events' and id = p_event_id
  for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  registered_count := coalesce((event_record.data ->> 'registeredCount')::integer, 0);
  event_capacity := (event_record.data ->> 'capacity')::integer;

  if event_capacity is null or registered_count >= event_capacity
     or event_record.data ->> 'status' = 'Full' then
    raise exception 'EVENT_FULL';
  end if;

  registration_id := p_registration ->> 'id';
  if registration_id is null
     or p_registration ->> 'id' is distinct from registration_id
     or p_registration ->> 'eventId' is distinct from p_event_id
     or p_registration ->> 'status' is distinct from 'Confirmed'
     or coalesce(p_registration ->> 'age' ~ '^[0-9]{1,2}$', false) = false
     or length(coalesce(p_registration ->> 'fullName', '')) not between 1 and 120 then
    raise exception 'INVALID_REGISTRATION';
  end if;

  registration_age := (p_registration ->> 'age')::integer;
  if registration_age not between 15 and 30 then
    raise exception 'INVALID_REGISTRATION';
  end if;

  insert into public.portal_records (collection, id, data)
  values ('registrations', registration_id, p_registration);

  update public.portal_records
  set data = jsonb_set(
        jsonb_set(event_record.data, '{registeredCount}', to_jsonb(registered_count + 1)),
        '{lastRegistrationId}',
        to_jsonb(registration_id)
      ),
      updated_at = now()
  where collection = 'events' and id = p_event_id;
end;
$$;

revoke all on function public.register_for_event(text, jsonb) from public;
grant execute on function public.register_for_event(text, jsonb) to anon, authenticated;

grant select, insert, update, delete on public.portal_records to anon, authenticated;
grant select on public.admin_users to authenticated;

alter table public.portal_records replica identity full;
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'portal_records'
  ) then
    alter publication supabase_realtime add table public.portal_records;
  end if;
end;
$$;

insert into public.portal_records (collection, id, data)
values
  (
    'services',
    'printing-services',
    '{
      "id": "printing-services",
      "name": "Printing Services",
      "tagline": "Printing assistance for Bagbaguin youth",
      "description": "Request printing services from the Sangguniang Kabataan office.",
      "turnaroundTime": "",
      "eligibility": [],
      "requirements": [],
      "isActive": true
    }'::jsonb
  ),
  (
    'services',
    'kk-official-profiling',
    '{
      "id": "kk-official-profiling",
      "name": "Katipunan ng Kabataan (KK) Official Profiling",
      "tagline": "Official youth profiling and registration",
      "description": "Register your profile with the Katipunan ng Kabataan of Barangay Bagbaguin.",
      "turnaroundTime": "",
      "eligibility": [],
      "requirements": [],
      "isActive": true
    }'::jsonb
  )
on conflict (collection, id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portal-images',
  'portal-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view portal images" on storage.objects;
create policy "Public can view portal images"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'portal-images'
    and (storage.foldername(name))[1] in ('announcements', 'council')
  );

drop policy if exists "Admins can upload portal images" on storage.objects;
create policy "Admins can upload portal images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portal-images'
    and public.is_portal_admin()
    and (storage.foldername(name))[1] in ('announcements', 'council')
  );

drop policy if exists "Admins can update portal images" on storage.objects;
create policy "Admins can update portal images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'portal-images'
    and public.is_portal_admin()
    and (storage.foldername(name))[1] in ('announcements', 'council')
  )
  with check (
    bucket_id = 'portal-images'
    and public.is_portal_admin()
    and (storage.foldername(name))[1] in ('announcements', 'council')
  );

drop policy if exists "Admins can delete portal images" on storage.objects;
create policy "Admins can delete portal images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'portal-images'
    and public.is_portal_admin()
    and (storage.foldername(name))[1] in ('announcements', 'council')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transparency-documents',
  'transparency-documents',
  false,
  26214400,
  array['application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read published transparency PDFs" on storage.objects;
create policy "Public can read published transparency PDFs"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'transparency-documents'
    and exists (
      select 1
      from public.portal_records
      where collection = 'transparencyDocs'
        and data ->> 'storagePath' = name
        and data ->> 'isPublic' = 'true'
    )
  );

drop policy if exists "Admins can read transparency PDFs" on storage.objects;
create policy "Admins can read transparency PDFs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'transparency-documents'
    and public.is_portal_admin()
  );

drop policy if exists "Admins can upload transparency PDFs" on storage.objects;
create policy "Admins can upload transparency PDFs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'transparency-documents'
    and public.is_portal_admin()
    and (storage.foldername(name))[1] = 'reports'
    and lower(coalesce(metadata ->> 'mimetype', '')) = 'application/pdf'
  );

drop policy if exists "Admins can delete transparency PDFs" on storage.objects;
create policy "Admins can delete transparency PDFs"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'transparency-documents'
    and public.is_portal_admin()
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-documents',
  'application-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Visitors can upload application documents" on storage.objects;
create policy "Visitors can upload application documents"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'application-documents'
    and (storage.foldername(name))[1] = 'submissions'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and lower(coalesce(metadata ->> 'mimetype', '')) in ('application/pdf', 'image/jpeg', 'image/png')
  );

drop policy if exists "Admins can read application documents" on storage.objects;
create policy "Admins can read application documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'application-documents'
    and public.is_portal_admin()
  );

drop policy if exists "Admins can delete application documents" on storage.objects;
create policy "Admins can delete application documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'application-documents'
    and public.is_portal_admin()
  );
