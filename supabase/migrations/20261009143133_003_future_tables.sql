create table public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null check (char_length(title) <= 120),
  message text not null check (char_length(message) <= 500),
  actor_id uuid references public.profiles (id) on delete set null,
  entity_id uuid,
  entity_type text check (entity_type is null or entity_type in ('track', 'playlist', 'comment', 'user')),
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  entity_id uuid not null,
  entity_type text not null check (entity_type in ('track', 'comment', 'user', 'playlist')),
  reason text not null check (char_length(btrim(reason)) between 3 and 120),
  description text check (description is null or char_length(description) <= 1000),
  status public.report_status not null default 'pending',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index likes_track_id_idx on public.likes (track_id);

create index comments_track_id_created_at_idx on public.comments (track_id, created_at desc);
create index comments_user_id_idx on public.comments (user_id);
create index comments_parent_id_idx on public.comments (parent_id);

create index notifications_user_id_is_read_created_at_idx on public.notifications (user_id, is_read, created_at desc);
create index notifications_actor_id_idx on public.notifications (actor_id);

create index reports_status_created_at_idx on public.reports (status, created_at desc);
create index reports_reporter_id_idx on public.reports (reporter_id);
create index reports_resolved_by_idx on public.reports (resolved_by);

create index audit_logs_user_id_created_at_idx on public.audit_logs (user_id, created_at desc);
create index audit_logs_entity_entity_id_idx on public.audit_logs (entity, entity_id);

alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
