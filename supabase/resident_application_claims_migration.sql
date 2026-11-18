create table if not exists public.resident_application_claims (
  id uuid primary key default gen_random_uuid(),
  resident_user_id uuid not null references auth.users (id) on delete cascade,
  resident_email text not null,
  ref_number text not null check (length(trim(ref_number)) between 4 and 80),
  contact_number text not null
    check (length(trim(contact_number)) between 7 and 32)
    check (length(regexp_replace(contact_number, '[^0-9]', '', 'g')) between 7 and 15),
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

create index if not exists resident_application_claims_status_created_idx
  on public.resident_application_claims (status, created_at desc);

create index if not exists resident_application_claims_resident_created_idx
  on public.resident_application_claims (resident_user_id, created_at desc);

create unique index if not exists resident_application_claims_one_pending_per_ref_idx
  on public.resident_application_claims (resident_user_id, upper(trim(ref_number)))
  where status = 'Pending';

alter table public.resident_application_claims enable row level security;

revoke all on table public.resident_application_claims from public, anon;
grant select, insert on table public.resident_application_claims to authenticated;

create policy "Residents and admins can read application claims"
  on public.resident_application_claims for select to authenticated
  using (
    resident_user_id = (select auth.uid())
    or (select public.is_portal_admin())
  );

create policy "Residents can submit their own application claims"
  on public.resident_application_claims for insert to authenticated
  with check (
    resident_user_id = (select auth.uid())
    and status = 'Pending'
    and reviewed_at is null
    and reviewed_by is null
  );

create or replace function public.normalize_resident_claim_phone(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  with digits as (
    select regexp_replace(coalesce(value, ''), '[^0-9]', '', 'g') as value
  )
  select case
    when length(value) = 11 and left(value, 1) = '0' then '63' || substr(value, 2)
    else value
  end
  from digits;
$$;

revoke all on function public.normalize_resident_claim_phone(text) from public, anon, authenticated;

create or replace function public.set_resident_application_claim_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.resident_user_id is distinct from (select auth.uid()) then
    raise exception 'CLAIM_USER_MISMATCH';
  end if;

  select email
  into new.resident_email
  from auth.users
  where id = new.resident_user_id;

  if new.resident_email is null then
    raise exception 'CLAIM_EMAIL_UNAVAILABLE';
  end if;

  return new;
end;
$$;

revoke all on function public.set_resident_application_claim_email() from public, anon, authenticated;

drop trigger if exists set_resident_application_claim_email_before_insert
  on public.resident_application_claims;
create trigger set_resident_application_claim_email_before_insert
  before insert on public.resident_application_claims
  for each row execute function public.set_resident_application_claim_email();

create or replace function public.review_resident_application_claim(
  p_claim_id uuid,
  p_approve boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim_request public.resident_application_claims%rowtype;
  matched_application_id text;
  matched_application_owner uuid;
  matching_applications integer;
begin
  if not (select public.is_portal_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select *
  into claim_request
  from public.resident_application_claims
  where id = p_claim_id
  for update;

  if not found then
    raise exception 'CLAIM_NOT_FOUND';
  end if;
  if claim_request.status <> 'Pending' then
    raise exception 'CLAIM_ALREADY_REVIEWED';
  end if;

  if p_approve then
    select count(*)
    into matching_applications
    from public.portal_records
    where collection = 'applications'
      and upper(trim(data ->> 'refNumber')) = upper(trim(claim_request.ref_number))
      and public.normalize_resident_claim_phone(data ->> 'contactNumber')
        = public.normalize_resident_claim_phone(claim_request.contact_number);

    if matching_applications = 0 then
      raise exception 'APPLICATION_NOT_MATCHED';
    end if;
    if matching_applications > 1 then
      raise exception 'APPLICATION_MATCH_NOT_UNIQUE';
    end if;

    select id, owner_user_id
    into matched_application_id, matched_application_owner
    from public.portal_records
    where collection = 'applications'
      and upper(trim(data ->> 'refNumber')) = upper(trim(claim_request.ref_number))
      and public.normalize_resident_claim_phone(data ->> 'contactNumber')
        = public.normalize_resident_claim_phone(claim_request.contact_number);

    if matched_application_owner is not null
      and matched_application_owner <> claim_request.resident_user_id then
      raise exception 'APPLICATION_ALREADY_LINKED';
    end if;

    update public.portal_records
    set owner_user_id = claim_request.resident_user_id
    where collection = 'applications'
      and id = matched_application_id;

    update public.resident_application_claims
    set status = 'Approved',
        reviewed_at = now(),
        reviewed_by = (select auth.uid())
    where id = p_claim_id;

    return 'Approved';
  end if;

  update public.resident_application_claims
  set status = 'Rejected',
      reviewed_at = now(),
      reviewed_by = (select auth.uid())
  where id = p_claim_id;

  return 'Rejected';
end;
$$;

revoke all on function public.review_resident_application_claim(uuid, boolean) from public, anon;
grant execute on function public.review_resident_application_claim(uuid, boolean) to authenticated;
