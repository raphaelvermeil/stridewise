// Landing page: what the app does + log in / sign up
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-6 pt-24 text-center">
      <h1 className="text-4xl font-semibold">StrideWise</h1>
      <p className="mt-3 text-gray-600">
        Film yourself on a treadmill and get a breakdown of your running form, with goals set for you, not for everyone.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/login?mode=signup" className="rounded bg-black px-5 py-2 text-white">Sign up</Link>
        <Link href="/login" className="rounded border px-5 py-2">Log in</Link>
      </div>
    </main>
  );
}
