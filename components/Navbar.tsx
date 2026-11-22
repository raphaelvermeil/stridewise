// Part 4: top bar on logged-in pages: logo + profile menu (edit profile, log out).
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

const item = "block w-full rounded-sm px-3 py-2 text-left hover:bg-bg";

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <Logo href="/dashboard" />
      {/* shortcut: menu closes on item click or toggle only, not on outside click */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          aria-label="Profile menu"
          aria-expanded={open}
          className="grid size-10 place-items-center rounded-full bg-surface shadow-xs transition duration-200 ease-out hover:shadow-sm active:scale-[0.97]"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 z-10 mt-2 w-44 rounded-md bg-surface p-1.5 shadow-md">
            <Link href="/profile" onClick={() => setOpen(false)} className={item}>Edit profile</Link>
            <button onClick={logout} className={item}>Log out</button>
          </div>
        )}
      </div>
    </nav>
  );
}
