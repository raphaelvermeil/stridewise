// Part 4: top bar on logged-in pages: app links + log out.
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const LINKS = [
  { href: "/scan", label: "Scan" },
  { href: "/my-data", label: "My Data" },
  { href: "/goals", label: "Goals" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <nav className="flex items-center gap-4 border-b px-4 py-3">
      <span className="font-semibold">StrideWise</span>
      {LINKS.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
          className={pathname === href ? "font-medium underline underline-offset-4" : "text-gray-600 hover:text-black"}>
          {label}
        </Link>
      ))}
      <button onClick={logout} className="ml-auto rounded border px-3 py-1 text-sm">
        Log out
      </button>
    </nav>
  );
}
