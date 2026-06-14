-- ============================================================
-- FinFlow demo seed. Run AFTER schema.sql.
-- Replace the user_id below with a real auth.users(id) value
-- before running. Generates 6 months of NGN transactions.
-- ============================================================

do $$
declare
  v_user uuid := (select id from auth.users order by created_at limit 1);
  v_ws   uuid;
  v_acc_gtb uuid;
  v_acc_kuda uuid;
  v_acc_cash uuid;
  v_cat_food uuid;
  v_cat_trans uuid;
  v_cat_rent uuid;
  v_cat_sub uuid;
  v_cat_income uuid;
  v_cat_shop uuid;
  d date;
begin
  if v_user is null then
    raise notice 'No auth user found. Sign up first, then re-run seed.';
    return;
  end if;

  -- Pick the user's first workspace
  select id into v_ws from public.workspaces
    where owner_id = v_user order by created_at limit 1;
  if v_ws is null then
    raise notice 'No workspace for user — handle_new_user trigger should have created one.';
    return;
  end if;

  -- Wipe existing demo data for this workspace
  delete from public.transactions where workspace_id = v_ws;
  delete from public.budgets       where workspace_id = v_ws;
  delete from public.goals         where workspace_id = v_ws;
  delete from public.accounts      where workspace_id = v_ws;

  -- Accounts
  insert into public.accounts (workspace_id, name, institution, kind, provider, currency, account_mask, current_balance, color)
    values (v_ws, 'GTBank Salary', 'GTBank', 'bank', 'manual', 'NGN', '4421', 1_240_000, '#ea580c')
    returning id into v_acc_gtb;
  insert into public.accounts (workspace_id, name, institution, kind, provider, currency, account_mask, current_balance, color)
    values (v_ws, 'Kuda Spend', 'Kuda Bank', 'bank', 'manual', 'NGN', '8810', 320_400, '#a855f7')
    returning id into v_acc_kuda;
  insert into public.accounts (workspace_id, name, institution, kind, provider, currency, current_balance, color)
    values (v_ws, 'Cash on hand', null, 'cash', 'manual', 'NGN', 32_000, '#10b981')
    returning id into v_acc_cash;

  -- Categories already seeded by handle_new_user — pick the relevant IDs
  select id into v_cat_food   from public.categories where workspace_id = v_ws and name = 'Food & Dining';
  select id into v_cat_trans  from public.categories where workspace_id = v_ws and name = 'Transport';
  select id into v_cat_rent   from public.categories where workspace_id = v_ws and name = 'Rent & Housing';
  select id into v_cat_sub    from public.categories where workspace_id = v_ws and name = 'Subscriptions';
  select id into v_cat_income from public.categories where workspace_id = v_ws and name = 'Income';
  select id into v_cat_shop   from public.categories where workspace_id = v_ws and name = 'Shopping';

  -- 6 months of monthly salary + rent + Spotify + Netflix
  for i in 0..5 loop
    d := (date_trunc('month', now() - (i || ' months')::interval))::date;
    insert into public.transactions (workspace_id, account_id, category_id, transaction_date, direction, amount, currency, description, is_recurring)
      values (v_ws, v_acc_gtb, v_cat_income, d + 1, 'credit', 850_000, 'NGN', 'Monthly salary', true),
             (v_ws, v_acc_gtb, v_cat_rent,   d + 2, 'debit',  250_000, 'NGN', 'Rent — Lekki', true),
             (v_ws, v_acc_kuda, v_cat_sub,   d + 4, 'debit',  1_300,   'NGN', 'Spotify Premium', true),
             (v_ws, v_acc_kuda, v_cat_sub,   d + 5, 'debit',  4_400,   'NGN', 'Netflix', true);
  end loop;

  -- 90 days of variable food / transport / shopping
  for i in 0..89 loop
    d := (now() - (i || ' days')::interval)::date;
    if random() < 0.85 then
      insert into public.transactions (workspace_id, account_id, category_id, transaction_date, direction, amount, currency, description)
        values (v_ws, v_acc_kuda, v_cat_food, d, 'debit', (1500 + random() * 9000)::numeric(14,2), 'NGN',
                (array['Chicken Republic','Mr Biggs','Domino''s','Shoprite','Ebeano','Yoyo Foods','BBQ Joint'])[1 + floor(random() * 7)::int]);
    end if;
    if random() < 0.45 then
      insert into public.transactions (workspace_id, account_id, category_id, transaction_date, direction, amount, currency, description)
        values (v_ws, v_acc_kuda, v_cat_trans, d, 'debit', (1200 + random() * 5000)::numeric(14,2), 'NGN',
                (array['Bolt ride','Uber','Lagos BRT','Filling station'])[1 + floor(random() * 4)::int]);
    end if;
    if random() < 0.15 then
      insert into public.transactions (workspace_id, account_id, category_id, transaction_date, direction, amount, currency, description)
        values (v_ws, v_acc_kuda, v_cat_shop, d, 'debit', (4000 + random() * 30000)::numeric(14,2), 'NGN',
                (array['Jumia','Konga','Sabi Market','Ikoyi Mall'])[1 + floor(random() * 4)::int]);
    end if;
  end loop;

  -- A few budgets
  insert into public.budgets (workspace_id, category_id, amount) values
    (v_ws, v_cat_food, 80_000),
    (v_ws, v_cat_trans, 40_000),
    (v_ws, v_cat_shop, 60_000),
    (v_ws, v_cat_sub, 10_000)
  on conflict do nothing;

  -- A goal
  insert into public.goals (workspace_id, name, target_amount, current_amount, target_date, icon, color)
    values (v_ws, 'Japa fund 🇨🇦', 5_000_000, 850_000, (now() + interval '8 months')::date, 'plane', '#0ea5e9');

  raise notice 'Seeded demo data for workspace %', v_ws;
end
$$;
