// Part 4: send logged-out users to /login. Client-side because supabase-js keeps the session in localStorage.
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const PUBLIC_PATHS = ["/", "/login"];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const [allowed, setAllowed] = useState(isPublic);

  useEffect(() => {
    if (isPublic) return setAllowed(true);
    setAllowed(false);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAllowed(true);
      else router.replace("/login");
    });
  }, [pathname, isPublic, router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  // Don't render protected pages (or let them query the db) until we know who is logged in.
  if (!allowed) return null;
  if (isPublic) return children;
  return (
    <>
      <button onClick={logout} className="fixed top-3 right-3 rounded border px-3 py-1 text-sm">
        Log out
      </button>
      {children}
    </>
  );
}
