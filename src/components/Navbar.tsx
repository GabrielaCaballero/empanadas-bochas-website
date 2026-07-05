"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/events", label: "Upcoming Events" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-maroon/10 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image
            src="/brand/logo.png"
            alt="Empanadas Bochas"
            width={40}
            height={40}
            priority
          />
          <span className="font-display text-lg font-semibold text-maroon">
            Empanadas Bochas
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-maroon transition-colors hover:text-terracotta"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-rust"
          >
            Cart
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 sm:hidden"
        >
          <span className="h-0.5 w-6 bg-maroon" />
          <span className="h-0.5 w-6 bg-maroon" />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-maroon/10 px-6 py-4 sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2 text-sm font-medium text-maroon hover:text-terracotta"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-terracotta px-4 py-2 text-center text-sm font-semibold text-background"
          >
            Cart
          </Link>
        </nav>
      )}
    </header>
  );
}
