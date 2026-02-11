-- College Clubs Information Portal – Supabase schema & RLS
-- This script creates all tables, helper functions, seeds, and RLS policies
-- required by the application.

-- =========
-- Extensions
-- =========

create extension if not exists "pgcrypto";


-- =========================
-- 1. Core auth & roles data
-- =========================

create table if not exists public.roles (
  id          bigserial primary key,
  slug        text unique not null, -- e.g. student, club_admin, moderator, super_admin
  label       text not null,
  description text
);

-- Seed roles (id values will be auto-assigned)
insert into public.roles (slug, label, description)
values
  ('student', 'Student', 'Default role for authenticated students'),
  ('club_admin', 'Club Admin', 'Administrator of a specific club'),
  ('moderator', 'Moderator', 'Portal moderator with elevated privileges'),
  ('super_admin', 'Super Admin', 'Full administrative access to the portal')
on conflict (slug) do nothing;


create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  email      text unique,
  role_id    bigint references public.roles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table if not exists public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id bigint not null references public.roles (id) on delete cascade,
  primary key (user_id, role_id)
);


-- Helper to auto-update updated_at
create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- updated_at trigger for profiles
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_timestamp_on_profiles'
  ) then
    create trigger set_timestamp_on_profiles
    before update on public.profiles
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;
end;
$$;


-- Helper: current_role() -> role slug for auth.uid()
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.slug
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.user_id = auth.uid()
  limit 1;
$$;


-- Provision profile on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_role_id bigint;
begin
  select id into student_role_id
  from public.roles
  where slug = 'student'
  limit 1;

  insert into public.profiles (user_id, email, role_id)
  values (new.id, new.email, student_role_id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;


do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();
  end if;
end;
$$;


-- Restrict profiles visibility:
alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Profiles: self or admins'
  ) then
    create policy "Profiles: self or admins"
      on public.profiles
      for select
      using (
        auth.uid() = user_id
        or public.current_role() in ('moderator', 'super_admin')
      );
  end if;
end;
$$;


-- roles: simple read access for authenticated users
alter table public.roles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'roles'
      and policyname = 'Roles: readable for authenticated'
  ) then
    create policy "Roles: readable for authenticated"
      on public.roles
      for select
      using (auth.uid() is not null);
  end if;
end;
$$;


-- ========================
-- 2. Clubs & related data
-- ========================

create table if not exists public.categories (
  id          bigserial primary key,
  slug        text unique not null,
  label       text not null,
  description text,
  created_at  timestamptz not null default now()
);


create table if not exists public.clubs (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text unique not null,
  category          text not null,
  short_description text,
  long_description  text,
  website_url       text,
  email             text,
  phone             text,
  logo_url          text,
  banner_url        text,
  social_facebook   text,
  social_instagram  text,
  social_twitter    text,
  social_youtube    text,
  is_verified       boolean not null default false,
  is_active         boolean not null default true,
  website_clicks    bigint not null default 0,
  created_by        uuid references auth.users (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);


create table if not exists public.club_members (
  club_id   uuid not null references public.clubs (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  is_admin  boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);


create table if not exists public.club_requests (
  id             uuid primary key default gen_random_uuid(),
  requested_by   uuid references auth.users (id),
  club_name      text not null,
  category       text not null,
  description    text,
  website_url    text,
  social_facebook  text,
  social_instagram text,
  social_twitter   text,
  contact_name   text not null,
  contact_email  text not null,
  status         text not null default 'pending', -- pending | approved | rejected
  reviewed_by    uuid references auth.users (id),
  reviewed_at    timestamptz,
  review_notes   text,
  created_at     timestamptz not null default now()
);


create table if not exists public.updates (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references public.clubs (id) on delete cascade,
  title           text not null,
  body            text,
  type            text not null, -- notice | event | announcement etc.
  is_pinned       boolean not null default false,
  is_published    boolean not null default true,
  redirect_url    text,
  redirect_clicks bigint not null default 0,
  published_at    timestamptz not null default now(),
  created_by      uuid references auth.users (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);


create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  club_id          uuid not null references public.clubs (id) on delete cascade,
  title            text not null,
  description      text,
  location         text,
  is_online        boolean not null default false,
  start_time       timestamptz not null,
  end_time         timestamptz,
  registration_url text,
  banner_url       text,
  is_published     boolean not null default true,
  created_by       uuid references auth.users (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);


create table if not exists public.audit_logs (
  id          bigserial primary key,
  actor_id    uuid references auth.users (id),
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);


create table if not exists public.subscriptions (
  id         bigserial primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  club_id    uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, club_id)
);


-- updated_at triggers for mutable tables
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_timestamp_on_clubs'
  ) then
    create trigger set_timestamp_on_clubs
    before update on public.clubs
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_timestamp_on_updates'
  ) then
    create trigger set_timestamp_on_updates
    before update on public.updates
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_timestamp_on_events'
  ) then
    create trigger set_timestamp_on_events
    before update on public.events
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;
end;
$$;


