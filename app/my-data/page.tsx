// Part 3: session list + one chart per metric across sessions
import LatestRecording from "@/components/scan/LatestRecording";

export default function MyDataPage() {
  return (
    <main className="p-4 space-y-4">
      My Data
      {/* Part 2: keep this at the bottom of the page */}
      <LatestRecording />
    </main>
  );
}
