// Part 4: sex, age, height, weight, experience, running frequency, injury history
"use client";

import { useRouter } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";

export default function OnboardingPage() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-h1">About You</h1>
      <p className="mt-2 mb-8 text-body-lg text-muted">This sets goals for your body and your running, not for everyone.</p>
      <ProfileForm submitLabel="Save & Continue" onSaved={() => router.push("/dashboard")} />
    </main>
  );
}
