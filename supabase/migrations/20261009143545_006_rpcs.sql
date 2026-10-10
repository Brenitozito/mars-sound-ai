-- ---------------------------------------------------------------------------
-- View de faixas com artista
-- ---------------------------------------------------------------------------

create view public.tracks_with_artist
with (security_invoker = true)
as
select
  t.id,
  t.artist_id,
  t.title,
  t.genre,
  t.album,
  t.description,
  t.tags,
  t.ai_generator,
  t.prompt,
  t.audio_path,
  t.cover_path,
  t.duration_seconds,
  t.file_size_bytes,
  t.audio_format,
  t.play_count,
  t.like_count,
  t.status,
  t.published_at,
  t.created_at,
  t.updated_at,
  private.get_profile_handle(t.artist_id) as artist_handle,
  coalesce(
    (select array_agg(tm.mood order by tm.mood) from public.track_moods tm where tm.track_id = t.id),
    '{}'
  ) as moods
from public.tracks t;

-- A view é auto-atualizável; só leitura é concedida.
revoke all on public.tracks_with_artist from anon, authenticated;
grant select on public.tracks_with_artist to authenticated;

-- ---------------------------------------------------------------------------
-- Helpers privados usados pelas RPCs
-- ---------------------------------------------------------------------------

create or replace function private.clamp_limit(p_value integer, p_default integer)
returns integer
language sql
immutable
parallel safe
set search_path = ''
as $$
  select least(greatest(coalesce(p_value, p_default), 1), 50);
$$;

