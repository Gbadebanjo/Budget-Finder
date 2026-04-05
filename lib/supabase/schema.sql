-- ============================================================
-- Finance Tracker — Supabase Schema + RLS Policies
-- Run this in the Supabase SQL editor
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── ENUM types ─────────────────────────────────────────────
create type user_role as enum ('admin', 'controller', 'user');
create type payment_status as enum ('pending', 'approved', 'rejected');
create type approval_action as enum ('approved', 'rejected');

-- ─── user_profiles ──────────────────────────────────────────
-- Mirrors auth.users with extra app-level fields
create table public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        user_role not null default 'user',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on new auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── payments ───────────────────────────────────────────────
create table public.payments (
  id          uuid primary key default uuid_generate_v4(),
  created_by  uuid not null references public.user_profiles(id),
  amount      numeric(12, 2) not null check (amount > 0),
  description text not null,
  status      payment_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger payments_updated_at
  before update on public.payments
  for each row execute procedure public.set_updated_at();

-- ─── approval_logs ──────────────────────────────────────────
create table public.approval_logs (
  id           uuid primary key default uuid_generate_v4(),
  payment_id   uuid not null references public.payments(id) on delete cascade,
  reviewed_by  uuid not null references public.user_profiles(id),
  action       approval_action not null,
  comment      text,
  created_at   timestamptz not null default now()
);

-- ─── Indexes ────────────────────────────────────────────────
create index on public.payments (created_by);
create index on public.payments (status);
create index on public.approval_logs (payment_id);
create index on public.approval_logs (reviewed_by);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.user_profiles enable row level security;
alter table public.payments      enable row level security;
alter table public.approval_logs enable row level security;

-- Helper: get current user's role
create or replace function public.my_role()
returns user_role language sql security definer stable as $$
  select role from public.user_profiles where id = auth.uid();
$$;

-- Helper: is current user active?
create or replace function public.is_active_user()
returns boolean language sql security definer stable as $$
  select is_active from public.user_profiles where id = auth.uid();
$$;

-- ─── user_profiles policies ─────────────────────────────────

-- Everyone can read own profile
create policy "users: read own profile"
  on public.user_profiles for select
  using (id = auth.uid());

-- Admins/Controllers can read all profiles
create policy "privileged: read all profiles"
  on public.user_profiles for select
  using (public.my_role() in ('admin', 'controller'));

-- Only admins can update any profile (role, is_active)
create policy "admin: update any profile"
  on public.user_profiles for update
  using (public.my_role() = 'admin');

-- ─── payments policies ──────────────────────────────────────

-- Users see only their own payments; admins/controllers see all
create policy "users: read own payments"
  on public.payments for select
  using (
    created_by = auth.uid()
    or public.my_role() in ('admin', 'controller')
  );

-- Any active authenticated user can create a payment
create policy "users: create payment"
  on public.payments for insert
  with check (
    auth.uid() is not null
    and public.is_active_user()
    and created_by = auth.uid()
  );

-- Only controllers/admins can update status
-- (and they cannot approve their own payment)
create policy "privileged: update payment status"
  on public.payments for update
  using (
    public.my_role() in ('admin', 'controller')
    and created_by <> auth.uid()
  );

-- ─── approval_logs policies ─────────────────────────────────

-- Payment owner + controllers/admins can read logs
create policy "users: read own payment logs"
  on public.approval_logs for select
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id and p.created_by = auth.uid()
    )
    or public.my_role() in ('admin', 'controller')
  );

-- Only controllers/admins can insert logs
create policy "privileged: insert approval log"
  on public.approval_logs for insert
  with check (
    public.my_role() in ('admin', 'controller')
    and reviewed_by = auth.uid()
  );