-- Enable RLS
alter table public.categories     enable row level security;
alter table public.clubs          enable row level security;
alter table public.club_members   enable row level security;
alter table public.club_requests  enable row level security;
alter table public.updates        enable row level security;
alter table public.events         enable row level security;
alter table public.audit_logs     enable row level security;
alter table public.subscriptions  enable row level security;


-- ===============
-- RLS: categories
-- ===============

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'Categories: public read'
  ) then
    create policy "Categories: public read"
      on public.categories
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'Categories: admins manage'
  ) then
    create policy "Categories: admins manage"
      on public.categories
      for all
      using (public.current_role() in ('moderator', 'super_admin'))
      with check (public.current_role() in ('moderator', 'super_admin'));
  end if;
end;
$$;


-- ===========
-- RLS: clubs
-- ===========

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'clubs'
      and policyname = 'Clubs: public read'
  ) then
    create policy "Clubs: public read"
      on public.clubs
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'clubs'
      and policyname = 'Clubs: admins/owners manage'
  ) then
    create policy "Clubs: admins/owners manage"
      on public.clubs
      for all
      using (
        public.current_role() in ('moderator', 'super_admin')
        or exists (
          select 1
          from public.club_members cm
          where cm.club_id = clubs.id
            and cm.user_id = auth.uid()
            and cm.is_admin = true
        )
      )
      with check (
        public.current_role() in ('moderator', 'super_admin')
        or exists (
          select 1
          from public.club_members cm
          where cm.club_id = clubs.id
            and cm.user_id = auth.uid()
            and cm.is_admin = true
        )
      );
  end if;
end;
$$;


-- =================
-- RLS: club_members
-- =================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'club_members'
      and policyname = 'Club members: visible to admins and owners'
  ) then
    create policy "Club members: visible to admins and owners"
      on public.club_members
      for select
      using (
        public.current_role() in ('moderator', 'super_admin')
        or user_id = auth.uid()
        or exists (
          select 1
          from public.club_members cm2
          where cm2.club_id = club_members.club_id
            and cm2.user_id = auth.uid()
            and cm2.is_admin = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'club_members'
      and policyname = 'Club members: admins and club admins manage'
  ) then
    create policy "Club members: admins and club admins manage"
      on public.club_members
      for all
      using (
        public.current_role() in ('moderator', 'super_admin')
        or exists (
          select 1
          from public.club_members cm2
          where cm2.club_id = club_members.club_id
            and cm2.user_id = auth.uid()
            and cm2.is_admin = true
        )
      )
      with check (
        public.current_role() in ('moderator', 'super_admin')
        or exists (
          select 1
          from public.club_members cm2
          where cm2.club_id = club_members.club_id
            and cm2.user_id = auth.uid()
            and cm2.is_admin = true
        )
      );
  end if;
end;
$$;


-- =================
-- RLS: club_requests
-- =================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'club_requests'
      and policyname = 'Club requests: insert by authenticated'
  ) then
    create policy "Club requests: insert by authenticated"
      on public.club_requests
      for insert
      with check (
        auth.uid() is not null
        and requested_by = auth.uid()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'club_requests'
      and policyname = 'Club requests: owner or admins view'
  ) then
    create policy "Club requests: owner or admins view"
      on public.club_requests
      for select
      using (
        (auth.uid() is not null and requested_by = auth.uid())
        or public.current_role() in ('moderator', 'super_admin')
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'club_requests'
      and policyname = 'Club requests: admins update'
  ) then
    create policy "Club requests: admins update"
      on public.club_requests
      for update
      using (public.current_role() in ('moderator', 'super_admin'))
      with check (public.current_role() in ('moderator', 'super_admin'));
  end if;
end;
$$;


