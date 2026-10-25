  alter table public.portal_records
    drop constraint if exists portal_records_collection_check;

  alter table public.portal_records
    add constraint portal_records_collection_check check (collection in (
      'programs',
      'events',
      'announcements',
      'applications',
      'transparencyDocs',
      'council',
      'feedbacks',
      'registrations',
      'services'
    ));

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

  drop policy if exists "public content and admins can read portal records" on public.portal_records;

  create policy "public content and admins can read portal records"
    on public.portal_records for select to anon, authenticated
    using (
      (select public.is_portal_admin())
      or collection in ('programs', 'events', 'council')
      or (collection = 'services' and data ->> 'isActive' = 'true')
      or (collection = 'announcements' and data ->> 'status' = 'Published')
      or (collection = 'transparencyDocs' and data ->> 'isPublic' = 'true')
    );
