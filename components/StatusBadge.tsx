import type { TransactionStatus } from "@/lib/types";

const map: Record<TransactionStatus, { label: string; classes: string }> = {
  pending: {
    label: "Pending",
    classes:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  approved: {
    label: "Approved",
    classes:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default function StatusBadge({ status }: { status: TransactionStatus }) {
  const { label, classes } = map[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}
