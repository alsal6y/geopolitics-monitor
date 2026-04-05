export async function GET() {
  const res = await fetch("https://feeds.bbci.co.uk/news/world/rss.xml", {
    next: { revalidate: 300 },
  });
  const xml = await res.text();
  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}