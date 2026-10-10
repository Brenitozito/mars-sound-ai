-- Buckets públicos: leitura por URL pública (streaming sem URL assinada). Escrita e listagem
-- continuam restritas pelas políticas abaixo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('audio-tracks', 'audio-tracks', true, 52428800,
    array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave']),
  ('track-covers', 'track-covers', true, 2097152, array['image/jpeg', 'image/png']),
  ('user-avatars', 'user-avatars', true, 2097152, array['image/jpeg', 'image/png']),
  ('playlist-covers', 'playlist-covers', true, 2097152, array['image/jpeg', 'image/png'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Convenção de caminho: <auth.uid()>/<arquivo>. A primeira pasta identifica o dono.
create policy storage_objects_owner_select on storage.objects
  for select to authenticated
  using (
    bucket_id in ('audio-tracks', 'track-covers', 'user-avatars', 'playlist-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy storage_objects_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('audio-tracks', 'track-covers', 'user-avatars', 'playlist-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy storage_objects_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('audio-tracks', 'track-covers', 'user-avatars', 'playlist-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('audio-tracks', 'track-covers', 'user-avatars', 'playlist-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy storage_objects_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('audio-tracks', 'track-covers', 'user-avatars', 'playlist-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
