import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ApprovalForm from "./ApprovalForm";
import { formatNaira } from "@/lib/format";
import type { TransactionStatus } from "@/lib/types";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: transaction } = await supabase
    .from("transactions")
    .select(
      `
      *,
      creator:user_profiles!transactions_created_by_fkey(id, full_name, email),
      category:categories(name),
      capital_source:capital_sources(name),
      trigger:triggers(name)
    `,
    )
    .eq("id", id)
    .single();

  if (!transaction) notFound();

  const { data: logs } = await supabase
    .from("approval_logs")
    .select(
      "*, reviewer:user_profiles!approval_logs_reviewed_by_fkey(full_name, email)",
    )
    .eq("transaction_id", id)
    .order("created_at", { ascending: false });

  const isPrivileged =
    profile?.role === "admin" || profile?.role === "controller";
  const isOwnTransaction = transaction.created_by === user!.id;
  const canApprove =
    isPrivileged && !isOwnTransaction && transaction.status === "pending";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-tx transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to transactions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tx">
            {transaction.description}
          </h1>
          <p className="text-subtle text-xs mt-1 font-mono">
            ID: {transaction.id}
          </p>
        </div>
        <StatusBadge status={transaction.status as TransactionStatus} />
      </div>

      {/* Details card */}
      <div className="bg-surface border border-border rounded-xl divide-y divide-border-soft overflow-hidden">
        {(
          [
            [
              "Transaction Date",
              new Date(transaction.transaction_date).toLocaleDateString(),
            ],
            ["Beneficiaries", transaction.beneficiaries],
            [
              "Amount",
              formatNaira(transaction.amount),
            ],
            ["Category", transaction.category?.name || "—"],
            ["Capital Source", transaction.capital_source?.name || "—"],
            ["Trigger", transaction.trigger?.name || "—"],
            [
              "Balance After",
              transaction.balance_after
                ? formatNaira(transaction.balance_after!)
                : "—",
            ],
            [
              "Submitted by",
              transaction.creator?.full_name || transaction.creator?.email,
            ],
            ["Created", new Date(transaction.created_at).toLocaleString()],
            ["Last updated", new Date(transaction.updated_at).toLocaleString()],
          ] as [string, string][]
        ).map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between px-6 py-4"
          >
            <span className="text-sm text-muted">{label}</span>
            <span className="text-sm font-semibold text-tx">{value}</span>
          </div>
        ))}
      </div>

      {/* Approval action */}
      {canApprove && <ApprovalForm transactionId={transaction.id} />}

      {/* Cannot approve own transaction notice */}
      {isPrivileged && isOwnTransaction && transaction.status === "pending" && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
          You cannot approve or reject your own transaction.
        </div>
      )}

      {/* Audit log */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-tx text-sm">Audit Log</h2>
        </div>
        <div className="divide-y divide-border-soft">
          {/* Created event */}
          <div className="px-6 py-4 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-subtle mt-1.5 shrink-0" />
            <div>
              <p className="text-sm text-tx">
                <span className="font-semibold">
                  {transaction.creator?.full_name || transaction.creator?.email}
                </span>{" "}
                submitted this transaction
              </p>
              <p className="text-xs text-muted mt-0.5">
                {new Date(transaction.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {(logs ?? []).map((log: any) => (
            <div key={log.id} className="px-6 py-4 flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  log.action === "approved" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div>
                <p className="text-sm text-tx">
                  <span className="font-semibold">
                    {log.reviewer?.full_name || log.reviewer?.email}
                  </span>{" "}
                  {log.action} this transaction
                  {log.comment && (
                    <span className="text-muted">
                      {" "}
                      — &ldquo;{log.comment}&rdquo;
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}

          {(logs ?? []).length === 0 && transaction.status === "pending" && (
            <p className="px-6 py-4 text-sm text-muted">Awaiting review.</p>
          )}
        </div>
      </div>
    </div>
  );
}
