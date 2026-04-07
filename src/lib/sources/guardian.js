export async function fetchGuardian(fromDate, toDate) {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey || apiKey === 'test') {
    console.warn('[guardian] No valid GUARDIAN_API_KEY set, skipping');
    return [];
  }

  try {
    const baseParams = [
      'section=world',
      `from-date=${fromDate}`,
      `to-date=${toDate}`,
      'page-size=50',
      'order-by=newest',
      'show-fields=trailText',
      `api-key=${apiKey}`,
    ].join('&');

    // Fetch page 1 to get total pages
    const firstRes = await fetch(`https://content.guardianapis.com/search?${baseParams}&page=1`);
    const firstJson = await firstRes.json();
    const response = firstJson.response;

    if (!response || response.status !== 'ok') {
      console.error('[guardian] API error:', firstJson);
      return [];
    }

    const totalPages = Math.min(response.pages || 1, 5); // cap at 5 pages
    let allResults = [...(response.results || [])];

    // Fetch remaining pages in parallel
    if (totalPages > 1) {
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(
          fetch(`https://content.guardianapis.com/search?${baseParams}&page=${page}`)
            .then(r => r.json())
            .then(json => json.response?.results || [])
            .catch(err => {
              console.error(`[guardian] page ${page} failed:`, err.message);
              return [];
            })
        );
      }
      const pageResults = await Promise.all(pagePromises);
      for (const results of pageResults) {
        allResults = allResults.concat(results);
      }
    }

    return allResults.map(item => ({
      id: item.webUrl,
      source: 'guardian',
      title: item.webTitle,
      link: item.webUrl,
      pubDate: item.webPublicationDate,
      description: item.fields?.trailText || '',
    }));
  } catch (err) {
    console.error('[guardian] fetch failed:', err.message);
    return [];
  }
}
