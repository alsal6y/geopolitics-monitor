export async function fetchBBCFeed() {
  const res = await fetch("/api/rss");
  const xml = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const items = Array.from(doc.querySelectorAll("item"));

  return items.map((item) => ({
    id: item.querySelector("guid")?.textContent ?? Math.random().toString(),
    title: item.querySelector("title")?.textContent ?? "",
    link: item.querySelector("link")?.textContent ?? "",
    pubDate: item.querySelector("pubDate")?.textContent ?? "",
    description: item.querySelector("description")?.textContent ?? "",
  }));
}