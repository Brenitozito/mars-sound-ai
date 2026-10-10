create extension if not exists unaccent with schema extensions;

-- Funções futuras em private nascem sem EXECUTE para PUBLIC; cada grant passa a ser explícito.
alter default privileges in schema private revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Forma de 2 argumentos do unaccent: a de 1 argumento depende do search_path e não é imutável.
create or replace function private.normalize_search_text(p_text text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(p_text, '')));
$$;

-- array_to_string é STABLE (anyarray); para text[] o resultado é determinístico, o que permite
-- declarar o wrapper como IMMUTABLE e usá-lo na coluna gerada.
create or replace function private.tracks_search_document(p_title text, p_album text, p_genre text, p_tags text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select private.normalize_search_text(
    p_title || ' ' || coalesce(p_album, '') || ' ' || p_genre || ' ' || array_to_string(p_tags, ' ')
  );
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'moderator')
  );
$$;

create or replace function private.get_profile_handle(p_profile_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.handle from public.profiles p where p.id = p_profile_id;
$$;

-- ---------------------------------------------------------------------------
-- Criação automática de perfil
-- ---------------------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email_local text := split_part(coalesce(new.email, ''), '@', 1);
  v_display_name text;
  v_handle_base text;
  v_handle text;
  v_violated_constraint text;
begin
  v_display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    btrim(v_email_local)
  );
  v_display_name := btrim(left(v_display_name, 50));
  if char_length(v_display_name) < 2 then
    v_display_name := 'Usuário';
  end if;

  v_handle_base := left(
    regexp_replace(private.normalize_search_text(v_email_local), '[^a-z0-9_.]', '', 'g'),
    24
  );
  if char_length(v_handle_base) < 3 then
    v_handle_base := 'user';
  end if;

  -- Tentativa 0: handle base; 1..20: sufixo aleatório de 4 dígitos; 21: sufixo de 8 hex do uuid
  -- (base truncada em 21 para respeitar o limite de 30 caracteres). O bloco de exceção cobre a
  -- corrida entre cadastros simultâneos que passam pelo EXISTS ao mesmo tempo.
  for v_attempt in 0..21 loop
    v_handle := case
      when v_attempt = 0 then v_handle_base
      when v_attempt <= 20 then v_handle_base || '_' || lpad(floor(random() * 10000)::integer::text, 4, '0')
      else left(v_handle_base, 21) || '_' || left(replace(gen_random_uuid()::text, '-', ''), 8)
    end;

    continue when exists (select 1 from public.profiles p where p.handle = v_handle);

    begin
      insert into public.profiles (id, display_name, handle)
      values (new.id, v_display_name, v_handle);
      return new;
    exception when unique_violation then
      get stacked diagnostics v_violated_constraint = constraint_name;
      if v_violated_constraint is distinct from 'profiles_handle_key' then
        raise;
      end if;
    end;
  end loop;

  raise exception 'Não foi possível criar o perfil do usuário.' using errcode = 'P0001';
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Em profiles e tracks o trigger lista as colunas editáveis para que atualizações de contadores
-- (plays, likes, follows) e de last_login_at não alterem updated_at.
create trigger profiles_touch_updated_at
  before update of display_name, handle, bio, avatar_path, banner_path, is_public, favorite_genres, moods, role
  on public.profiles
  for each row execute function private.touch_updated_at();

create trigger tracks_touch_updated_at
  before update of artist_id, title, genre, album, description, tags, ai_generator, prompt, audio_path, cover_path,
    duration_seconds, file_size_bytes, audio_format, status, published_at
  on public.tracks
  for each row execute function private.touch_updated_at();

create trigger playlists_touch_updated_at
  before update on public.playlists
  for each row execute function private.touch_updated_at();

create trigger comments_touch_updated_at
  before update on public.comments
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Contadores desnormalizados
-- ---------------------------------------------------------------------------

create or replace function private.increment_play_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tracks
  set play_count = play_count + 1
  where id = new.track_id;
  return null;
end;
$$;

create trigger plays_increment_play_count
  after insert on public.plays
  for each row execute function private.increment_play_count();

