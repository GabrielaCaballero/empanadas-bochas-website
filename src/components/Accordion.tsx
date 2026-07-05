"use client";

import { useState, type ReactNode } from "react";

export default function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-maroon/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left font-display text-lg font-semibold text-maroon"
      >
        {title}
        <span className="text-2xl leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pb-5 text-maroon/70">{children}</div>}
    </div>
  );
}
