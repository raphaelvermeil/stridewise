// Part 4: edit the runner's details and their goal for each metric.
"use client";

import { useEffect, useState } from "react";
import { getProfile, type Profile } from "@/lib/db/profiles";
import ProfileForm from "@/components/ProfileForm";
import GoalEditor from "@/components/dashboard/GoalEditor";
import { spinner } from "@/components/ui/styles";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);

  // Reloaded after a save so goal suggestions follow the new details.
  const load = () => getProfile().then(setProfile);
  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-2xl space-y-12 px-6 py-12">
      <section>
        <h1 className="text-h1">Profile</h1>
        <p className="mt-2 mb-8 text-body-lg text-muted">Your details shape the goals suggested for you.</p>
        {!profile && <div className="grid place-items-center py-24"><span aria-label="Loading" className={`${spinner} size-8`} /></div>}
        {profile && (
          <ProfileForm initial={profile} submitLabel="Save Details" onSaved={() => { setSaved(true); load(); }} />
        )}
        {saved && <p role="status" className="mt-3 text-body-sm text-muted">Details saved.</p>}
      </section>
      {profile && (
        <section>
          <h2 className="text-h2">Goals</h2>
          <p className="mt-2 mb-8 text-body-lg text-muted">The range you want each metric to land in. Charts and results are measured against these.</p>
          <GoalEditor key={JSON.stringify(profile)} profile={profile} />
        </section>
      )}
    </main>
  );
}
