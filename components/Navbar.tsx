"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import ThemeToggle from "./ThemeToggle";

const roleBadge: Record<string, string> = {
  admin:      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  controller: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  user:       "bg-surface-alt text-muted",
};

const adminLinks = [
  { href: "/admin/capital-sources", label: "Capital Sources" },
  { href: "/admin/categories",      label: "Categories" },
  { href: "/admin/triggers",        label: "Triggers" },
  { href: "/users",                 label: "Users" },
];

const mainLinks = [
  { href: "/dashboard",    label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/reports",      label: "Reports" },
];

export default function Navbar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const { profile } = useUser();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen,  setAdminOpen]  = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  // Close admin dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isAdminActive = adminLinks.some(l => pathname.startsWith(l.href));

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span className="text-base font-bold text-tx hidden sm:block">FinanceTracker</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1 flex-1">
            {mainLinks.map(({ href, label }) => (
              <Link key={href} href={href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? "bg-accent-light text-accent"
                    : "text-muted hover:text-tx hover:bg-surface-alt"
                }`}>
                {label}
              </Link>
            ))}

            {/* Admin dropdown */}
            {profile?.role === "admin" && (
              <div ref={adminRef} className="relative">
                <button
                  onClick={() => setAdminOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isAdminActive
                      ? "bg-accent-light text-accent"
                      : "text-muted hover:text-tx hover:bg-surface-alt"
                  }`}
                >
                  Admin
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform ${adminOpen ? "rotate-180" : ""}`}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {adminOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-48 bg-surface border border-border rounded-xl shadow-lg py-1 z-50">
                    {adminLinks.map(({ href, label }) => (
                      <Link key={href} href={href}
                        onClick={() => setAdminOpen(false)}
                        className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                          pathname.startsWith(href)
                            ? "text-accent font-medium bg-accent-light"
                            : "text-tx hover:bg-surface-alt"
                        }`}>
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {profile && (
              <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-border">
                <div className="text-right">
                  <p className="text-xs font-semibold text-tx leading-tight">
                    {profile.full_name || profile.email}
                  </p>
                  <p className="text-xs text-muted leading-tight">{profile.email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[profile.role]}`}>
                  {profile.role}
                </span>
              </div>
            )}

            <button onClick={signOut}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted hover:text-tx px-3 py-2 rounded-lg hover:bg-surface-alt transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(o => !o)}
              className="sm:hidden p-2 rounded-lg text-muted hover:text-tx hover:bg-surface-alt transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-surface px-4 py-3 space-y-1">
          {mainLinks.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-accent-light text-accent"
                  : "text-muted hover:text-tx hover:bg-surface-alt"
              }`}>
              {label}
            </Link>
          ))}

          {profile?.role === "admin" && (
            <>
              <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted uppercase tracking-wider">Admin</p>
              {adminLinks.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(href)
                      ? "bg-accent-light text-accent"
                      : "text-muted hover:text-tx hover:bg-surface-alt"
                  }`}>
                  {label}
                </Link>
              ))}
            </>
          )}

          {profile && (
            <div className="pt-3 mt-2 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-tx">{profile.full_name || profile.email}</p>
                <p className="text-xs text-muted">{profile.email}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[profile.role]}`}>
                {profile.role}
              </span>
            </div>
          )}

          <button onClick={signOut}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted hover:text-tx hover:bg-surface-alt transition-colors">
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
