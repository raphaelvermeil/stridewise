// Part 4: sign up / log in with Supabase Auth
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getProfile } from "@/lib/db/profiles";

export default function LoginPage() {
  const router = useRouter();
  const [signUp, setSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // /login?mode=signup opens on sign up (home page button). Read after mount so the static page needs no Suspense.
  useEffect(() => setSignUp(new URLSearchParams(location.search).get("mode") === "signup"), []);

  // Already logged in (e.g. came back via the home page): skip the form.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) router.replace(await nextPage());
    });
  }, [router]);

  async function nextPage() {
    return (await getProfile()) ? "/my-data" : "/onboarding";
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const { data, error } = signUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/onboarding` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMessage(error.message);
    if (!data.session) return setMessage("Check your email and click the link to confirm your account. It opens the next step in a new tab, so you can close this one.");
    router.push(await nextPage());
  }

  function toggle() {
    setSignUp(!signUp);
    setMessage("");
  }

  const title = signUp ? "Sign up" : "Log in";

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          Email
          <input className="rounded border p-2" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          Password
          <input className="rounded border p-2" type="password" required minLength={6}
            autoComplete={signUp ? "new-password" : "current-password"}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="rounded bg-black p-2 text-white disabled:opacity-50" disabled={busy}>
          {busy ? "…" : title}
        </button>
        {message && <p role="alert">{message}</p>}
      </form>
      <p className="mt-4 text-sm text-gray-600">
        {signUp ? "Already have an account? " : "New to StrideWise? "}
        <button type="button" onClick={toggle} className="font-medium text-black underline">
          {signUp ? "Log in" : "Sign up"}
        </button>
      </p>
    </main>
  );
}
