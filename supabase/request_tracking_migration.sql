create or replace function public.find_application_for_tracking(
  p_ref_number text,
  p_contact_number text
)
returns table (
  ref_number text,
  applicant_name text,
  service_type text,
  status text,
  submitted_at text,
  requested_date text,
  date_needed text,
  copies_needed integer,
  last_updated timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    data ->> 'refNumber',
    data ->> 'applicantName',
    data ->> 'serviceType',
    data ->> 'status',
    data ->> 'submittedAt',
    data ->> 'requestedDate',
    data ->> 'dateNeeded',
    case
      when data ->> 'copiesNeeded' ~ '^[0-9]+$' then (data ->> 'copiesNeeded')::integer
      else null
    end,
    updated_at
  from public.portal_records
  where collection = 'applications'
    and upper(data ->> 'refNumber') = upper(trim(p_ref_number))
    and regexp_replace(data ->> 'contactNumber', '[[:space:]-]', '', 'g')
      = regexp_replace(trim(p_contact_number), '[[:space:]-]', '', 'g')
  limit 1;
$$;

revoke all on function public.find_application_for_tracking(text, text) from public;
grant execute on function public.find_application_for_tracking(text, text) to anon, authenticated;
