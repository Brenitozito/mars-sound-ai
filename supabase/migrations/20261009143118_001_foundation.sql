create extension if not exists pg_trgm with schema extensions;

-- Schema reservado para funções security definer; fica fora do alcance da Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.user_role as enum ('user', 'creator', 'admin', 'moderator');
create type public.track_status as enum ('draft', 'processing', 'published', 'archived', 'rejected');
create type public.report_status as enum ('pending', 'reviewed', 'resolved', 'dismissed');
create type public.notification_type as enum ('like', 'comment', 'follow', 'playlist_add', 'new_track', 'system');

create table public.genres (
  name text primary key check (char_length(btrim(name)) between 1 and 40),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  color text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.moods (
  name text primary key check (char_length(btrim(name)) between 1 and 40),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  color text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.genres enable row level security;
alter table public.moods enable row level security;

create policy genres_select on public.genres
  for select to authenticated
  using (true);

create policy moods_select on public.moods
  for select to authenticated
  using (true);
