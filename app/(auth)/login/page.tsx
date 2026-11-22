// Part 4: sign up / log in with Supabase Auth
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getProfile } from "@/lib/db/profiles";
import Logo from "@/components/Logo";
import { btnPrimary, card, input, inputInvalid, label, spinner } from "@/components/ui/styles";

export default function LoginPage() {
  const router = useRouter();
  const [signUp, setSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false); // red outline on the password box, until they type again
  const [shake, setShake] = useState(false); // on for one shake, so the next wrong try shakes again

  // /login?mode=signup opens on sign up (home page button). Read after mount so the static page needs no Suspense.
  useEffect(() => setSignUp(new URLSearchParams(location.search).get("mode") === "signup"), []);

  // Already logged in (e.g. came back via the home page): skip the form.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) router.replace(await nextPage());
    });
  }, [router]);

  async function nextPage() {
    return (await getProfile()) ? "/dashboard" : "/onboarding";
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const { data, error } = signUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/onboarding` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (!signUp) {
        setWrong(true);
        setShake(true);
      }
      return setMessage(error.message);
    }
    if (!data.session) return setMessage("Check your email and click the link to confirm your account. It opens the next step in a new tab, so you can close this one.");
    router.push(await nextPage());
  }

  function toggle() {
    setSignUp(!signUp);
    setMessage("");
  }

  const title = signUp ? "Sign up" : "Log in";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 p-6">
      <div className="flex justify-center"><Logo href="/" /></div>
      <div className={card}>
      <h1 className="mb-6 text-h2">{title}</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className={label}>
          Email
          <input className={input} type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={label}>
          Password
          <input type="password" required minLength={6}
            className={`${input} ${wrong ? inputInvalid : ""} ${shake ? "animate-shake" : ""}`}
            aria-invalid={wrong}
            onAnimationEnd={() => setShake(false)}
            autoComplete={signUp ? "new-password" : "current-password"}
            value={password} onChange={(e) => { setPassword(e.target.value); setWrong(false); }} />
        </label>
        <button className={`${btnPrimary} mt-2`} disabled={busy}>
          {busy ? <span className={`${spinner} size-5`} aria-label="Loading" /> : title}
        </button>
        {message && <p role="alert" className="text-body-sm text-muted">{message}</p>}
      </form>
      <p className="mt-6 text-body-sm text-muted">
        {signUp ? "Already have an account? " : "New to StrideWise? "}
        <button type="button" onClick={toggle} className="font-medium text-ink underline">
          {signUp ? "Log in" : "Sign up"}
        </button>
      </p>
      </div>
    </main>
  );
}
