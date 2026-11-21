// Part 4: sign up / log in with Supabase Auth
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getProfile } from "@/lib/db/profiles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const signUp = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "signup";
    setBusy(true);
    setMessage("");
    const { data, error } = signUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/onboarding` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMessage(error.message);
    if (!data.session) return setMessage("Check your email and click the link to confirm your account. It opens the next step in a new tab, so you can close this one.");
    router.push((await getProfile()) ? "/my-data" : "/onboarding");
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Log in</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          Email
          <input className="rounded border p-2" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          Password
          <input className="rounded border p-2" type="password" required minLength={6} autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <div className="flex gap-2">
          <button className="flex-1 rounded bg-black p-2 text-white disabled:opacity-50" disabled={busy} value="login">
            Log in
          </button>
          <button className="flex-1 rounded border p-2 disabled:opacity-50" disabled={busy} value="signup">
            Sign up
          </button>
        </div>
        {message && <p role="alert">{message}</p>}
      </form>
    </main>
  );
}
