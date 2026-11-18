create table if not exists public.resident_account_settings (
  setting_key text primary key check (setting_key = 'email_verification_enabled'),
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.resident_account_settings (setting_key, is_enabled)
values ('email_verification_enabled', false)
on conflict (setting_key) do nothing;

alter table public.resident_account_settings enable row level security;
revoke all on table public.resident_account_settings from public, anon, authenticated;

create or replace function public.claim_my_applications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  resident_email text;
  claimed_count integer;
  verification_enabled boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'SIGN_IN_REQUIRED';
  end if;

  select is_enabled
  into verification_enabled
  from public.resident_account_settings
  where setting_key = 'email_verification_enabled';

  if not coalesce(verification_enabled, false) then
    raise exception 'EMAIL_VERIFICATION_NOT_ENABLED';
  end if;

  select lower(trim(email))
  into resident_email
  from auth.users
  where id = (select auth.uid())
    and email_confirmed_at is not null;

  if resident_email is null then
    raise exception 'VERIFIED_EMAIL_REQUIRED';
  end if;

  update public.portal_records
  set owner_user_id = (select auth.uid())
  where collection = 'applications'
    and owner_user_id is null
    and (
      lower(trim(data ->> 'email')) = resident_email
      or lower(trim(data #>> '{kkProfile,email}')) = resident_email
    );

  get diagnostics claimed_count = row_count;
  return claimed_count;
end;
$$;

revoke all on function public.claim_my_applications() from public, anon;
grant execute on function public.claim_my_applications() to authenticated;
