"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/", label: "Overview" },
  { href: "/courses", label: "Course Catalog" },
  { href: "/dashboard", label: "My Progress" },
  { href: "/admin", label: "Admin" }
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b border-secondary/20 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="text-lg font-bold text-secondary">
          EthixLearn
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
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
        </nav>
      </div>
    </header>
  );
}
