"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import type { CapitalSource, Category, Trigger } from "@/lib/types";

export default function NewTransactionPage() {
  const router = useRouter();
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [beneficiaries, setBeneficiaries] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [capitalSourceId, setCapitalSourceId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [triggerId, setTriggerId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [capitalSources, setCapitalSources] = useState<CapitalSource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const [sourcesRes, categoriesRes] = await Promise.all([
        supabase.from("capital_sources").select("*").order("name"),
        supabase.from("categories").select("*").order("name"),
      ]);

      if (sourcesRes.data) setCapitalSources(sourcesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);

      setLoadingData(false);
    }

    loadData();
  }, []);

  useEffect(() => {
    // Load triggers when category changes
    if (categoryId) {
      const supabase = createClient();
      supabase
        .from("triggers")
        .select("*")
        .eq("category_id", categoryId)
        .order("name")
        .then(({ data }) => {
          setTriggers(data || []);
          setTriggerId(""); // Reset trigger selection
        });
    } else {
      setTriggers([]);
      setTriggerId("");
    }
  }, [categoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      transaction_date: transactionDate,
      beneficiaries: beneficiaries.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      capital_source_id: capitalSourceId || null,
      category_id: categoryId,
      trigger_id: triggerId || null,
      created_by: user.id,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/transactions");
      router.refresh();
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const showTriggers = selectedCategory?.name.toLowerCase() === "school";

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tx">New Transaction</h1>
        <p className="text-muted text-sm mt-1">
          Submit a transaction request for approval.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-xl p-6 space-y-5"
      >
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide">
            Transaction Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide">
            Beneficiaries <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={beneficiaries}
            onChange={(e) => setBeneficiaries(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            placeholder="Who is receiving this transaction?"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition resize-none"
            placeholder="What is this transaction for?"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide">
            Amount (₦) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">
              ₦
            </span>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt pl-7 pr-3 py-2.5 text-sm text-tx placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide">
            Capital Source
          </label>
          <select
            value={capitalSourceId}
            onChange={(e) => setCapitalSourceId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
          >
            <option value="">Select a capital source (optional)</option>
            {capitalSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name} ({formatNaira(source.amount)})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {showTriggers && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide">
              Trigger
            </label>
            <select
              value={triggerId}
              onChange={(e) => setTriggerId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            >
              <option value="">Select a trigger (optional)</option>
              {triggers.map((trigger) => (
                <option key={trigger.id} value={trigger.id}>
                  {trigger.name} ({formatNaira(trigger.price)})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-tx hover:bg-surface-alt transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loadingData}
            className="flex-1 bg-accent text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Submitting…" : "Submit Transaction"}
          </button>
        </div>
      </form>
    </div>
  );
}
