-- Qaaf cloud-save schema.
-- Run this in your Supabase project → SQL Editor.

-- One row per user holding their progress + settings blob.
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row-level security: a user can only see and write their own row.
alter table public.progress enable row level security;

drop policy if exists "own progress - select" on public.progress;
create policy "own progress - select"
  on public.progress for select
  using (auth.uid() = user_id);

drop policy if exists "own progress - upsert" on public.progress;
create policy "own progress - insert"
  on public.progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "own progress - update" on public.progress;
create policy "own progress - update"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Account deletion (App Store guideline 5.1.1(v); Google Play's account
-- deletion policy): a signed-in learner deletes their own account from
-- Settings. Removing the auth user cascades to their progress row above.
-- security definer, because a user cannot delete from auth.users directly;
-- it only ever deletes the caller's own id.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
