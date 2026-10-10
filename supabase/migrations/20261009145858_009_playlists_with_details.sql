-- Playlist com o handle do dono e as faixas em ordem, numa única leitura. O handle vem do helper
-- privado para que playlists públicas de perfis privados continuem exibindo o @ do dono.
create view public.playlists_with_details
with (security_invoker = true)
as
select
  p.id,
  p.owner_id,
  p.title,
  p.description,
  p.cover_path,
  p.is_public,
  p.created_at,
  p.updated_at,
  private.get_profile_handle(p.owner_id) as owner_handle,
  coalesce(
    (select array_agg(pt.track_id order by pt.position) from public.playlist_tracks pt where pt.playlist_id = p.id),
    '{}'
  ) as track_ids
from public.playlists p;

revoke all on public.playlists_with_details from anon, authenticated;
grant select on public.playlists_with_details to authenticated;
