# FinFlow — Product Requirements Document

**Version:** 1.0
**Author:** Oluwagbogo
**Last updated:** 2026-06-13
**Status:** Draft for build

---

## 1. Vision

> A timeline-first money tracker that lets Nigerians (and eventually anyone) see exactly where every naira went, when, and why — across every account they own — with charts that turn raw transactions into a story.

We compete on three axes most Nigerian tools ignore:

1. **Timeline storytelling** — a journal-like, filterable feed of every transaction with running balance, not just a CSV dump.
2. **Real bank sync** via Mono (and later Okra), not screen-scraping or manual upload.
3. **Modern, calm UI** — Stripe/Apple-glass aesthetic. Not another 2017 Bootstrap dashboard.

## 2. Target Users

| Segment | Pain | Why FinFlow |
|---|---|---|
| **Freelancers & creators** | Income from 3+ banks + Stripe/Paystack/Wise, can't tell monthly net | One timeline + multi-account net worth |
| **Side-hustlers** | Day job + side income mixed in one account | Tag/category split, budgets per stream |
| **Small ministries / NGOs** | Track designated giving across accounts, report to donors | Designated-fund accounts, exportable reports |
| **Couples / families** | Shared spending visibility | Family workspace (Phase 3) |

**Primary persona:** "Tunde, 29, Lagos-based product designer freelancing in NGN + USD. Holds GTBank, Kuda, Wise, Paystack. Wants one place to see net worth, runway, and what he wasted money on last month."

## 3. Non-Goals (v1)

- Tax filing / FIRS integration
- Invoicing (Wave/Bujeti already do this)
- Credit scoring
- Stock/crypto portfolio analytics beyond a manual asset row
- Multi-currency from day one (NGN primary; USD/GBP secondary, FX cached daily)

## 4. Core Feature Pillars

### 4.1 Timeline View
- Vertical infinite-scroll feed grouped by **Today / Yesterday / This week / Month / Year**
- Each row: merchant, category icon, amount (color-coded), account, running balance
- Filters: account, category, amount range, merchant, tag, date range
- Zoom: Year → Month → Week → Day with smooth transitions
- Inline edit category, add tag, split transaction
- Keyboard navigation (j/k, / for search, ⌘K for command palette)

### 4.2 Charts (Dashboard)
- **Net worth** — area chart, all accounts summed over time
- **Cashflow waterfall** — income vs spend per period
- **Category breakdown** — sunburst / donut, click to drill
- **Merchant leaderboard** — top 10 by spend
- **Spending heatmap** — GitHub-style calendar of daily spend intensity
- **Forecast line** — 30/60/90-day projection from recurring detection
- **Balance per account** — small multiples (sparklines)

### 4.3 Bank Sync (Mono)
- "Link account" → Mono Connect Widget → store `account_id` (encrypted token via Supabase Vault)
- Initial backfill of 12 months on first link
- Daily resync via cron + webhook on new transactions
- Manual "Sync now" button per account
- Graceful failure UI when token expires (reauth CTA)

### 4.4 Budgets
- Envelope budgets per category, monthly cycle
- Progress ring per category, color shifts amber at 80%, red at 100%
- Rollover toggle (carry unused to next month)
- Email/in-app alert at 80% and 100%

### 4.5 Goals
- Savings goal: name, target amount, target date, source account
- Progress bar + projected completion date based on current contribution pace
- "Contribute now" → records a transfer transaction

### 4.6 Smart Automations
- **Auto-categorization** — rules engine (if merchant contains "BOLT" → Transport) + ML fallback later
- **Recurring detection** — flag transactions appearing on similar amount + cadence (Netflix, rent, salary)
- **Anomaly alerts** — "You spent ₦82,000 at Shoprite — 3.4× your usual"
- **Weekly digest email** — Sunday morning recap

### 4.7 Reports & Exports
- Pre-built: Monthly P&L, Category breakdown, Account statement
- Custom filter → export CSV / PDF
- Date range, account, category, tag filters
- Donor-ready report template (for ministry/NGO tier)

### 4.8 Multi-currency (light)
- NGN primary; user can add accounts in USD/GBP/EUR
- Daily FX rate cached from exchangerate.host (free)
- Net worth shown in display currency (user setting)
- Each transaction stores original amount + currency; converted on read

## 5. Roles & Workspaces

Every user owns at least one **personal workspace**. Higher tiers unlock shared workspaces.

| Role | Capabilities |
|---|---|
| **Owner** | Full control, billing, delete workspace |
| **Admin** | Manage members, accounts, categories |
| **Member** | Add/edit transactions, view all data |
| **Viewer** | Read-only (for accountants, advisors) |

Approval workflows from the old app are **dropped from v1**.

## 6. Pricing (Naira)

All billed via **Paystack** (subscriptions API). Free tier permanent.

| Plan | Price | Limits | Audience |
|---|---|---|---|
| **Free** | ₦0 | 1 linked account, 60 days history, 3 budgets, manual entry only | Curious users |
| **Pro** | **₦2,500/mo** or **₦25,000/yr** (save 17%) | Unlimited accounts, full history, all charts, unlimited budgets & goals, exports, weekly digest | Power users |
| **Family** | **₦4,500/mo** | Pro + up to 5 members, shared workspace | Couples, families |
| **Business** | **₦12,000/mo** | Family + audit log, departments, API access, priority support | NGOs, SMBs |

