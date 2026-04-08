import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import PendingApprovals from "./PendingApprovals";
import InviteForm from "@/app/(app)/users/InviteForm";
import { formatNaira } from "@/lib/format";
import type { TransactionStatus } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const isPrivileged =
    profile?.role === "admin" || profile?.role === "controller";
  const isAdmin = profile?.role === "admin";

  const [
    { count: total },
    { count: pending },
    { count: approved },
    { count: rejected },
  ] = await Promise.all([
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected"),
  ]);

  // Pending approvals: transactions needing review that were NOT submitted by this user
  const { data: pendingTransactions } = isPrivileged
    ? await supabase
        .from("transactions")
        .select(
          `
          *,
          creator:user_profiles!transactions_created_by_fkey(full_name, email),
          category:categories(name),
          capital_source:capital_sources(name),
          trigger:triggers(name)
        `,
        )
        .eq("status", "pending")
        .neq("created_by", user!.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  // Recent transactions
  const { data: recent } = await supabase
    .from("transactions")
    .select(
      `
      *,
      creator:user_profiles!transactions_created_by_fkey(full_name, email),
      category:categories(name),
      capital_source:capital_sources(name),
      trigger:triggers(name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: "Total", value: total ?? 0, color: "text-tx" },
    {
      label: "Pending",
      value: pending ?? 0,
      color: "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Approved",
      value: approved ?? 0,
      color: "text-green-600  dark:text-green-400",
    },
    {
      label: "Rejected",
      value: rejected ?? 0,
      color: "text-red-600    dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tx">
            {isAdmin
              ? "Admin Dashboard"
              : isPrivileged
                ? "Dashboard"
                : "Dashboard"}
          </h1>
          <p className="text-muted text-sm mt-1">
            Welcome back,{" "}
            <span className="text-tx font-medium">
              {profile?.full_name || profile?.email}
            </span>
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Transaction
        </Link>
      </div>

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              {label}
            </p>
            <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Admin: Invite Users ────────────────────────── */}
      {isAdmin && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-tx">Invite Users</h2>
              <p className="text-xs text-muted mt-0.5">
                Send an invitation email to onboard a new team member.
              </p>
            </div>
          </div>
          <InviteForm />
        </section>
      )}

      {/* ── Admin/Controller: Pending Approvals ────────── */}
      {isPrivileged && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-tx">Pending Approvals</h2>
              {(pendingTransactions ?? []).length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white text-xs font-bold">
                  {(pendingTransactions ?? []).length}
                </span>
              )}
            </div>
            <Link
              href="/transactions?status=pending"
              className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          <PendingApprovals
            transactions={pendingTransactions ?? []}
            reviewerId={user!.id}
          />
        </section>
      )}

      {/* ── Recent Activity ────────────────────────────── */}
      <section>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-tx">Recent Activity</h2>
            <Link
              href="/transactions"
              className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border-soft">
            {(recent ?? []).length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-muted text-sm">No payments yet.</p>
                <Link
                  href="/transactions/new"
                  className="text-accent text-sm font-medium hover:underline mt-1 inline-block"
                >
                  Submit the first one
                </Link>
              </div>
            )}
            {(recent ?? []).map((p: any) => (
              <Link
                key={p.id}
                href={`/transactions/${p.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-surface-alt transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-tx truncate">
                    {p.description}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {isPrivileged && p.creator && (
                      <span className="font-medium">
                        {p.creator.full_name || p.creator.email} ·{" "}
                      </span>
                    )}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className="text-sm font-semibold text-tx">
                    {formatNaira(p.amount)}
                  </span>
                  <StatusBadge status={p.status as TransactionStatus} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
