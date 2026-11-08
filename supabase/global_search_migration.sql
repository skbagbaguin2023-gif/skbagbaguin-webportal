create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function public.immutable_unaccent(value text)
returns text
language sql
immutable
parallel safe
set search_path = public, extensions
as $$
  select unaccent(value);
$$;

create index if not exists portal_records_public_search_idx
  on public.portal_records using gin (
    lower(public.immutable_unaccent(data::text)) gin_trgm_ops
  );

create or replace function public.search_public_content(
  p_query text,
  p_limit integer default 8,
  p_offset integer default 0
)
returns table (
  id text,
  type text,
  title text,
  snippet text,
  date text,
  href text,
  score real,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.check_rate_limit(
    'public-search:' || coalesce(inet_client_addr()::text, 'unknown'),
    60,
    60
  ) then
    raise exception 'SEARCH_RATE_LIMITED';
  end if;

  return query
  with input as (
    select
      lower(public.immutable_unaccent(trim(regexp_replace(coalesce(p_query, ''), '[^[:alnum:]'' -]', ' ', 'g')))) as query,
      greatest(1, least(coalesce(p_limit, 8), 50)) as result_limit,
      greatest(0, coalesce(p_offset, 0)) as result_offset
  ),
  visible as (
    select
      pr.id,
      case pr.collection
        when 'programs' then 'Programs'
        when 'events' then 'Events'
        when 'announcements' then 'Announcements'
        when 'transparencyDocs' then 'Documents'
        when 'facebookPosts' then 'News'
        when 'council' then 'Officials'
        when 'services' then 'Services'
      end as result_type,
      coalesce(pr.data ->> 'title', pr.data ->> 'name', pr.data ->> 'position', '') as result_title,
      left(coalesce(
        pr.data ->> 'summary',
        pr.data ->> 'excerpt',
        pr.data ->> 'description',
        pr.data ->> 'bio',
        pr.data ->> 'tagline',
        ''
      ), 240) as result_snippet,
      coalesce(
        pr.data ->> 'date',
        pr.data ->> 'publishedDate',
        pr.data ->> 'timeline',
        ''
      ) as result_date,
      case pr.collection
        when 'programs' then '/?page=programs'
        when 'events' then '/?page=events'
        when 'announcements' then '/?page=announcements'
        when 'transparencyDocs' then '/?page=transparency'
        when 'facebookPosts' then '/?page=home'
        when 'council' then '/?page=about'
        when 'services' then '/?page=services'
      end as result_href,
      lower(public.immutable_unaccent(pr.data::text)) as search_text,
      lower(public.immutable_unaccent(coalesce(pr.data ->> 'title', pr.data ->> 'name', pr.data ->> 'position', ''))) as title_text
    from public.portal_records pr
    where (
      pr.collection in ('programs', 'events', 'council', 'facebookPosts')
      or (pr.collection = 'announcements' and pr.data ->> 'status' = 'Published')
      or (pr.collection = 'services' and pr.data ->> 'isActive' = 'true')
      or (pr.collection = 'transparencyDocs' and pr.data ->> 'isPublic' = 'true')
    )
  ),
  ranked as (
    select
      visible.*,
      (
        case when title_text like '%' || input.query || '%' then 100 else 0 end
        + similarity(search_text, input.query) * 40
        + case when search_text like '%' || input.query || '%' then 20 else 0 end
      )::real as result_score
    from visible cross join input
    where input.query <> ''
      and (
        title_text like '%' || input.query || '%'
        or search_text like '%' || input.query || '%'
        or similarity(search_text, input.query) >= 0.18
      )
  ),
  counted as (
    select ranked.*, count(*) over () as matching_count
    from ranked
    where result_score > 5
  )
  select
    id,
    result_type,
    result_title,
    result_snippet,
    result_date,
    result_href || '&item=' || id,
    result_score,
    matching_count
  from counted
  order by result_score desc, result_date desc nulls last, result_title asc
  limit (select result_limit from input)
  offset (select result_offset from input);
end;
$$;

revoke all on function public.search_public_content(text, integer, integer) from public;
grant execute on function public.search_public_content(text, integer, integer) to anon, authenticated;
