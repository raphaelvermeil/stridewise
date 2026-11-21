// Part 4 (stretch): server-only endpoint, like an Express route.
// Takes computed metrics, calls an LLM with ANTHROPIC_API_KEY, returns a plain-language explanation.
export async function POST(_req: Request) {
  return Response.json({ explanation: "TODO" });
}
