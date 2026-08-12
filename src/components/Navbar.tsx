"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/events", label: "Upcoming Events" },
  { href: "/contact", label: "Contact" },
];

function CartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M6 2a1 1 0 0 0-.96.73L4.32 6H2a1 1 0 1 0 0 2h.42l1.13 7.24A2 2 0 0 0 5.53 17h8.94a2 2 0 0 0 1.98-1.76L17.58 8H18a1 1 0 1 0 0-2h-2.32l-.72-3.27A1 1 0 0 0 14 2H6Zm7.93 4H6.07l.5-2h6.86l.5 2ZM8 10a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0v-3Zm5-1a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0v-3a1 1 0 0 0-1-1Z" />
    </svg>
  );
}

function CartLink({ totalCount, className, onClick }: { totalCount: number; className: string; onClick?: () => void }) {
  return (
    <Link href="/cart" onClick={onClick} className={`relative ${className}`}>
      <CartIcon />
      Cart
      {totalCount > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon px-1 text-xs font-bold text-cream">
          {totalCount}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { totalCount } = useCart();

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
          <CartLink
            totalCount={totalCount}
            className="flex items-center gap-1.5 rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-rust"
          />
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
          <CartLink
            totalCount={totalCount}
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-background"
          />
        </nav>
      )}
    </header>
  );
}