-- ================
-- RLS: updates
-- ================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'updates'
      and policyname = 'Updates: public read published'
  ) then
    create policy "Updates: public read published"
      on public.updates
      for select
      using (
        is_published = true
        or public.current_role() in ('moderator', 'super_admin')
        or exists (
          select 1
          from public.club_members cm
          where cm.club_id = updates.club_id
            and cm.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'updates'
      and policyname = 'Updates: admins and club admins manage'
  ) then
    create policy "Updates: admins and club admins manage"
      on public.updates
      for all
      using (
        public.current_role() in ('moderator', 'super_admin')
        or exists (
          select 1
          from public.club_members cm
          where cm.club_id = updates.club_id
            and cm.user_id = auth.uid()
            and cm.is_admin = true
        )
      )
      with check (
        public.current_role() in ('moderator', 'super_admin')
        or exists (
          select 1
          from public.club_members cm
          where cm.club_id = updates.club_id
            and cm.user_id = auth.uid()
            and cm.is_admin = true
        )
      );
  end if;
end;
$$;


-- ================
-- RLS: events
-- ================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'Events: public read published'
  ) then
    create policy "Events: public read published"
      on public.events
      for select
      using (
        is_published = true
        or public.current_role() in ('moderator', 'super_admin')
        or exists (
          select 1
          from public.club_members cm
          where cm.club_id = events.club_id
            and cm.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'Events: admins and club admins manage'
  ) then
    create policy "Events: admins and club admins manage"
      on public.events
      for all
      using (
        public.current_role() in ('moderator', 'super_admin')
        or exists (
          select 1
          from public.club_members cm
          where cm.club_id = events.club_id
            and cm.user_id = auth.uid()
            and cm.is_admin = true
        )
      )
      with check (
        public.current_role() in ('moderator', 'super_admin')
        or exists (
          select 1
          from public.club_members cm
          where cm.club_id = events.club_id
            and cm.user_id = auth.uid()
            and cm.is_admin = true
        )
      );
  end if;
end;
$$;


-- =================
-- RLS: audit_logs
-- =================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'Audit logs: admins read'
  ) then
    create policy "Audit logs: admins read"
      on public.audit_logs
      for select
      using (public.current_role() in ('moderator', 'super_admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'Audit logs: insert by authenticated'
  ) then
    create policy "Audit logs: insert by authenticated"
      on public.audit_logs
      for insert
      with check (auth.uid() is not null);
  end if;
end;
$$;


-- ==================
-- RLS: subscriptions
-- ==================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscriptions'
      and policyname = 'Subscriptions: self or admins'
  ) then
    create policy "Subscriptions: self or admins"
      on public.subscriptions
      for all
      using (
        user_id = auth.uid()
        or public.current_role() in ('moderator', 'super_admin')
      )
      with check (
        user_id = auth.uid()
        or public.current_role() in ('moderator', 'super_admin')
      );
  end if;
end;
$$;


-- =====================================
-- 3. Storage bucket & RLS (club-assets)
-- =====================================

insert into storage.buckets (id, name, public)
values ('club-assets', 'club-assets', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;


-- Public read access for club-assets bucket
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Storage: public read club-assets'
  ) then
    create policy "Storage: public read club-assets"
      on storage.objects
      for select
      using (bucket_id = 'club-assets');
  end if;
end;
$$;


-- Write access: moderators, super_admins, and club_admins (for their club paths)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Storage: admins and club admins write club-assets'
  ) then
    create policy "Storage: admins and club admins write club-assets"
      on storage.objects
      for all
      using (
        bucket_id = 'club-assets'
        and (
          public.current_role() in ('moderator', 'super_admin')
          or exists (
            select 1
            from public.club_members cm
            where cm.user_id = auth.uid()
              and cm.is_admin = true
              and cm.club_id = (
                -- Expect path like clubs/<club_id>/...
                nullif(split_part(objects.name, '/', 2), '')::uuid
              )
          )
        )
      )
      with check (
        bucket_id = 'club-assets'
        and (
          public.current_role() in ('moderator', 'super_admin')
          or exists (
            select 1
            from public.club_members cm
            where cm.user_id = auth.uid()
              and cm.is_admin = true
              and cm.club_id = (
                nullif(split_part(objects.name, '/', 2), '')::uuid
              )
          )
        )
      );
  end if;
end;
$$;