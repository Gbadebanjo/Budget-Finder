-- ============================================================
-- Finance Tracker — Supabase Schema + RLS Policies
-- Idempotent: safe to run against an existing database
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── ENUM types ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS enum ('admin', 'controller', 'user');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
    CREATE TYPE public.transaction_status AS enum ('pending', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_action') THEN
    CREATE TYPE public.approval_action AS enum ('approved', 'rejected');
  END IF;
END
$$;

-- ─── user_profiles ──────────────────────────────────────────
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        user_role not null default 'user',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── capital_sources ────────────────────────────────────────
create table if not exists public.capital_sources (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  amount      numeric(12, 2) not null check (amount >= 0),
  created_by  uuid not null references public.user_profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── categories ─────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  created_by  uuid not null references public.user_profiles(id),
  created_at  timestamptz not null default now()
);

-- ─── triggers ───────────────────────────────────────────────
create table if not exists public.triggers (
  id          uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name        text not null,
  price       numeric(12, 2) not null check (price >= 0),
  created_by  uuid not null references public.user_profiles(id),
  created_at  timestamptz not null default now(),
  unique(category_id, name)
);

-- ─── transactions ───────────────────────────────────────────
create table if not exists public.transactions (
  id                  uuid primary key default uuid_generate_v4(),
  transaction_date    date not null,
  beneficiaries       text not null,
  description         text not null,
  amount              numeric(12, 2) not null check (amount > 0),
  capital_source_id   uuid references public.capital_sources(id),
  category_id         uuid not null references public.categories(id),
  trigger_id          uuid references public.triggers(id),
  balance_after       numeric(12, 2),
  created_by          uuid not null references public.user_profiles(id),
  status              transaction_status not null default 'pending',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Enforce trigger belongs to the selected category (subqueries not allowed in CHECK constraints)
create or replace function public.check_trigger_category()
returns trigger language plpgsql as $$
begin
  if new.trigger_id is not null then
    if not exists (
      select 1 from public.triggers t
      where t.id = new.trigger_id and t.category_id = new.category_id
    ) then
      raise exception 'trigger does not belong to the selected category';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_trigger_category_check on public.transactions;
create trigger transactions_trigger_category_check
  before insert or update on public.transactions
  for each row execute procedure public.check_trigger_category();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Deduct from capital source balance when a transaction is approved
create or replace function public.handle_transaction_approval()
returns trigger language plpgsql as $$
begin
  -- Deduct when status changes to approved and a capital source is set
  if NEW.status = 'approved' and OLD.status <> 'approved' then
    if NEW.capital_source_id is not null then
      update public.capital_sources
      set amount = amount - NEW.amount
      where id = NEW.capital_source_id;
    end if;
  end if;
  -- Refund when status changes away from approved (e.g. re-review edge case)
  if OLD.status = 'approved' and NEW.status <> 'approved' then
    if NEW.capital_source_id is not null then
      update public.capital_sources
      set amount = amount + NEW.amount
      where id = NEW.capital_source_id;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists transactions_approval_deduct on public.transactions;
create trigger transactions_approval_deduct
  after update on public.transactions
  for each row execute procedure public.handle_transaction_approval();

drop trigger if exists capital_sources_updated_at on public.capital_sources;
create trigger capital_sources_updated_at
  before update on public.capital_sources
  for each row execute procedure public.set_updated_at();

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at
  before update on public.transactions
  for each row execute procedure public.set_updated_at();

-- ─── approval_logs ──────────────────────────────────────────
-- Drop and recreate to handle migration from old payment_id schema
drop table if exists public.approval_logs;
create table public.approval_logs (
  id             uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  reviewed_by    uuid not null references public.user_profiles(id),
  action         approval_action not null,
  comment        text,
  created_at     timestamptz not null default now()
);

-- ─── Indexes ────────────────────────────────────────────────
create index if not exists capital_sources_created_by_idx on public.capital_sources (created_by);
create index if not exists categories_created_by_idx on public.categories (created_by);
create index if not exists triggers_category_id_idx on public.triggers (category_id);
create index if not exists triggers_created_by_idx on public.triggers (created_by);
create index if not exists transactions_created_by_idx on public.transactions (created_by);
create index if not exists transactions_status_idx on public.transactions (status);
create index if not exists transactions_date_idx on public.transactions (transaction_date);
create index if not exists transactions_capital_source_idx on public.transactions (capital_source_id);
create index if not exists transactions_category_idx on public.transactions (category_id);
create index if not exists transactions_trigger_idx on public.transactions (trigger_id);
create index if not exists approval_logs_transaction_idx on public.approval_logs (transaction_id);
create index if not exists approval_logs_reviewer_idx on public.approval_logs (reviewed_by);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.user_profiles    enable row level security;
alter table public.capital_sources  enable row level security;
alter table public.categories       enable row level security;
alter table public.triggers         enable row level security;
alter table public.transactions     enable row level security;
alter table public.approval_logs    enable row level security;

create or replace function public.my_role()
returns user_role language sql security definer stable as $$
  select role from public.user_profiles where id = auth.uid();
$$;

create or replace function public.is_active_user()
returns boolean language sql security definer stable as $$
  select is_active from public.user_profiles where id = auth.uid();
$$;

create or replace function public.owns_transaction(p_transaction_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.transactions
    where id = p_transaction_id and created_by = auth.uid()
  );
$$;

-- ─── user_profiles policies ─────────────────────────────────
drop policy if exists "users: read own profile"      on public.user_profiles;
drop policy if exists "privileged: read all profiles" on public.user_profiles;
drop policy if exists "admin: update any profile"    on public.user_profiles;

create policy "users: read own profile"
  on public.user_profiles for select
  using (id = auth.uid());

create policy "privileged: read all profiles"
  on public.user_profiles for select
  using (public.my_role() in ('admin', 'controller'));

create policy "admin: update any profile"
  on public.user_profiles for update
  using (public.my_role() = 'admin');

-- ─── capital_sources policies ───────────────────────────────
drop policy if exists "users: read capital sources"  on public.capital_sources;
drop policy if exists "admin: manage capital sources" on public.capital_sources;

create policy "users: read capital sources"
  on public.capital_sources for select
  using (true);

create policy "admin: manage capital sources"
  on public.capital_sources for all
  using (public.my_role() = 'admin');

-- ─── categories policies ────────────────────────────────────
drop policy if exists "users: read categories"  on public.categories;
drop policy if exists "admin: manage categories" on public.categories;

create policy "users: read categories"
  on public.categories for select
  using (true);

create policy "admin: manage categories"
  on public.categories for all
  using (public.my_role() = 'admin');

-- ─── triggers policies ──────────────────────────────────────
drop policy if exists "users: read triggers"  on public.triggers;
drop policy if exists "admin: manage triggers" on public.triggers;

create policy "users: read triggers"
  on public.triggers for select
  using (true);

create policy "admin: manage triggers"
  on public.triggers for all
  using (public.my_role() = 'admin');

-- ─── transactions policies ──────────────────────────────────
drop policy if exists "users: read own transactions"        on public.transactions;
drop policy if exists "users: create transaction"           on public.transactions;
drop policy if exists "privileged: update transaction status" on public.transactions;

create policy "users: read own transactions"
  on public.transactions for select
  using (
    created_by = auth.uid()
    or public.my_role() in ('admin', 'controller')
  );

create policy "users: create transaction"
  on public.transactions for insert
  with check (
    auth.uid() is not null
    and public.is_active_user()
    and created_by = auth.uid()
  );

create policy "privileged: update transaction status"
  on public.transactions for update
  using (
    public.my_role() in ('admin', 'controller')
    and created_by <> auth.uid()
  );

-- ─── approval_logs policies ─────────────────────────────────
drop policy if exists "users: read own transaction logs" on public.approval_logs;
drop policy if exists "privileged: insert approval log"  on public.approval_logs;

create policy "users: read own transaction logs"
  on public.approval_logs for select
  using (
    public.owns_transaction(transaction_id)
    or public.my_role() in ('admin', 'controller')
  );

create policy "privileged: insert approval log"
  on public.approval_logs for insert
  with check (
    public.my_role() in ('admin', 'controller')
    and reviewed_by = auth.uid()
  );
