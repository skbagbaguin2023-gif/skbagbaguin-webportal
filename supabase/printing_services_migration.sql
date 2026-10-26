drop policy if exists "visitors can submit applications" on public.portal_records;
create policy "visitors can submit applications"
  on public.portal_records for insert to anon, authenticated
  with check (
    collection = 'applications'
    and data ? 'id'
    and data ->> 'id' = id
    and data ?& array[
      'refNumber', 'applicantName', 'serviceType', 'status',
      'submittedAt', 'documentsAttached'
    ]
    and data ->> 'status' = 'Pending'
    and case
      when data ->> 'serviceType' = 'Printing Services' then
        data ?& array[
          'requestedDate', 'copiesNeeded', 'details', 'address', 'contactNumber'
        ]
        and length(data ->> 'applicantName') between 3 and 120
        and (data ->> 'requestedDate') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        and (data ->> 'copiesNeeded') ~ '^[1-9][0-9]{0,5}$'
        and length(data ->> 'details') between 1 and 2000
        and length(data ->> 'address') between 5 and 300
        and (data ->> 'contactNumber') ~ '^(09[0-9]{9}|\+639[0-9]{9})$'
        and case
          when jsonb_typeof(data -> 'documentsAttached') = 'array'
            and jsonb_array_length(data -> 'documentsAttached') = 1
            then (data -> 'documentsAttached' -> 0 ->> 'name') ~* '\.pdf$'
              and (data -> 'documentsAttached' -> 0 ->> 'storagePath')
                ~ '^printing-requests/[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$'
          else false
        end
      else
        data ?& array[
          'age', 'birthday', 'gender', 'sitio', 'address', 'contactNumber',
          'email'
        ]
        and length(data ->> 'applicantName') between 1 and 120
        and case
          when (data ->> 'age') ~ '^[0-9]{1,2}$'
            then (data ->> 'age')::integer between 15 and 30
          else false
        end
        and case
          when jsonb_typeof(data -> 'documentsAttached') = 'array'
            then jsonb_array_length(data -> 'documentsAttached') <= 10
          else false
        end
    end
  );

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
