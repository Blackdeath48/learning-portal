"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "../hooks/useAuth";

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const links = [
    { href: "/", label: "Overview" },
    { href: "/courses", label: "Course Catalog" }
  ];

  if (user) {
    links.push({ href: "/dashboard", label: "My Progress" });
  }

  if (user?.role === "ADMIN") {
    links.push({ href: "/admin", label: "Admin" });
  }

  return (
    <header className="border-b border-secondary/20 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:flex-nowrap md:px-8">
        <Link href="/" className="text-lg font-bold text-secondary">
          EthixLearn
        </Link>
        <nav className="flex flex-1 flex-wrap items-center justify-end gap-4 text-sm font-semibold">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "rounded-full px-4 py-2 transition",
                pathname === link.href
                  ? "bg-secondary text-white shadow"
                  : "text-secondary hover:bg-secondary/10"
              )}
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <>
              <Link
                href="/login"
                className={clsx(
                  "rounded-full px-4 py-2 text-secondary transition hover:bg-secondary/10",
                  pathname === "/login" && "bg-secondary text-white shadow"
                )}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-accent px-4 py-2 text-white shadow transition hover:bg-accent/80"
              >
                Create account
              </Link>
            </>
          )}
          {user && (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-secondary/20 px-4 py-2 text-secondary transition hover:bg-secondary/10"
            >
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
