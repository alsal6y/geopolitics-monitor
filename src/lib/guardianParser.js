export async function fetchGuardianFeed(fromDate, toDate) {
  const params = new URLSearchParams({ from: fromDate, to: toDate });
  const res = await fetch(`/api/guardian?${params}`);
  const data = await res.json();

  return (data.response?.results || []).map((item) => ({
    id:          item.webUrl,
    title:       item.webTitle,
    link:        item.webUrl,
    pubDate:     item.webPublicationDate, // ISO 8601 — works with timeAgo() as-is
    description: item.fields?.trailText || "",
  }));
}
