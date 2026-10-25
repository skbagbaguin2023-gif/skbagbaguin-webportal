update public.portal_records
set data = jsonb_set(data, '{status}', '"Published"'::jsonb, true),
    updated_at = now()
where collection = 'announcements'
  and data ->> 'status' is distinct from 'Published';

drop policy if exists "public content and admins can read portal records" on public.portal_records;
create policy "public content and admins can read portal records"
  on public.portal_records for select to anon, authenticated
  using (
    (select public.is_portal_admin())
    or collection in ('programs', 'events', 'council', 'announcements')
    or (collection = 'services' and data ->> 'isActive' = 'true')
    or (collection = 'transparencyDocs' and data ->> 'isPublic' = 'true')
  );
