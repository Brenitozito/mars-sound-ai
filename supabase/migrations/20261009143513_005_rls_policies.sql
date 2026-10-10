-- ---------------------------------------------------------------------------
-- Privilégios por tabela/coluna (defesa em profundidade além do RLS)
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;

-- REVOKE de coluna não tem efeito enquanto existir o privilégio na tabela inteira; por isso
-- revoga-se o nível de tabela e concede-se somente as colunas editáveis. TRUNCATE, TRIGGER e
-- REFERENCES também saem: TRUNCATE ignora RLS.
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from authenticated;

grant update (display_name, handle, bio, avatar_path, banner_path, is_public, favorite_genres, moods)
  on public.profiles to authenticated;

grant insert (id, artist_id, title, genre, album, description, tags, ai_generator, prompt, audio_path, cover_path,
              duration_seconds, file_size_bytes, audio_format, status)
  on public.tracks to authenticated;
grant update (title, genre, album, description, tags, ai_generator, prompt, cover_path, status)
  on public.tracks to authenticated;
grant delete on public.tracks to authenticated;

grant insert (track_id, mood) on public.track_moods to authenticated;
grant delete on public.track_moods to authenticated;

grant insert (id, owner_id, title, description, cover_path, is_public) on public.playlists to authenticated;
grant update (title, description, cover_path, is_public) on public.playlists to authenticated;
grant delete on public.playlists to authenticated;

grant insert (playlist_id, track_id, position) on public.playlist_tracks to authenticated;
grant update (position) on public.playlist_tracks to authenticated;
grant delete on public.playlist_tracks to authenticated;

grant insert (user_id, track_id) on public.favorites to authenticated;
grant delete on public.favorites to authenticated;

grant insert (user_id, track_id) on public.likes to authenticated;
grant delete on public.likes to authenticated;

grant insert (follower_id, followed_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

grant insert (user_id, track_id) on public.plays to authenticated;

grant insert (id, user_id, track_id, parent_id, content) on public.comments to authenticated;
grant update (content) on public.comments to authenticated;
grant delete on public.comments to authenticated;

grant update (is_read, read_at) on public.notifications to authenticated;

grant insert (reporter_id, entity_id, entity_type, reason, description) on public.reports to authenticated;
grant update (status, resolved_by, resolved_at) on public.reports to authenticated;

-- ---------------------------------------------------------------------------
-- Políticas (uma por comando para evitar múltiplas políticas permissivas)
-- ---------------------------------------------------------------------------

-- profiles
create policy profiles_select on public.profiles
  for select to authenticated
  using (is_public or id = (select auth.uid()) or (select private.is_staff()));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- tracks
create policy tracks_select on public.tracks
  for select to authenticated
  using (status = 'published' or artist_id = (select auth.uid()) or (select private.is_staff()));

create policy tracks_insert on public.tracks
  for insert to authenticated
  with check (artist_id = (select auth.uid()) and status in ('draft', 'published'));

-- Faixas rejeitadas pela moderação ficam fora do USING para o artista não republicá-las.
create policy tracks_update on public.tracks
  for update to authenticated
  using (artist_id = (select auth.uid()) and status <> 'rejected')
  with check (artist_id = (select auth.uid()) and status in ('draft', 'published', 'archived'));

create policy tracks_delete on public.tracks
  for delete to authenticated
  using (artist_id = (select auth.uid()) or (select private.is_staff()));

-- track_moods (visibilidade herdada do RLS de tracks)
create policy track_moods_select on public.track_moods
  for select to authenticated
  using (exists (select 1 from public.tracks t where t.id = track_id));

create policy track_moods_insert on public.track_moods
  for insert to authenticated
  with check (exists (select 1 from public.tracks t where t.id = track_id and t.artist_id = (select auth.uid())));

create policy track_moods_delete on public.track_moods
  for delete to authenticated
  using (exists (select 1 from public.tracks t where t.id = track_id and t.artist_id = (select auth.uid())));

-- playlists
create policy playlists_select on public.playlists
  for select to authenticated
  using (is_public or owner_id = (select auth.uid()));

create policy playlists_insert on public.playlists
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy playlists_update on public.playlists
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy playlists_delete on public.playlists
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- playlist_tracks (visibilidade herdada do RLS de playlists)
create policy playlist_tracks_select on public.playlist_tracks
  for select to authenticated
  using (exists (select 1 from public.playlists p where p.id = playlist_id));

create policy playlist_tracks_insert on public.playlist_tracks
  for insert to authenticated
  with check (
    exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = (select auth.uid()))
    and exists (select 1 from public.tracks t where t.id = track_id)
  );

create policy playlist_tracks_update on public.playlist_tracks
  for update to authenticated
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = (select auth.uid())));

create policy playlist_tracks_delete on public.playlist_tracks
  for delete to authenticated
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = (select auth.uid())));

-- favorites
create policy favorites_select on public.favorites
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy favorites_insert on public.favorites
  for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.tracks t where t.id = track_id));

create policy favorites_delete on public.favorites
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- likes
create policy likes_select on public.likes
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy likes_insert on public.likes
  for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.tracks t where t.id = track_id));

create policy likes_delete on public.likes
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- follows
create policy follows_select on public.follows
  for select to authenticated
  using (true);

create policy follows_insert on public.follows
  for insert to authenticated
  with check (follower_id = (select auth.uid()));

create policy follows_delete on public.follows
  for delete to authenticated
  using (follower_id = (select auth.uid()));

-- plays
create policy plays_select on public.plays
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy plays_insert on public.plays
  for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.tracks t where t.id = track_id));

-- comments
create policy comments_select on public.comments
  for select to authenticated
  using (exists (select 1 from public.tracks t where t.id = track_id));

create policy comments_insert on public.comments
  for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.tracks t where t.id = track_id));

create policy comments_update on public.comments
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy comments_delete on public.comments
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select private.is_staff()));

-- notifications
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- reports
create policy reports_select on public.reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select private.is_staff()));

create policy reports_insert on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()));

create policy reports_update on public.reports
  for update to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

-- audit_logs
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using ((select private.is_staff()));
