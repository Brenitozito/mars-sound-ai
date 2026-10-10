-- Os nomes são gravados literalmente pelo front (tracks.genre, track_moods.mood, preferências do perfil);
-- não altere acentos ou maiúsculas sem migrar os dados dependentes.
insert into public.genres (name, slug, color, sort_order)
values
  ('Pop', 'pop', '#FF6B9D', 1),
  ('Rock', 'rock', '#E74C3C', 2),
  ('Eletrônica', 'eletronica', '#8E44AD', 3),
  ('Lo-fi', 'lo-fi', '#7F8C8D', 4),
  ('Ambient', 'ambient', '#4A90E2', 5),
  ('Cinematic', 'cinematic', '#34495E', 6),
  ('Gospel', 'gospel', '#F39C12', 7),
  ('Samba', 'samba', '#1ABC9C', 8),
  ('Pagode', 'pagode', '#16A085', 9),
  ('MPB', 'mpb', '#27AE60', 10),
  ('Clássica', 'classica', '#9B59B6', 11),
  ('Jazz', 'jazz', '#3498DB', 12),
  ('Blues', 'blues', '#2C3E50', 13),
  ('Hip-Hop', 'hip-hop', '#E67E22', 14),
  ('R&B', 'rnb', '#C0392B', 15),
  ('Funk', 'funk', '#D35400', 16),
  ('Sertanejo', 'sertanejo', '#B9770E', 17),
  ('Reggae', 'reggae', '#2ECC71', 18),
  ('Metal', 'metal', '#1C2833', 19),
  ('Emo', 'emo', '#6C3483', 20),
  ('Trap', 'trap', '#FF164C', 21)
on conflict (name) do update
set slug = excluded.slug,
    color = excluded.color,
    sort_order = excluded.sort_order;

insert into public.moods (name, slug, color, sort_order)
values
  ('Calmo', 'calmo', '#5DADE2', 1),
  ('Concentrado', 'concentrado', '#48C9B0', 2),
  ('Relaxante', 'relaxante', '#76D7C4', 3),
  ('Inspirador', 'inspirador', '#F7DC6F', 4),
  ('Divertido', 'divertido', '#F5B041', 5),
  ('Festivo', 'festivo', '#EC7063', 6),
  ('Sofisticado', 'sofisticado', '#AF7AC5', 7),
  ('Romântico', 'romantico', '#F1948A', 8),
  ('Introspectivo', 'introspectivo', '#5D6D7E', 9),
  ('Cativante', 'cativante', '#FF164C', 10)
on conflict (name) do update
set slug = excluded.slug,
    color = excluded.color,
    sort_order = excluded.sort_order;
