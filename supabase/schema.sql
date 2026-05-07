-- =====================================================================
-- Plumely — initial schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- 1. lights — catalog of fixtures uploaded by users (one row per unique light)
create table if not exists public.lights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  brand       text,
  sku         text,
  image_path  text not null,         -- path inside the 'plumely-uploads' storage bucket
  created_at  timestamptz not null default now()
);

create index if not exists lights_user_id_idx on public.lights (user_id);

-- 2. generations — one row per visualization attempt
create type generation_status as enum (
  'pending', 'running', 'succeeded', 'failed'
);

create table if not exists public.generations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  light_id            uuid references public.lights(id) on delete set null,
  room_image_path     text not null,
  light_image_path    text not null,
  result_image_path   text,
  status              generation_status not null default 'pending',
  error               text,
  prompt              text,
  model               text,
  trigger_run_id      text,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

create index if not exists generations_user_id_idx on public.generations (user_id);
create index if not exists generations_status_idx  on public.generations (status);

-- =====================================================================
-- Row-Level Security
-- =====================================================================

alter table public.lights      enable row level security;
alter table public.generations enable row level security;

-- Each user can read/write their own rows
create policy "lights: owner read"
  on public.lights for select using (auth.uid() = user_id);
create policy "lights: owner insert"
  on public.lights for insert with check (auth.uid() = user_id);
create policy "lights: owner update"
  on public.lights for update using (auth.uid() = user_id);

create policy "generations: owner read"
  on public.generations for select using (auth.uid() = user_id);
create policy "generations: owner insert"
  on public.generations for insert with check (auth.uid() = user_id);
create policy "generations: owner update"
  on public.generations for update using (auth.uid() = user_id);

-- =====================================================================
-- Storage bucket
-- =====================================================================
-- After running this SQL:
-- 1. Storage → New bucket → name: "plumely-uploads", PRIVATE.
-- 2. Add storage policies (Storage → Policies → New policy → For full customization):
--
--      -- read your own files
--      create policy "uploads: owner read"
--        on storage.objects for select
--        using (
--          bucket_id = 'plumely-uploads'
--          and (storage.foldername(name))[1] = auth.uid()::text
--        );
--
--      -- write your own files
--      create policy "uploads: owner write"
--        on storage.objects for insert
--        with check (
--          bucket_id = 'plumely-uploads'
--          and (storage.foldername(name))[1] = auth.uid()::text
--        );
--
-- File path convention used by the app:
--   {user_id}/{generation_id}/room.{ext}
--   {user_id}/{generation_id}/light.{ext}
--   {user_id}/{generation_id}/result.png
