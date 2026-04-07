import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function toISO(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString();
  } catch {
    return dateStr;
  }
}

async function fetchRSSFeed(url, sourceName) {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'GeopoliticsMonitor/1.0' },
    });
    if (!res.ok) {
      console.error(`[rss:${sourceName}] HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const parsed = parser.parse(xml);

    // Handle RSS 2.0, RDF, and Atom structures
    let items = parsed?.rss?.channel?.item
      || parsed?.['rdf:RDF']?.item
      || parsed?.feed?.entry
      || [];

    // Ensure items is an array (single-item feeds return an object)
    if (!Array.isArray(items)) items = [items];

    return items.map(item => {
      // guid can be a string or an object with #text
      let guid = item.guid;
      if (guid && typeof guid === 'object') guid = guid['#text'];
      if (!guid || typeof guid !== 'string') guid = item.link;

      // Handle Atom link format (object with @_href)
      let link = item.link;
      if (link && typeof link === 'object') link = link['@_href'] || '';

      return {
        id: guid || `${sourceName}-${Math.random().toString(36).slice(2)}`,
        source: sourceName,
        title: (typeof item.title === 'object' ? item.title['#text'] : item.title || '').trim(),
        link: (typeof link === 'string' ? link : '').trim(),
        pubDate: toISO(item.pubDate || item['dc:date'] || item.published || item.updated || ''),
        description: stripHtml(
          item.description || item.summary || item['content:encoded'] || ''
        ),
      };
    }).filter(a => a.title && a.link);
  } catch (err) {
    console.error(`[rss:${sourceName}] fetch failed:`, err.message);
    return [];
  }
}

export async function fetchBBC() {
  return fetchRSSFeed('https://feeds.bbci.co.uk/news/world/rss.xml', 'bbc');
}

export async function fetchAlJazeera() {
  // Direct AJ feed has SSL issues on some systems; use Google News proxy
  return fetchRSSFeed(
    'https://news.google.com/rss/search?q=site:aljazeera.com+world&hl=en&gl=US&ceid=US:en',
    'aljazeera'
  );
}

export async function fetchReuters() {
  // Direct Reuters feed is down; use Google News proxy
  return fetchRSSFeed(
    'https://news.google.com/rss/search?q=site:reuters.com+world&hl=en&gl=US&ceid=US:en',
    'reuters'
  );
}

export async function fetchFrance24() {
  return fetchRSSFeed('https://www.france24.com/en/rss', 'france24');
}

export async function fetchDW() {
  return fetchRSSFeed('https://rss.dw.com/rdf/rss-en-world', 'dw');
}

export async function fetchNPR() {
  return fetchRSSFeed('https://feeds.npr.org/1004/rss.xml', 'npr');
}

export async function fetchUNNews() {
  return fetchRSSFeed('https://news.un.org/feed/subscribe/en/news/all/rss.xml', 'unnews');
}
