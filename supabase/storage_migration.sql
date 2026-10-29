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
    and (storage.foldername(name))[1] in ('announcements', 'council', 'programs')
  );

drop policy if exists "Admins can upload portal images" on storage.objects;
create policy "Admins can upload portal images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portal-images'
    and public.is_portal_admin()
    and (storage.foldername(name))[1] in ('announcements', 'council', 'programs')
  );

drop policy if exists "Admins can update portal images" on storage.objects;
create policy "Admins can update portal images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'portal-images'
    and public.is_portal_admin()
    and (storage.foldername(name))[1] in ('announcements', 'council', 'programs')
  )
  with check (
    bucket_id = 'portal-images'
    and public.is_portal_admin()
    and (storage.foldername(name))[1] in ('announcements', 'council', 'programs')
  );

drop policy if exists "Admins can delete portal images" on storage.objects;
create policy "Admins can delete portal images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'portal-images'
    and public.is_portal_admin()
    and (storage.foldername(name))[1] in ('announcements', 'council', 'programs')
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
    and (
      (
        (storage.foldername(name))[1] = 'submissions'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and lower(coalesce(metadata ->> 'mimetype', '')) in ('application/pdf', 'image/jpeg', 'image/png')
      )
      or (
        (storage.foldername(name))[1] = 'printing-requests'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and name ~* '\.pdf$'
        and lower(coalesce(metadata ->> 'mimetype', '')) = 'application/pdf'
      )
    )
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transparency-documents',
  'transparency-documents',
  false,
  36700160,
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