Add-ons:
- **AI Insights** — ₦1,000/mo (natural-language Q&A over your data via Claude)
- **Donor Reports** (Business only) — ₦3,000/mo

Trial: 14 days of Pro on signup, no card required.

## 7. Architecture

```
                    ┌──────────────────────────────┐
                    │   Next.js 16 (App Router)    │
                    │   React 19 + Tailwind v4     │
                    │   shadcn primitives + custom │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │     Supabase                 │
                    │  • Postgres + RLS            │
                    │  • Auth (email + OAuth)      │
                    │  • Edge Functions            │
                    │  • Storage (receipts)        │
                    │  • Vault (encrypted tokens)  │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┼────────────────────────┐
        │                          │                        │
   ┌────▼────┐              ┌──────▼──────┐         ┌───────▼─────┐
   │  Mono   │              │  Paystack   │         │ FX provider │
   │ Connect │              │ Subscriptions│         │ (cached)    │
   └─────────┘              └──────────────┘         └─────────────┘
```

**Why Supabase Edge Functions over a separate Node service:** webhooks (Mono, Paystack) need a public endpoint; Edge Functions deploy in one command, run close to Postgres, and the existing project already uses `@supabase/ssr`.

**Background jobs:** `pg_cron` calls Edge Functions on schedule (daily sync, weekly digest, monthly budget reset).

## 8. Data Model (high level)

See `lib/supabase/schema.sql` (rewritten in this milestone). Key tables:

- `workspaces` — tenant boundary
- `workspace_members` — user ↔ workspace with role
- `accounts` — bank accounts (linked or manual), per workspace
- `linked_accounts` — Mono integration metadata, encrypted tokens
- `categories` — per-workspace, system defaults seeded
- `transactions` — the heart; account_id, category_id, amount, currency, merchant, tags, status, external_id, metadata
- `transaction_tags` — many-to-many
- `budgets` — category + period + amount
- `goals` — savings target
- `recurring_rules` — detected or user-defined
- `subscriptions` — Paystack plan state per workspace
- `audit_logs` — Business tier
- `notifications` — in-app feed

RLS: every table scoped by `workspace_id`; user must be active member with appropriate role.

## 9. UX & Design System

**Direction:** Stripe / Apple-glass.

- **Surfaces:** white / zinc-50 base, frosted-glass cards (`backdrop-blur` + subtle border + soft shadow)
- **Typography:** Inter (UI), Geist Mono (numbers). Numbers always tabular.
- **Color:** monochrome base + one indigo accent (`#4f46e5`), success green, danger rose. Income green, spend rose, neutral zinc.
- **Motion:** spring-easing (200–300ms), fade+slide on route changes, count-up on stats
- **Density:** generous padding on cards, dense on tables; never below 13px text
- **Currency:** always `₦` symbol, `Intl.NumberFormat('en-NG')`, kobo only when material
- **Dark mode:** full parity, slate-950 base, glass effect with lower opacity
- **Mobile:** bottom-tab nav, swipe gestures on transaction rows; PWA-installable

## 10. v1 Scope (this build)

Phase 1 (this milestone — foundation):
1. PRD ✅
2. New schema migration
3. Design system + UI primitives
4. App shell (sidebar, topbar, command palette stub, workspace switcher)
5. Dashboard with all 4 hero charts (using seeded data initially)
6. Timeline view with filters
7. Accounts page with manual add + "Link bank" CTA
8. Budgets page
9. Goals page
10. Reports page with CSV export
11. Settings + Billing UI with plan picker (Paystack ready)
12. Mono link flow (stubbed if creds absent — works against sandbox if present)
13. Paystack init (stubbed if creds absent)
14. Seed script with 6 months of realistic NGN transactions

Phase 2 (next):
- Real Mono sandbox integration end-to-end
- Recurring detection job
- Cashflow forecast
- Weekly digest email
- Auto-categorization rules engine

Phase 3 (later):
- Shared workspaces (Family/Business)
- Audit log
- AI Insights add-on
- Mobile PWA polish
- Receipt OCR

## 11. Success Metrics

- **Activation:** % of signups that link ≥1 account within 7 days (target: 40%)
- **Retention:** D30 retention (target: 35%)
- **Conversion:** Free → Pro at end of 14-day trial (target: 8%)
- **Engagement:** Median sessions/week among Pro users (target: 4)
- **NPS:** target 40+

## 12. Risks & Open Questions

| Risk | Mitigation |
|---|---|
| Mono pricing per linked account erodes Pro margin | Cap free-tier sync frequency; pass cost into Business tier |
| Paystack subscription API quirks (manual cancel, no proration) | Build webhook-driven state machine; document edge cases |
| User trust to link bank | Clear copy, BVN never stored, on-page security explainer, Mono branding visible |
| Categorization accuracy | Start with rules, allow easy overrides, learn from corrections |
| Competition from Cowrywise/PiggyVest expanding into tracking | Move fast, own the "third-party multi-bank aggregator" angle they can't (they're products themselves) |

## 13. Glossary

- **Workspace** — tenant boundary; all data scoped here
- **Account** — a single bank account, wallet, or cash float (linked or manual)
- **Linked account** — an account synced via Mono
- **Trigger** — DEPRECATED (was a recurring price preset in old app)
- **Envelope budget** — fixed amount per category per month
- **Recurring rule** — a detected or user-defined pattern (e.g. "₦1,300 Spotify monthly")
