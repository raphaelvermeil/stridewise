// Part 3: annotated playback + one card per metric + recommendations
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <main>Results for session {sessionId}</main>;
}
