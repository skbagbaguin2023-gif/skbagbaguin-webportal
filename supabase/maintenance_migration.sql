-- Adds the admin-only maintenance issue collection.
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
    'services',
    'maintenance'
  ));

-- Do not add maintenance to the public-read branches. Admins can read it
-- through the existing is_portal_admin() branch.
