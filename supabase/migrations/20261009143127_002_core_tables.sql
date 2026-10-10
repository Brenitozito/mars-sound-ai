create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 50),
  handle text not null unique check (handle ~ '^[a-z0-9_.]{3,30}$'),
  bio text not null default '' check (char_length(bio) <= 160),
  avatar_path text,
  banner_path text,
  is_public boolean not null default true,
  favorite_genres text[] not null default '{}' check (cardinality(favorite_genres) <= 21),
  moods text[] not null default '{}' check (cardinality(moods) <= 10),
  followers_count integer not null default 0 check (followers_count >= 0),
  following_count integer not null default 0 check (following_count >= 0),
  role public.user_role not null default 'user',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  genre text not null references public.genres (name) on update cascade,
  album text check (album is null or char_length(album) <= 80),
  description text check (description is null or char_length(description) <= 500),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  ai_generator text check (ai_generator is null or char_length(ai_generator) <= 50),
  prompt text check (prompt is null or char_length(prompt) <= 1000),
  audio_path text not null,
  cover_path text,
  duration_seconds integer not null check (duration_seconds > 0),
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes between 1 and 52428800),
  audio_format text check (audio_format is null or audio_format in ('mp3', 'wav')),
  play_count bigint not null default 0 check (play_count >= 0),
  like_count integer not null default 0 check (like_count >= 0),
  status public.track_status not null default 'published',
  published_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.track_moods (
  track_id uuid not null references public.tracks (id) on delete cascade,
  mood text not null references public.moods (name) on update cascade,
  primary key (track_id, mood)
);

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  description text not null default '' check (char_length(description) <= 300),
  cover_path text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.playlist_tracks (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  position integer not null check (position >= 0),
  added_at timestamptz not null default now(),
  primary key (playlist_id, track_id),
  -- Deferrable para permitir reordenar faixas (swap de posições) dentro de uma única transação.
  constraint playlist_tracks_position_key unique (playlist_id, position) deferrable initially deferred
);

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followed_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint follows_no_self_follow check (follower_id <> followed_id)
);

create table public.plays (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  played_at timestamptz not null default now()
);

create index tracks_artist_id_created_at_idx on public.tracks (artist_id, created_at desc);
create index tracks_status_created_at_idx on public.tracks (status, created_at desc);
create index tracks_status_play_count_idx on public.tracks (status, play_count desc);
create index tracks_genre_idx on public.tracks (genre);
create index tracks_title_trgm_idx on public.tracks using gin (title extensions.gin_trgm_ops);
create index tracks_album_trgm_idx on public.tracks using gin (album extensions.gin_trgm_ops);
create index tracks_tags_gin_idx on public.tracks using gin (tags);

create index track_moods_mood_idx on public.track_moods (mood);

create index playlists_owner_id_idx on public.playlists (owner_id);

create index playlist_tracks_track_id_idx on public.playlist_tracks (track_id);

create index favorites_user_id_created_at_idx on public.favorites (user_id, created_at desc);
create index favorites_track_id_idx on public.favorites (track_id);

create index follows_followed_id_idx on public.follows (followed_id);

create index plays_user_id_played_at_idx on public.plays (user_id, played_at desc);
create index plays_track_id_played_at_idx on public.plays (track_id, played_at desc);

create index profiles_handle_trgm_idx on public.profiles using gin (handle extensions.gin_trgm_ops);
create index profiles_followers_count_idx on public.profiles (followers_count desc);

alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.track_moods enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.favorites enable row level security;
alter table public.follows enable row level security;
alter table public.plays enable row level security;
