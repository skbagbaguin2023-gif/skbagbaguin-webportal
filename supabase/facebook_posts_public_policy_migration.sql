-- Restores public read access for Facebook posts if a later policy migration
-- replaced the portal_records policy without including this collection.
drop policy if exists "public content and admins can read portal records" on public.portal_records;

create policy "public content and admins can read portal records"
  on public.portal_records for select to anon, authenticated
  using (
    (select public.is_portal_admin())
    or collection in ('programs', 'programSettings', 'events', 'council', 'announcements', 'facebookPosts')
    or (collection = 'services' and data ->> 'isActive' = 'true')
    or (collection = 'transparencyDocs' and data ->> 'isPublic' = 'true')
  );
