drop policy if exists "Public can read published transparency PDFs" on storage.objects;
create policy "Public can read published transparency PDFs"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'transparency-documents'
    and exists (
      select 1
      from public.portal_records as portal_record
      where portal_record.collection = 'transparencyDocs'
        and portal_record.data ->> 'isPublic' = 'true'
        and (
          portal_record.data ->> 'storagePath' = name
          or exists (
            select 1
            from jsonb_array_elements(
              case
                when jsonb_typeof(portal_record.data -> 'versions') = 'array'
                  then portal_record.data -> 'versions'
                else '[]'::jsonb
              end
            ) as document_version(item)
            where document_version.item ->> 'storagePath' = name
          )
        )
    )
  );