-- Um único UPDATE nos dois perfis evita deadlock quando A e B se seguem ao mesmo tempo.
create or replace function private.sync_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles p
    set followers_count = p.followers_count + (case when p.id = new.followed_id then 1 else 0 end),
        following_count = p.following_count + (case when p.id = new.follower_id then 1 else 0 end)
    where p.id in (new.followed_id, new.follower_id);
  elsif tg_op = 'DELETE' then
    update public.profiles p
    set followers_count = case when p.id = old.followed_id then greatest(p.followers_count - 1, 0) else p.followers_count end,
        following_count = case when p.id = old.follower_id then greatest(p.following_count - 1, 0) else p.following_count end
    where p.id in (old.followed_id, old.follower_id);
  end if;
  return null;
end;
$$;

create trigger follows_sync_counts
  after insert or delete on public.follows
  for each row execute function private.sync_follow_counts();

create or replace function private.sync_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.tracks set like_count = like_count + 1 where id = new.track_id;
  elsif tg_op = 'DELETE' then
    update public.tracks set like_count = greatest(like_count - 1, 0) where id = old.track_id;
  end if;
  return null;
end;
$$;

create trigger likes_sync_count
  after insert or delete on public.likes
  for each row execute function private.sync_like_count();

-- ---------------------------------------------------------------------------
-- Validações
-- ---------------------------------------------------------------------------

create or replace function private.enforce_max_track_moods()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.tracks where id = new.track_id for update;

  if (select count(*) from public.track_moods tm where tm.track_id = new.track_id) >= 3 then
    raise exception 'Uma faixa pode ter no máximo 3 moods.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger track_moods_enforce_max
  before insert on public.track_moods
  for each row execute function private.enforce_max_track_moods();

create or replace function private.validate_profile_preferences()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Remove duplicatas preservando a ordem escolhida pelo usuário.
  new.favorite_genres := array(
    select item from unnest(new.favorite_genres) with ordinality as u(item, ord)
    group by item order by min(ord)
  );
  new.moods := array(
    select item from unnest(new.moods) with ordinality as u(item, ord)
    group by item order by min(ord)
  );

  if exists (
    select 1 from unnest(new.favorite_genres) as item
    where not exists (select 1 from public.genres g where g.name = item)
  ) then
    raise exception 'Preferência de gênero inválida.' using errcode = '23514';
  end if;

  if exists (
    select 1 from unnest(new.moods) as item
    where not exists (select 1 from public.moods m where m.name = item)
  ) then
    raise exception 'Preferência de mood inválida.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger profiles_validate_preferences
  before insert or update of favorite_genres, moods on public.profiles
  for each row execute function private.validate_profile_preferences();

-- ---------------------------------------------------------------------------
-- Notificações
-- ---------------------------------------------------------------------------

create or replace function private.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, message, actor_id, entity_id, entity_type)
  select new.followed_id, 'follow', 'Novo seguidor', p.display_name || ' começou a seguir você.',
         new.follower_id, new.follower_id, 'user'
  from public.profiles p
  where p.id = new.follower_id;
  return null;
end;
$$;

create trigger follows_notify
  after insert on public.follows
  for each row execute function private.notify_on_follow();

create or replace function private.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, message, actor_id, entity_id, entity_type)
  select t.artist_id, 'like', 'Nova curtida', p.display_name || ' curtiu “' || t.title || '”.',
         new.user_id, t.id, 'track'
  from public.tracks t
  join public.profiles p on p.id = new.user_id
  where t.id = new.track_id
    and t.artist_id <> new.user_id;
  return null;
end;
$$;

create trigger likes_notify
  after insert on public.likes
  for each row execute function private.notify_on_like();

-- ---------------------------------------------------------------------------
-- Busca textual
-- ---------------------------------------------------------------------------

alter table public.tracks
  add column search_document text
  generated always as (private.tracks_search_document(title, album, genre, tags)) stored;

create index tracks_search_document_trgm_idx on public.tracks using gin (search_document extensions.gin_trgm_ops);

drop index public.tracks_title_trgm_idx;
drop index public.tracks_album_trgm_idx;

-- ---------------------------------------------------------------------------
-- Privilégios
-- ---------------------------------------------------------------------------

-- service_role precisa do mesmo acesso: a coluna gerada de tracks e a view de faixas executam
-- funções de private com o papel de quem faz a consulta.
grant usage on schema private to authenticated, service_role;

revoke execute on all functions in schema private from public, anon, authenticated;

grant execute on function
  private.normalize_search_text(text),
  private.tracks_search_document(text, text, text, text[]),
  private.is_staff(),
  private.get_profile_handle(uuid)
to authenticated, service_role;
