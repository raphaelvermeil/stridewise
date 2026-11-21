// "On goal" / "Outside goal" pill. Worded, so it never relies on colour alone.
export default function GoalBadge({ ok }: { ok: boolean }) {
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-body-sm font-medium ${ok ? "bg-accent" : "bg-bg text-muted"}`}>
      {ok ? "✓ On goal" : "Outside goal"}
    </span>
  );
}
