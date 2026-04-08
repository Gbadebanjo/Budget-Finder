"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import type { CapitalSource, Category, Trigger } from "@/lib/types";

interface TxRow {
  id: string;
  transaction_date: string;
  description: string;
  beneficiaries: string;
  amount: number;
  status: string;
  category?:       { name: string } | null;
  capital_source?: { name: string } | null;
  trigger?:        { name: string } | null;
  creator?:        { full_name: string; email: string } | null;
}

interface SummaryRow {
  label: string;
  total: number;
  count: number;
}

export default function ReportsPage() {
  const [capitalSources, setCapitalSources] = useState<CapitalSource[]>([]);
  const [categories,     setCategories]     = useState<Category[]>([]);
  const [triggers,       setTriggers]       = useState<Trigger[]>([]);

  const [startDate,        setStartDate]        = useState("");
  const [endDate,          setEndDate]          = useState("");
  const [filterCapital,    setFilterCapital]    = useState("");
  const [filterCategory,   setFilterCategory]   = useState("");
  const [filterTrigger,    setFilterTrigger]    = useState("");
  const [groupBy,          setGroupBy]          = useState<"category" | "capital_source" | "trigger">("category");

  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [summary,      setSummary]      = useState<SummaryRow[]>([]);
  const [grandTotal,   setGrandTotal]   = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [hasResult,    setHasResult]    = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("capital_sources").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
      supabase.from("triggers").select("*, category:categories(name)").order("name"),
    ]).then(([cs, cat, trig]) => {
      if (cs.data)   setCapitalSources(cs.data);
      if (cat.data)  setCategories(cat.data);
      if (trig.data) setTriggers(trig.data);
    });
  }, []);

  // When category filter changes, reset trigger filter
  useEffect(() => { setFilterTrigger(""); }, [filterCategory]);

  const filteredTriggers = filterCategory
    ? triggers.filter(t => t.category_id === filterCategory)
    : triggers;

  async function generateReport() {
    if (!startDate || !endDate) return;
    setLoading(true);
    setHasResult(false);

    const supabase = createClient();
    let query = supabase
      .from("transactions")
      .select(`
        *,
        creator:user_profiles!transactions_created_by_fkey(full_name, email),
        category:categories(name),
        capital_source:capital_sources(name),
        trigger:triggers(name)
      `)
      .eq("status", "approved")
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: true });

    if (filterCapital)  query = query.eq("capital_source_id", filterCapital);
    if (filterCategory) query = query.eq("category_id", filterCategory);
    if (filterTrigger)  query = query.eq("trigger_id", filterTrigger);

    const { data, error } = await query;
    if (error) { console.error(error); setLoading(false); return; }

    const rows: TxRow[] = data || [];
    setTransactions(rows);

    // Group by selected dimension
    const map = new Map<string, TxRow[]>();
    rows.forEach(tx => {
      const key =
        groupBy === "capital_source" ? (tx.capital_source?.name || "No Source")
        : groupBy === "trigger"      ? (tx.trigger?.name       || "No Trigger")
        :                              (tx.category?.name      || "Uncategorized");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    });

    const summaryRows: SummaryRow[] = Array.from(map.entries())
      .map(([label, txns]) => ({
        label,
        total: txns.reduce((s, t) => s + Number(t.amount), 0),
        count: txns.length,
      }))
      .sort((a, b) => b.total - a.total);

    setSummary(summaryRows);
    setGrandTotal(rows.reduce((s, t) => s + Number(t.amount), 0));
    setHasResult(true);
    setLoading(false);
  }

  function exportCSV() {
    if (!hasResult) return;

    const filterDesc = [
      startDate && `From: ${startDate}`,
      endDate   && `To: ${endDate}`,
      filterCapital  && `Source: ${capitalSources.find(s => s.id === filterCapital)?.name}`,
      filterCategory && `Category: ${categories.find(c => c.id === filterCategory)?.name}`,
      filterTrigger  && `Trigger: ${filteredTriggers.find(t => t.id === filterTrigger)?.name}`,
    ].filter(Boolean).join(" | ");

    const rows: string[][] = [];
    rows.push(["Finance Tracker — Transaction Report"]);
    rows.push([filterDesc]);
    rows.push(["Generated:", new Date().toLocaleString()]);
    rows.push([]);

    rows.push([`Summary by ${groupBy.replace("_", " ")}`]);
    rows.push(["Group", "Transactions", "Total Amount"]);
    summary.forEach(s => rows.push([s.label, String(s.count), s.total.toFixed(2)]));
    rows.push(["TOTAL", String(transactions.length), grandTotal.toFixed(2)]);
    rows.push([]);

    rows.push(["Detailed Transactions"]);
    rows.push(["Date", "Category", "Description", "Beneficiaries", "Amount (NGN)", "Capital Source", "Trigger", "Submitted by"]);
    transactions.forEach(tx => rows.push([
      tx.transaction_date,
      tx.category?.name      || "",
      tx.description,
      tx.beneficiaries,
      Number(tx.amount).toFixed(2),
      tx.capital_source?.name || "",
      tx.trigger?.name        || "",
      tx.creator?.full_name || tx.creator?.email || "",
    ]));

    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `report-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-tx">Reports</h1>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-tx">Filters</h2>

        {/* Date range */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide">Start Date <span className="text-red-500">*</span></label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide">End Date <span className="text-red-500">*</span></label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide">Capital Source</label>
            <select value={filterCapital} onChange={e => setFilterCapital(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">All sources</option>
              {capitalSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide">Category</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Trigger + group-by row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide">Trigger</label>
            <select value={filterTrigger} onChange={e => setFilterTrigger(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">All triggers</option>
              {filteredTriggers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide">Group Summary By</label>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value as typeof groupBy)}
              className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="category">Category</option>
              <option value="capital_source">Capital Source</option>
              <option value="trigger">Trigger</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex gap-3 items-end">
            <button onClick={generateReport} disabled={!startDate || !endDate || loading}
              className="flex-1 px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors">
              {loading ? "Generating…" : "Generate Report"}
            </button>
            {hasResult && (
              <button onClick={exportCSV}
                className="flex-1 px-6 py-2.5 border border-accent text-accent rounded-lg text-sm font-semibold hover:bg-accent hover:text-white transition-colors">
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {hasResult && (
        <div className="space-y-6">
          {transactions.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl px-6 py-12 text-center text-muted text-sm">
              No approved transactions match the selected filters.
            </div>
          ) : (
            <>
              {/* Summary card */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-tx">
                      Summary by {groupBy.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </h2>
                    <p className="text-xs text-muted mt-0.5">
                      {startDate} → {endDate} • {transactions.length} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted uppercase tracking-wide font-semibold">Grand Total</p>
                    <p className="text-xl font-bold text-tx">{formatNaira(grandTotal)}</p>
                  </div>
                </div>
                <div className="divide-y divide-border-soft">
                  {summary.map(row => (
                    <div key={row.label} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-tx">{row.label}</p>
                        <p className="text-xs text-muted mt-0.5">{row.count} transaction{row.count !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-tx">{formatNaira(row.total)}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {grandTotal > 0 ? ((row.total / grandTotal) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail table */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-semibold text-tx">Transaction Detail</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-alt">
                        {["Date","Category","Description","Beneficiaries","Amount","Source","Trigger"].map(h => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-surface-alt transition-colors">
                          <td className="px-6 py-4 text-muted text-xs whitespace-nowrap">
                            {new Date(tx.transaction_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-muted">{tx.category?.name || "—"}</td>
                          <td className="px-6 py-4">{tx.description}</td>
                          <td className="px-6 py-4 text-muted">{tx.beneficiaries}</td>
                          <td className="px-6 py-4 font-semibold text-tx whitespace-nowrap">{formatNaira(tx.amount)}</td>
                          <td className="px-6 py-4 text-muted">{tx.capital_source?.name || "—"}</td>
                          <td className="px-6 py-4 text-muted">{tx.trigger?.name || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-surface-alt">
                        <td colSpan={4} className="px-6 py-3 text-xs font-bold text-muted uppercase tracking-wide">Total</td>
                        <td className="px-6 py-3 font-bold text-tx whitespace-nowrap">{formatNaira(grandTotal)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
