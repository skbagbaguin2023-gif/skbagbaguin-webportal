create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  request_count integer not null check (request_count >= 0)
);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;
grant all on table public.rate_limits to service_role;

create or replace function public.check_rate_limit(
  key text,
  max_count integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_window timestamptz := now();
  allowed boolean;
begin
  if key is null or length(key) < 1 or max_count < 1 or window_seconds < 1 then
    return false;
  end if;

  insert into public.rate_limits (key, window_start, request_count)
  values (key, current_window, 1)
  on conflict (key) do update
  set
    window_start = case
      when current_window >= public.rate_limits.window_start + make_interval(secs => window_seconds)
        then current_window
      else public.rate_limits.window_start
    end,
    request_count = case
      when current_window >= public.rate_limits.window_start + make_interval(secs => window_seconds)
        then 1
      else public.rate_limits.request_count + 1
    end
  returning request_count <= max_count into allowed;

  return allowed;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
