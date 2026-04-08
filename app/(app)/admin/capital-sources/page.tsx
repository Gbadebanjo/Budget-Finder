"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import type { CapitalSource } from "@/lib/types";

export default function CapitalSourcesPage() {
  const [sources, setSources] = useState<CapitalSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [newSource, setNewSource] = useState({ name: "", amount: "" });
  const [editSource, setEditSource] = useState({ name: "", amount: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("capital_sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setSources(data || []);
    }
    setLoading(false);
  }

  async function createSource() {
    if (!newSource.name.trim() || !newSource.amount) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("capital_sources").insert({
      name: newSource.name.trim(),
      amount: parseFloat(newSource.amount),
      created_by: user.id,
    });

    if (error) {
      setError(error.message);
    } else {
      setNewSource({ name: "", amount: "" });
      loadSources();
    }
  }

  async function updateSource(id: string) {
    if (!editSource.name.trim() || !editSource.amount) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("capital_sources")
      .update({
        name: editSource.name.trim(),
        amount: parseFloat(editSource.amount),
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setEditing(null);
      loadSources();
    }
  }

  async function deleteSource(id: string) {
    if (!confirm("Are you sure you want to delete this capital source?"))
      return;

    const supabase = createClient();
    const { error } = await supabase
      .from("capital_sources")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      loadSources();
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx">Capital Sources</h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Add new source */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-semibold text-tx mb-4">Add New Capital Source</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Source name"
            value={newSource.name}
            onChange={(e) =>
              setNewSource((prev) => ({ ...prev, name: e.target.value }))
            }
            className="flex-1 rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="number"
            placeholder="Amount"
            min="0"
            step="0.01"
            value={newSource.amount}
            onChange={(e) =>
              setNewSource((prev) => ({ ...prev, amount: e.target.value }))
            }
            className="w-32 rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={createSource}
            disabled={!newSource.name.trim() || !newSource.amount}
            className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Sources list */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-tx">Existing Capital Sources</h2>
        </div>
        <div className="divide-y divide-border-soft">
          {sources.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted text-sm">
              No capital sources created yet.
            </div>
          ) : (
            sources.map((source) => (
              <div key={source.id} className="px-6 py-4">
                {editing === source.id ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={editSource.name}
                      onChange={(e) =>
                        setEditSource((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="flex-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editSource.amount}
                      onChange={(e) =>
                        setEditSource((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      className="w-32 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                      onClick={() => updateSource(source.id)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-3 py-2 border border-border rounded-lg text-sm font-medium text-muted hover:text-tx transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-tx">{source.name}</h3>
                      <p className="text-sm text-muted">
                        {formatNaira(source.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(source.id);
                          setEditSource({
                            name: source.name,
                            amount: source.amount.toString(),
                          });
                        }}
                        className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted hover:text-tx transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSource(source.id)}
                        className="px-3 py-1.5 border border-red-300 dark:border-red-800 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
