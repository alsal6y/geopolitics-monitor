export async function fetchGDELT(query = 'world') {
  try {
    const params = new URLSearchParams({
      query,
      mode: 'artlist',
      format: 'json',
      maxrecords: '75',
      sort: 'datedesc',
    });

    const res = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?${params}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      console.error(`[gdelt] HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const articles = data.articles || [];

    return articles.map(item => {
      // GDELT seendate: "20260406T143000Z" → "2026-04-06T14:30:00Z"
      let pubDate = '';
      if (item.seendate) {
        const s = item.seendate;
        pubDate = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
      }

      return {
        id: item.url,
        source: 'gdelt',
        title: item.title || '',
        link: item.url,
        pubDate,
        description: '',
      };
    }).filter(a => a.title && a.link);
  } catch (err) {
    console.error('[gdelt] fetch failed:', err.message);
    return [];
  }
}
