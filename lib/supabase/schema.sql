-- ============================================================
-- FinFlow — Supabase Schema + RLS
-- Generation: v2.2 (workspaces refactor; clean-slate reset block)
-- Idempotent: safe to re-run. DESTRUCTIVE on first run if the old
-- approval-flow tables exist — they will be dropped to make way
-- for the workspace-scoped schema.
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- RESET: drop legacy approval-flow objects from the v1 schema
-- so the new workspace-scoped tables can be created cleanly.
-- Safe to run repeatedly — `if exists` guards everything.
-- ============================================================

-- Auth trigger first (so dropping user_profiles doesn't fight it)
drop trigger if exists on_auth_user_created on auth.users;

-- Legacy v1 tables (had no workspace_id)
drop table if exists public.approval_logs    cascade;
drop table if exists public.transactions     cascade;
drop table if exists public.triggers         cascade;
drop table if exists public.capital_sources  cascade;
drop table if exists public.categories       cascade;
drop table if exists public.user_profiles    cascade;

-- Legacy enums
drop type  if exists public.user_role          cascade;
drop type  if exists public.transaction_status cascade;
drop type  if exists public.approval_action    cascade;

-- ─── ENUMs ──────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type public.workspace_role as enum ('owner','admin','member','viewer');
  end if;
  if not exists (select 1 from pg_type where typname = 'account_kind') then
    create type public.account_kind as enum ('bank','cash','wallet','card','savings','investment','manual');
  end if;
  if not exists (select 1 from pg_type where typname = 'account_provider') then
    create type public.account_provider as enum ('manual','mono','okra','plaid');
  end if;
  if not exists (select 1 from pg_type where typname = 'sync_status') then
    create type public.sync_status as enum ('idle','syncing','ok','failed','reauth_required');
  end if;
  if not exists (select 1 from pg_type where typname = 'tx_direction') then
    create type public.tx_direction as enum ('debit','credit');
  end if;
  if not exists (select 1 from pg_type where typname = 'budget_period') then
    create type public.budget_period as enum ('weekly','monthly','quarterly','yearly');
  end if;
  if not exists (select 1 from pg_type where typname = 'goal_status') then
    create type public.goal_status as enum ('active','paused','reached','archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'plan_tier') then
    create type public.plan_tier as enum ('free','pro','family','business');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('trialing','active','past_due','canceled','paused');
  end if;
end
$$;

-- ============================================================
-- TABLES  (defined first so function bodies validate cleanly)
-- ============================================================

-- ─── user_profiles ──────────────────────────────────────────
create table if not exists public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null default '',
  avatar_url    text,
  display_currency text not null default 'NGN',
  locale        text not null default 'en-NG',
  created_at    timestamptz not null default now()
);

-- ─── workspaces ─────────────────────────────────────────────
create table if not exists public.workspaces (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  owner_id     uuid not null references public.user_profiles(id),
  is_personal  boolean not null default false,
  display_currency text not null default 'NGN',
  timezone     text not null default 'Africa/Lagos',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references public.user_profiles(id) on delete cascade,
  role         workspace_role not null default 'member',
  joined_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ─── accounts ───────────────────────────────────────────────
create table if not exists public.accounts (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  name            text not null,
  institution     text,
  kind            account_kind not null default 'bank',
  provider        account_provider not null default 'manual',
  currency        text not null default 'NGN',
  account_mask    text,
  current_balance numeric(14,2) not null default 0,
  available_balance numeric(14,2),
  color           text not null default '#4f46e5',
  icon            text,
  is_archived     boolean not null default false,
  sync_status     sync_status not null default 'idle',
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── linked_accounts (Mono/Plaid metadata) ─────────────────
create table if not exists public.linked_accounts (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  account_id        uuid not null references public.accounts(id) on delete cascade unique,
  provider          account_provider not null,
  external_id       text not null,
  encrypted_token   text,
  last_cursor       text,
  last_synced_at    timestamptz,
  next_sync_at      timestamptz,
  reauth_required   boolean not null default false,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

-- ─── categories ─────────────────────────────────────────────
create table if not exists public.categories (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  icon         text not null default 'tag',
  color        text not null default '#64748b',
  parent_id    uuid references public.categories(id) on delete set null,
  is_system    boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  unique (workspace_id, name)
);

-- ─── merchants ──────────────────────────────────────────────
create table if not exists public.merchants (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  logo_url     text,
  default_category_id uuid references public.categories(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (workspace_id, name)
);

-- ─── tags ───────────────────────────────────────────────────
create table if not exists public.tags (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  color        text not null default '#64748b',
  unique (workspace_id, name)
);

-- ─── transactions ──────────────────────────────────────────
create table if not exists public.transactions (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  account_id        uuid not null references public.accounts(id) on delete cascade,
  category_id       uuid references public.categories(id) on delete set null,
  merchant_id       uuid references public.merchants(id) on delete set null,
  transaction_date  date not null,
  posted_at         timestamptz,
  direction         tx_direction not null,
  amount            numeric(14,2) not null check (amount > 0),
  currency          text not null default 'NGN',
  fx_amount         numeric(14,2),
  fx_currency       text,
  description       text not null default '',
  note              text,
  balance_after     numeric(14,2),
  is_pending        boolean not null default false,
  is_recurring      boolean not null default false,
  is_transfer       boolean not null default false,
  transfer_pair_id  uuid references public.transactions(id) on delete set null,
  external_id       text,
  receipt_url       text,
  metadata          jsonb not null default '{}'::jsonb,
  created_by        uuid references public.user_profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id         uuid not null references public.tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

-- ─── budgets ────────────────────────────────────────────────
create table if not exists public.budgets (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete cascade,
  period       budget_period not null default 'monthly',
  amount       numeric(14,2) not null check (amount > 0),
  rollover     boolean not null default false,
  alert_at     int not null default 80,
  starts_on    date not null default date_trunc('month', now())::date,
  created_at   timestamptz not null default now(),
  unique (workspace_id, category_id, period)
);

-- ─── goals ──────────────────────────────────────────────────
create table if not exists public.goals (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0,
  target_date   date,
  account_id    uuid references public.accounts(id) on delete set null,
  status        goal_status not null default 'active',
  color         text not null default '#10b981',
  icon          text not null default 'target',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── recurring rules ───────────────────────────────────────
create table if not exists public.recurring_rules (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  account_id    uuid references public.accounts(id) on delete set null,
  merchant_id   uuid references public.merchants(id) on delete set null,
  category_id   uuid references public.categories(id) on delete set null,
  description_pattern text,
  amount        numeric(14,2),
  cadence_days  int not null,
  next_due_on   date,
  confidence    numeric(3,2),
  is_user_defined boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ─── subscriptions (Paystack) ──────────────────────────────
create table if not exists public.subscriptions (
  workspace_id        uuid primary key references public.workspaces(id) on delete cascade,
  plan                plan_tier not null default 'free',
  status              subscription_status not null default 'active',
  paystack_customer_code text,
  paystack_subscription_code text,
  paystack_email_token   text,
  current_period_end  timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── notifications ─────────────────────────────────────────
create table if not exists public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid references public.user_profiles(id) on delete cascade,
  kind         text not null,
  title        text not null,
  body         text,
  href         text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- ─── audit logs (Business tier) ────────────────────────────
create table if not exists public.audit_logs (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id     uuid references public.user_profiles(id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  diff         jsonb,
  created_at   timestamptz not null default now()
);

-- ─── fx_rates (daily cache) ────────────────────────────────
create table if not exists public.fx_rates (
  base_currency  text not null,
  quote_currency text not null,
  rate           numeric(18,8) not null,
  as_of          date not null,
  primary key (base_currency, quote_currency, as_of)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists workspace_members_user_idx       on public.workspace_members(user_id);
create index if not exists accounts_workspace_idx           on public.accounts(workspace_id);
create unique index if not exists linked_accounts_external_idx
  on public.linked_accounts(provider, external_id);
create index if not exists categories_workspace_idx         on public.categories(workspace_id);
create index if not exists transactions_workspace_idx       on public.transactions(workspace_id);
create index if not exists transactions_account_idx         on public.transactions(account_id);
create index if not exists transactions_category_idx        on public.transactions(category_id);
create index if not exists transactions_date_idx            on public.transactions(transaction_date desc);
create index if not exists transactions_workspace_date_idx  on public.transactions(workspace_id, transaction_date desc);
create unique index if not exists transactions_external_idx
  on public.transactions(account_id, external_id) where external_id is not null;
create index if not exists transactions_description_trgm
  on public.transactions using gin (description gin_trgm_ops);
create index if not exists notifications_user_idx           on public.notifications(user_id, read_at);
create index if not exists audit_logs_workspace_idx         on public.audit_logs(workspace_id, created_at desc);

-- ============================================================
-- FUNCTIONS  (all tables now exist — bodies validate cleanly)
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.is_member(p_workspace uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace and user_id = auth.uid()
  );
$$;

create or replace function public.is_member_with(p_workspace uuid, p_roles workspace_role[])
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace and user_id = auth.uid()
      and role = any(p_roles)
  );
$$;

create or replace function public.seed_default_categories(p_workspace uuid, p_user uuid)
returns void language plpgsql as $$
declare
  defs text[][] := array[
    ['Income','arrow-down-circle','#10b981'],
    ['Food & Dining','utensils','#f59e0b'],
    ['Groceries','shopping-basket','#84cc16'],
    ['Transport','car','#0ea5e9'],
    ['Rent & Housing','home','#a855f7'],
    ['Utilities','bolt','#eab308'],
    ['Entertainment','film','#ec4899'],
    ['Health','heart-pulse','#ef4444'],
    ['Shopping','shopping-bag','#8b5cf6'],
    ['Subscriptions','repeat','#06b6d4'],
    ['Education','book-open','#3b82f6'],
    ['Travel','plane','#14b8a6'],
    ['Family','users','#f43f5e'],
    ['Giving','hand-heart','#22c55e'],
    ['Savings','piggy-bank','#10b981'],
    ['Investments','trending-up','#6366f1'],
    ['Fees & Charges','receipt','#64748b'],
    ['Transfers','arrow-left-right','#94a3b8'],
    ['Uncategorised','help-circle','#a3a3a3']
  ];
  i int;
begin
  for i in 1 .. array_length(defs,1) loop
    insert into public.categories (workspace_id, name, icon, color, is_system, sort_order)
    values (p_workspace, defs[i][1], defs[i][2], defs[i][3], true, i)
    on conflict (workspace_id, name) do nothing;
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_workspace uuid;
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'full_name','');
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, v_name);

  insert into public.workspaces (name, owner_id, is_personal)
  values (case when v_name <> '' then v_name || '''s Workspace' else 'Personal' end, new.id, true)
  returning id into v_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace, new.id, 'owner');

  perform public.seed_default_categories(v_workspace, new.id);

  insert into public.subscriptions (workspace_id, plan, status, current_period_end)
  values (v_workspace, 'free', 'active', now() + interval '100 years');

  return new;
end;
$$;

-- Self-heal: callable by any authenticated user.
-- Creates profile + personal workspace + categories + free subscription
-- if they don't already exist for the caller. Idempotent.
create or replace function public.ensure_my_workspace()
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user      uuid := auth.uid();
  v_email     text;
  v_name      text;
  v_workspace uuid;
begin
  if v_user is null then
    return null;
  end if;

  -- If they already have a workspace, just return its id.
  select w.id into v_workspace
  from public.workspaces w
  join public.workspace_members wm on wm.workspace_id = w.id
  where wm.user_id = v_user
  order by w.created_at asc
  limit 1;
  if v_workspace is not null then
    return v_workspace;
  end if;

  select email, coalesce(raw_user_meta_data->>'full_name','')
    into v_email, v_name
  from auth.users where id = v_user;

  insert into public.user_profiles (id, email, full_name)
  values (v_user, coalesce(v_email, ''), v_name)
  on conflict (id) do nothing;

  insert into public.workspaces (name, owner_id, is_personal)
  values (case when v_name <> '' then v_name || '''s Workspace' else 'Personal' end, v_user, true)
  returning id into v_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace, v_user, 'owner');

  perform public.seed_default_categories(v_workspace, v_user);

  insert into public.subscriptions (workspace_id, plan, status, current_period_end)
  values (v_workspace, 'free', 'active', now() + interval '100 years')
  on conflict (workspace_id) do nothing;

  return v_workspace;
end;
$$;

create or replace function public.apply_tx_to_balance()
returns trigger language plpgsql as $$
declare
  v_delta numeric(14,2);
begin
  if tg_op = 'INSERT' then
    v_delta := case when new.direction = 'credit' then new.amount else -new.amount end;
    update public.accounts set current_balance = current_balance + v_delta, updated_at = now()
      where id = new.account_id;
  elsif tg_op = 'DELETE' then
    v_delta := case when old.direction = 'credit' then -old.amount else old.amount end;
    update public.accounts set current_balance = current_balance + v_delta, updated_at = now()
      where id = old.account_id;
  elsif tg_op = 'UPDATE' then
    v_delta := case when old.direction = 'credit' then -old.amount else old.amount end;
    update public.accounts set current_balance = current_balance + v_delta where id = old.account_id;
    v_delta := case when new.direction = 'credit' then new.amount else -new.amount end;
    update public.accounts set current_balance = current_balance + v_delta, updated_at = now()
      where id = new.account_id;
  end if;
  return coalesce(new, old);
end;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists transactions_apply_balance on public.transactions;
create trigger transactions_apply_balance
  after insert or update or delete on public.transactions
  for each row execute procedure public.apply_tx_to_balance();

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at before update on public.transactions
  for each row execute procedure public.set_updated_at();

drop trigger if exists accounts_updated_at on public.accounts;
create trigger accounts_updated_at before update on public.accounts
  for each row execute procedure public.set_updated_at();

drop trigger if exists workspaces_updated_at on public.workspaces;
create trigger workspaces_updated_at before update on public.workspaces
  for each row execute procedure public.set_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.user_profiles        enable row level security;
alter table public.workspaces           enable row level security;
alter table public.workspace_members    enable row level security;
alter table public.accounts             enable row level security;
alter table public.linked_accounts      enable row level security;
alter table public.categories           enable row level security;
alter table public.merchants            enable row level security;
alter table public.tags                 enable row level security;
alter table public.transactions         enable row level security;
alter table public.transaction_tags     enable row level security;
alter table public.budgets              enable row level security;
alter table public.goals                enable row level security;
alter table public.recurring_rules      enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.notifications        enable row level security;
alter table public.audit_logs           enable row level security;
alter table public.fx_rates             enable row level security;

-- user_profiles
drop policy if exists "profiles: read self"   on public.user_profiles;
drop policy if exists "profiles: update self" on public.user_profiles;
create policy "profiles: read self"   on public.user_profiles for select using (id = auth.uid());
create policy "profiles: update self" on public.user_profiles for update using (id = auth.uid());

-- workspaces
drop policy if exists "workspaces: read if member"  on public.workspaces;
drop policy if exists "workspaces: insert as owner" on public.workspaces;
drop policy if exists "workspaces: update if admin" on public.workspaces;
drop policy if exists "workspaces: delete if owner" on public.workspaces;
create policy "workspaces: read if member"  on public.workspaces for select using (public.is_member(id));
create policy "workspaces: insert as owner" on public.workspaces for insert with check (owner_id = auth.uid());
create policy "workspaces: update if admin" on public.workspaces for update using (public.is_member_with(id, array['owner','admin']::workspace_role[]));
create policy "workspaces: delete if owner" on public.workspaces for delete using (owner_id = auth.uid());

-- workspace_members
drop policy if exists "members: read if member"  on public.workspace_members;
drop policy if exists "members: manage if admin" on public.workspace_members;
create policy "members: read if member" on public.workspace_members
  for select using (public.is_member(workspace_id));
create policy "members: manage if admin" on public.workspace_members
  for all using (public.is_member_with(workspace_id, array['owner','admin']::workspace_role[]));

-- ── Generic workspace-scoped tables ──────────────────────────
-- read if member; write if member excluding viewer
do $$
declare
  t text;
  tables text[] := array[
    'accounts','linked_accounts','categories','merchants','tags',
    'transactions','budgets','goals','recurring_rules',
    'subscriptions','notifications','audit_logs'
  ];
  read_name text;
  write_name text;
begin
  foreach t in array tables loop
    read_name  := t || ': read if member';
    write_name := t || ': write if not viewer';

    execute format('drop policy if exists %I on public.%I;', read_name,  t);
    execute format('drop policy if exists %I on public.%I;', write_name, t);

    execute format(
      'create policy %I on public.%I for select using (public.is_member(workspace_id));',
      read_name, t
    );
    execute format(
      'create policy %I on public.%I for all '
      || 'using (public.is_member_with(workspace_id, array[''owner'',''admin'',''member'']::workspace_role[])) '
      || 'with check (public.is_member_with(workspace_id, array[''owner'',''admin'',''member'']::workspace_role[]));',
      write_name, t
    );
  end loop;
end
$$;

-- transaction_tags inherits via the parent transaction
drop policy if exists "tx_tags: read"  on public.transaction_tags;
drop policy if exists "tx_tags: write" on public.transaction_tags;
create policy "tx_tags: read" on public.transaction_tags
  for select using (
    exists (select 1 from public.transactions tr
            where tr.id = transaction_id and public.is_member(tr.workspace_id))
  );
create policy "tx_tags: write" on public.transaction_tags
  for all using (
    exists (select 1 from public.transactions tr
            where tr.id = transaction_id
              and public.is_member_with(tr.workspace_id, array['owner','admin','member']::workspace_role[]))
  );

-- fx_rates: global, readable to any auth user
drop policy if exists "fx: read auth" on public.fx_rates;
create policy "fx: read auth" on public.fx_rates for select using (auth.uid() is not null);
