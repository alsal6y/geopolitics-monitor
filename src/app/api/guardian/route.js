export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "2026-03-01";
  const to   = searchParams.get("to")   || new Date().toISOString().split("T")[0];

  const apiKey = process.env.GUARDIAN_API_KEY || "test";
  const url = [
    "https://content.guardianapis.com/search",
    `?section=world`,
    `&from-date=${from}`,
    `&to-date=${to}`,
    `&page-size=50`,
    `&order-by=newest`,
    `&show-fields=trailText`,
    `&api-key=${apiKey}`,
  ].join("");

  const res = await fetch(url, { next: { revalidate: 300 } });
  const json = await res.json();
  return Response.json(json);
}