-- SECURITY DEFINER: o ranking semanal agrega plays de todos os usuários, invisíveis pelo RLS.
-- Devolve apenas totais de faixas publicadas.
create or replace function private.weekly_play_counts(p_since timestamptz)
returns table (track_id uuid, play_total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select pl.track_id, count(*)::bigint
  from public.plays pl
  join public.tracks t on t.id = pl.track_id and t.status = 'published'
  where pl.played_at >= p_since
  group by pl.track_id;
$$;

-- O UPDATE adquire o lock de linha da playlist até o fim da transação (equivalente ao FOR UPDATE),
-- serializando alterações concorrentes e renovando updated_at no mesmo passo. Roda como invoker,
-- então o RLS de playlists garante a posse.
create or replace function private.claim_owned_playlist(p_playlist_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.playlists
  set updated_at = now()
  where id = p_playlist_id
    and owner_id = (select auth.uid());

  if not found then
    raise exception 'Playlist não encontrada.' using errcode = 'PT404';
  end if;
end;
$$;

-- O valor é sempre sobrescrito pelo trigger touch_updated_at; o grant só viabiliza o UPDATE acima.
grant update (updated_at) on public.playlists to authenticated;

grant execute on function
  private.clamp_limit(integer, integer),
  private.weekly_play_counts(timestamptz),
  private.claim_owned_playlist(uuid)
to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RPCs de leitura
-- ---------------------------------------------------------------------------

create or replace function public.get_profile_stats(p_user_id uuid)
returns table (tracks_count bigint, total_plays bigint, followers_count integer, following_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.tracks_count, s.total_plays, p.followers_count, p.following_count
  from public.profiles p
  cross join lateral (
    select count(*) as tracks_count, coalesce(sum(t.play_count), 0)::bigint as total_plays
    from public.tracks t
    where t.artist_id = p.id
      and t.status = 'published'
  ) as s
  where p.id = p_user_id;
$$;

create or replace function public.search_tracks(
  p_query text default '',
  p_genres text[] default '{}',
  p_moods text[] default '{}',
  p_sort text default 'popular',
  p_offset integer default 0,
  p_limit integer default 12
)
returns table (
  id uuid,
  artist_id uuid,
  title text,
  genre text,
  album text,
  description text,
  tags text[],
  ai_generator text,
  prompt text,
  audio_path text,
  cover_path text,
  duration_seconds integer,
  file_size_bytes bigint,
  audio_format text,
  play_count bigint,
  like_count integer,
  status public.track_status,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  artist_handle text,
  moods text[],
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_query text := btrim(regexp_replace(private.normalize_search_text(btrim(p_query)), '^@+', ''));
  -- Escapa curingas do LIKE para que '%' e '_' digitados sejam tratados como literais.
  v_pattern text := '%' || replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  v_genres text[] := coalesce(p_genres, '{}');
  v_moods text[] := coalesce(p_moods, '{}');
begin
  if p_sort is null or p_sort not in ('popular', 'recent') then
    raise exception 'Ordenação inválida.' using errcode = '23514';
  end if;

  return query
  select v.*, count(*) over ()
  from public.tracks t
  join public.tracks_with_artist v on v.id = t.id
  where t.status = 'published'
    and (v_query = '' or t.search_document like v_pattern or v.artist_handle like v_pattern)
    and (cardinality(v_genres) = 0 or t.genre = any (v_genres))
    and (
      cardinality(v_moods) = 0
      or exists (select 1 from public.track_moods tm where tm.track_id = t.id and tm.mood = any (v_moods))
    )
  order by
    case when p_sort = 'popular' then t.play_count end desc nulls last,
    t.created_at desc,
    t.id
  offset greatest(coalesce(p_offset, 0), 0)
  limit private.clamp_limit(p_limit, 12);
end;
$$;

create or replace function public.get_recommended_tracks(p_limit integer default 14)
returns setof public.tracks_with_artist
language sql
stable
security invoker
set search_path = ''
as $$
  select v.*
  from public.tracks_with_artist v
  left join public.profiles me on me.id = (select auth.uid())
  where v.status = 'published'
    and v.artist_id is distinct from (select auth.uid())
  order by
    (
      (case when v.genre = any (me.favorite_genres) then 2 else 0 end)
      + (select count(*) from unnest(v.moods) as m where m = any (me.moods))
    ) desc,
    v.play_count desc,
    v.created_at desc,
    v.id
  limit private.clamp_limit(p_limit, 14);
$$;

create or replace function public.get_weekly_highlights(p_limit integer default 14)
returns setof public.tracks_with_artist
language sql
stable
security invoker
set search_path = ''
as $$
  select v.*
  from public.tracks_with_artist v
  left join private.weekly_play_counts(now() - interval '7 days') w on w.track_id = v.id
  where v.status = 'published'
  order by coalesce(w.play_total, 0) desc, v.play_count desc, v.created_at desc, v.id
  limit private.clamp_limit(p_limit, 14);
$$;

create or replace function public.get_recently_played(p_limit integer default 20)
returns table (track_id uuid, last_played_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select pl.track_id, max(pl.played_at)
  from public.plays pl
  where pl.user_id = (select auth.uid())
    and exists (select 1 from public.tracks t where t.id = pl.track_id)
  group by pl.track_id
  order by max(pl.played_at) desc
  limit private.clamp_limit(p_limit, 20);
$$;

create or replace function public.get_featured_genres(p_limit integer default 12)
returns table (genre text, track_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select g.name, count(*)
  from public.genres g
  join public.tracks t on t.genre = g.name
  where t.status = 'published'
  group by g.name, g.sort_order
  order by count(*) desc, g.sort_order, g.name
  limit private.clamp_limit(p_limit, 12);
$$;

-- ---------------------------------------------------------------------------
-- RPCs de playlist
-- ---------------------------------------------------------------------------

create or replace function public.add_track_to_playlist(p_playlist_id uuid, p_track_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  perform private.claim_owned_playlist(p_playlist_id);

  if not exists (select 1 from public.tracks t where t.id = p_track_id) then
    raise exception 'Música não encontrada.' using errcode = 'PT404';
  end if;

  if exists (
    select 1 from public.playlist_tracks pt
    where pt.playlist_id = p_playlist_id and pt.track_id = p_track_id
  ) then
    raise exception 'Esta música já está na playlist.' using errcode = 'PT409';
  end if;

  insert into public.playlist_tracks (playlist_id, track_id, position)
  select p_playlist_id, p_track_id, coalesce(max(pt.position), -1) + 1
  from public.playlist_tracks pt
  where pt.playlist_id = p_playlist_id;
end;
$$;

create or replace function public.remove_track_from_playlist(p_playlist_id uuid, p_track_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  perform private.claim_owned_playlist(p_playlist_id);

  delete from public.playlist_tracks pt
  where pt.playlist_id = p_playlist_id and pt.track_id = p_track_id;

  update public.playlist_tracks pt
  set position = ranked.new_position
  from (
    select r.track_id, (row_number() over (order by r.position) - 1)::integer as new_position
    from public.playlist_tracks r
    where r.playlist_id = p_playlist_id
  ) as ranked
  where pt.playlist_id = p_playlist_id
    and pt.track_id = ranked.track_id
    and pt.position <> ranked.new_position;
end;
$$;

create or replace function public.reorder_playlist_tracks(p_playlist_id uuid, p_track_ids uuid[])
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  perform private.claim_owned_playlist(p_playlist_id);

  if p_track_ids is null
     or cardinality(p_track_ids) <> (select count(distinct x) from unnest(p_track_ids) as x)
     or exists (
       select unnest(p_track_ids)
       except
       select pt.track_id from public.playlist_tracks pt where pt.playlist_id = p_playlist_id
     )
     or exists (
       select pt.track_id from public.playlist_tracks pt where pt.playlist_id = p_playlist_id
       except
       select unnest(p_track_ids)
     )
  then
    raise exception 'A ordem enviada não corresponde às músicas da playlist.' using errcode = 'PT409';
  end if;

  update public.playlist_tracks pt
  set position = (ord.idx - 1)::integer
  from unnest(p_track_ids) with ordinality as ord(track_id, idx)
  where pt.playlist_id = p_playlist_id
    and pt.track_id = ord.track_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privilégios de execução
-- ---------------------------------------------------------------------------

revoke execute on function
  public.get_profile_stats(uuid),
  public.search_tracks(text, text[], text[], text, integer, integer),
  public.get_recommended_tracks(integer),
  public.get_weekly_highlights(integer),
  public.get_recently_played(integer),
  public.get_featured_genres(integer),
  public.add_track_to_playlist(uuid, uuid),
  public.remove_track_from_playlist(uuid, uuid),
  public.reorder_playlist_tracks(uuid, uuid[])
from public, anon;

grant execute on function
  public.get_profile_stats(uuid),
  public.search_tracks(text, text[], text[], text, integer, integer),
  public.get_recommended_tracks(integer),
  public.get_weekly_highlights(integer),
  public.get_recently_played(integer),
  public.get_featured_genres(integer),
  public.add_track_to_playlist(uuid, uuid),
  public.remove_track_from_playlist(uuid, uuid),
  public.reorder_playlist_tracks(uuid, uuid[])
to authenticated;
