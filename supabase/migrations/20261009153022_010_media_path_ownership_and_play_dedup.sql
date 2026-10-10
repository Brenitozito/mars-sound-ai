-- Caminhos de mídia devem ficar na pasta do dono da linha (<uid>/...). Como CHECK, a regra vale para
-- qualquer papel e impede que uma linha aponte para arquivos de outro usuário.
alter table public.tracks
  add constraint tracks_audio_path_owner_check check (split_part(audio_path, '/', 1) = artist_id::text),
  add constraint tracks_cover_path_owner_check check (cover_path is null or split_part(cover_path, '/', 1) = artist_id::text);

alter table public.playlists
  add constraint playlists_cover_path_owner_check check (cover_path is null or split_part(cover_path, '/', 1) = owner_id::text);

alter table public.profiles
  add constraint profiles_avatar_path_owner_check check (avatar_path is null or split_part(avatar_path, '/', 1) = id::text),
  add constraint profiles_banner_path_owner_check check (banner_path is null or split_part(banner_path, '/', 1) = id::text);

-- Um play repetido do mesmo usuário na mesma faixa dentro da duração dela (mínimo 30 s) apenas
-- renova o played_at do play anterior: o histórico de recentes continua correto, mas play_count e
-- o ranking semanal não podem ser inflados por chamadas em sequência. O advisory lock serializa
-- inserções concorrentes do mesmo par usuário/faixa.
create or replace function private.collapse_repeated_play()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window interval;
  v_renewed_play_id bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':' || new.track_id::text, 0));

  select make_interval(secs => greatest(coalesce(t.duration_seconds, 0), 30)::double precision)
  into v_window
  from public.tracks t
  where t.id = new.track_id;

  update public.plays pl
  set played_at = new.played_at
  where pl.id = (
    select recent.id
    from public.plays recent
    where recent.user_id = new.user_id
      and recent.track_id = new.track_id
      and recent.played_at > new.played_at - coalesce(v_window, interval '30 seconds')
    order by recent.played_at desc
    limit 1
  )
  returning pl.id into v_renewed_play_id;

  if v_renewed_play_id is not null then
    return null;
  end if;
  return new;
end;
$$;

create trigger plays_collapse_repeated
  before insert on public.plays
  for each row execute function private.collapse_repeated_play();

-- Seguir, deixar de seguir e seguir de novo não gera nova notificação para o mesmo par em 24 h.
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
  where p.id = new.follower_id
    and not exists (
      select 1
      from public.notifications n
      where n.user_id = new.followed_id
        and n.actor_id = new.follower_id
        and n.type = 'follow'
        and n.created_at > now() - interval '24 hours'
    );
  return null;
end;
$$;
