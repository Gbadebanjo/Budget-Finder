"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ApprovalForm({
  transactionId,
}: {
  transactionId: string;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState("");

  async function handleAction(action: "approved" | "rejected") {
    setLoading(action);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(null);
      return;
    }

    const { error: updateErr } = await supabase
      .from("transactions")
      .update({ status: action })
      .eq("id", transactionId);

    if (updateErr) {
      setError(updateErr.message);
      setLoading(null);
      return;
    }

    const { error: logErr } = await supabase.from("approval_logs").insert({
      transaction_id: transactionId,
      reviewed_by: user.id,
      action,
      comment: comment.trim() || null,
    });

    if (logErr) {
      setError(logErr.message);
      setLoading(null);
      return;
    }

    router.refresh();
    setLoading(null);
    setComment("");
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <h2 className="font-semibold text-tx">Review Transaction</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wide">
          Comment{" "}
          <span className="text-subtle font-normal normal-case">
            (optional)
          </span>
        </label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition resize-none"
          placeholder="Add a note for the submitter…"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleAction("rejected")}
          disabled={loading !== null}
          className="flex-1 rounded-lg border border-red-300 dark:border-red-800 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === "rejected" ? "Rejecting…" : "Reject"}
        </button>
        <button
          onClick={() => handleAction("approved")}
          disabled={loading !== null}
          className="flex-1 bg-green-600 dark:bg-green-700 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === "approved" ? "Approving…" : "Approve"}
        </button>
      </div>
    </div>
  );
}
