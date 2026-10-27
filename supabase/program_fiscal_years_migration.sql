alter table public.portal_records
  drop constraint if exists portal_records_collection_check;

alter table public.portal_records
  add constraint portal_records_collection_check check (collection in (
    'programs',
    'programSettings',
    'events',
    'announcements',
    'facebookPosts',
    'applications',
    'transparencyDocs',
    'council',
    'feedbacks',
    'registrations',
    'services'
  ));

drop policy if exists "public content and admins can read portal records" on public.portal_records;
create policy "public content and admins can read portal records"
  on public.portal_records for select to anon, authenticated
  using (
    (select public.is_portal_admin())
    or collection in ('programs', 'programSettings', 'events', 'council')
    or (collection = 'services' and data ->> 'isActive' = 'true')
    or collection in ('announcements', 'facebookPosts')
    or (collection = 'transparencyDocs' and data ->> 'isPublic' = 'true')
  );
