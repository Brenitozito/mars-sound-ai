-- Opções exibidas nos formulários vêm do banco, como genres e moods. tracks.ai_generator continua
-- texto livre (até 50 caracteres): a tabela alimenta as sugestões, não restringe faixas antigas.
create table public.ai_generators (
  name text primary key check (char_length(btrim(name)) between 1 and 50),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.ai_generators enable row level security;

revoke all on public.ai_generators from anon;
revoke insert, update, delete, truncate, references, trigger on public.ai_generators from authenticated;

create policy ai_generators_select on public.ai_generators
  for select to authenticated
  using (true);

insert into public.ai_generators (name, sort_order) values
  ('Suno', 1),
  ('Udio', 2),
  ('Stable Audio', 3),
  ('MusicGen', 4),
  ('AudioCraft', 5);

create or replace function public.get_popular_tags(p_limit integer default 10)
returns table (tag text, track_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select track_tag.tag, count(*)
  from public.tracks t
  cross join lateral unnest(t.tags) as track_tag(tag)
  where t.status = 'published'
  group by track_tag.tag
  order by count(*) desc, track_tag.tag
  limit private.clamp_limit(p_limit, 10);
$$;

revoke execute on function public.get_popular_tags(integer) from public, anon;
grant execute on function public.get_popular_tags(integer) to authenticated;
