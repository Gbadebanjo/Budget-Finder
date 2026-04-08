"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }

  async function createCategory() {
    if (!newCategory.trim()) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("categories").insert({
      name: newCategory.trim(),
      created_by: user.id,
    });

    if (error) {
      setError(error.message);
    } else {
      setNewCategory("");
      loadCategories();
    }
  }

  async function updateCategory(id: string) {
    if (!editCategory.trim()) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .update({
        name: editCategory.trim(),
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setEditing(null);
      loadCategories();
    }
  }

  async function deleteCategory(id: string) {
    if (
      !confirm(
        "Are you sure you want to delete this category? This may affect existing transactions.",
      )
    )
      return;

    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      loadCategories();
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tx">Categories</h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Add new category */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-semibold text-tx mb-4">Add New Category</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Category name (e.g., School, Commandant, Director, Personal)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={createCategory}
            disabled={!newCategory.trim()}
            className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Categories list */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-tx">Existing Categories</h2>
        </div>
        <div className="divide-y divide-border-soft">
          {categories.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted text-sm">
              No categories created yet.
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="px-6 py-4">
                {editing === category.id ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                      onClick={() => updateCategory(category.id)}
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
                      <h3 className="font-semibold text-tx">{category.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(category.id);
                          setEditCategory(category.name);
                        }}
                        className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted hover:text-tx transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
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
