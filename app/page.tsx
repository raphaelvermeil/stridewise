// Landing page: what the app does + log in / sign up
import Link from "next/link";
import Logo from "@/components/Logo";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo href="/" />
        <div className="flex gap-3">
          <Link href="/login" className={btnSecondary}>Log In</Link>
          <Link href="/login?mode=signup" className={btnPrimary}>Sign Up</Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 pb-24 text-center">
        <h1 className="text-display sm:text-display-xl">Run Lighter.</h1>
        <p className="mt-2 text-h2 sm:text-display">Your stride, explained.</p>
        <p className="mx-auto mt-6 max-w-xl text-body-lg text-muted">
          Film yourself on a treadmill and get a breakdown of your running form, with goals set for you, not for everyone.
        </p>
      </main>
    </div>
  );
}
