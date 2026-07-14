create table if not exists public.auth_restore_requests (
  token text primary key,
  initiated_by uuid not null references auth.users (id) on delete cascade,
  consumed_by uuid references auth.users (id) on delete set null,
  access_token text not null,
  refresh_token text not null,
  flow text not null default 'gmb',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index if not exists auth_restore_requests_initiated_by_idx
  on public.auth_restore_requests (initiated_by, created_at desc);

create index if not exists auth_restore_requests_expires_at_idx
  on public.auth_restore_requests (expires_at);

alter table public.auth_restore_requests enable row level security;

revoke all on public.auth_restore_requests from anon;
revoke all on public.auth_restore_requests from authenticated;

comment on table public.auth_restore_requests is
  'Short-lived server-side auth restore states for cross-account OAuth handoffs.';
