"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import type { Trigger, Category } from "@/lib/types";

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [newTrigger, setNewTrigger] = useState({
    category_id: "",
    name: "",
    price: "",
  });
  const [editTrigger, setEditTrigger] = useState({
    category_id: "",
    name: "",
    price: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    const [triggersRes, categoriesRes] = await Promise.all([
      supabase
        .from("triggers")
        .select("*, category:categories(name)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);

    if (triggersRes.data) setTriggers(triggersRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);

    setLoading(false);
  }

  async function createTrigger() {
    if (!newTrigger.category_id || !newTrigger.name.trim() || !newTrigger.price)
      return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("triggers").insert({
      category_id: newTrigger.category_id,
      name: newTrigger.name.trim(),
      price: parseFloat(newTrigger.price),
      created_by: user.id,
    });

    if (error) {
      setError(error.message);
    } else {
      setNewTrigger({ category_id: "", name: "", price: "" });
      loadData();
    }
  }

  async function updateTrigger(id: string) {
    if (
      !editTrigger.category_id ||
      !editTrigger.name.trim() ||
      !editTrigger.price
    )
      return;

    const supabase = createClient();
    const { error } = await supabase
      .from("triggers")
      .update({
        category_id: editTrigger.category_id,
        name: editTrigger.name.trim(),
        price: parseFloat(editTrigger.price),
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setEditing(null);
      loadData();
    }
  }

  async function deleteTrigger(id: string) {
    if (
      !confirm(
        "Are you sure you want to delete this trigger? This may affect existing transactions.",
      )
    )
      return;

    const supabase = createClient();
    const { error } = await supabase.from("triggers").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      loadData();
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx">Triggers</h1>
        <p className="text-sm text-muted">
          Triggers are sub-items within categories (e.g., for School category)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Add new trigger */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-semibold text-tx mb-4">Add New Trigger</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={newTrigger.category_id}
            onChange={(e) =>
              setNewTrigger((prev) => ({
                ...prev,
                category_id: e.target.value,
              }))
            }
            className="rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Trigger name"
            value={newTrigger.name}
            onChange={(e) =>
              setNewTrigger((prev) => ({ ...prev, name: e.target.value }))
            }
            className="rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="number"
            placeholder="Price"
            min="0"
            step="0.01"
            value={newTrigger.price}
            onChange={(e) =>
              setNewTrigger((prev) => ({ ...prev, price: e.target.value }))
            }
            className="rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={createTrigger}
            disabled={
              !newTrigger.category_id ||
              !newTrigger.name.trim() ||
              !newTrigger.price
            }
            className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Triggers list */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-tx">Existing Triggers</h2>
        </div>
        <div className="divide-y divide-border-soft">
          {triggers.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted text-sm">
              No triggers created yet.
            </div>
          ) : (
            triggers.map((trigger) => (
              <div key={trigger.id} className="px-6 py-4">
                {editing === trigger.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                      value={editTrigger.category_id}
                      onChange={(e) =>
                        setEditTrigger((prev) => ({
                          ...prev,
                          category_id: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editTrigger.name}
                      onChange={(e) =>
                        setEditTrigger((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editTrigger.price}
                      onChange={(e) =>
                        setEditTrigger((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateTrigger(trigger.id)}
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
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-tx">{trigger.name}</h3>
                      <p className="text-sm text-muted">
                        Category: {trigger.category?.name} • Price: {formatNaira(trigger.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(trigger.id);
                          setEditTrigger({
                            category_id: trigger.category_id,
                            name: trigger.name,
                            price: trigger.price.toString(),
                          });
                        }}
                        className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted hover:text-tx transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTrigger(trigger.id)}
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
