import { SOURCE_REGISTRY } from './sources/index.js';
import { upsertArticle, logFetch, getLastFetchTime, getDb, saveDb } from './db.js';
import { isDuplicate as checkDuplicate, registerArticle } from './dedup.js';
import { categorizeAll } from './categorizer.js';
import { hasFingerprint, insertFingerprint } from './db.js';

export async function runIngestion(options = {}) {
  const fromDate = options.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate = options.toDate || new Date().toISOString().split('T')[0];

  // Ensure DB is initialized
  await getDb();

  const sourcesToRun = options.sources
    ? SOURCE_REGISTRY.filter(s => options.sources.includes(s.id))
    : SOURCE_REGISTRY;

  // Fetch from all sources in parallel
  const fetchPromises = sourcesToRun.map(async (source) => {
    const sourceResult = { source: source.id, found: 0, new: 0, duplicates: 0, errors: 0 };

    try {
      const rawArticles = await source.fetch(fromDate, toDate);
      sourceResult.found = rawArticles.length;

      // Categorize all articles at once
      const categorized = categorizeAll(rawArticles);

      // Process each article
      for (const article of categorized) {
        const { isDuplicate: dup, fingerprint } = await checkDuplicate(
          article,
          { hasFingerprint }
        );
        if (dup) {
          sourceResult.duplicates++;
          continue;
        }

        const inserted = await upsertArticle({
          id: article.id,
          source: source.id,
          title: article.title,
          link: article.link,
          pubDate: article.pubDate,
          description: article.description,
          countries: article.countries,
          titleCountries: article.titleCountries,
          eventType: article.eventType,
          eventColor: article.eventColor,
          zone: article.zone,
        });

        if (inserted) {
          await registerArticle(article.id, fingerprint, { insertFingerprint });
          sourceResult.new++;
        } else {
          sourceResult.duplicates++;
        }
      }

      await logFetch(source.id, sourceResult.found, sourceResult.new, 'ok');
    } catch (err) {
      console.error(`[ingest] ${source.id} failed:`, err.message);
      sourceResult.errors = 1;
      try {
        await logFetch(source.id, 0, 0, 'error', err.message);
      } catch { /* ignore log failure */ }
    }

    return sourceResult;
  });

  const results = await Promise.all(fetchPromises);

  // Save DB to disk after all ingestion
  saveDb();

  return {
    timestamp: new Date().toISOString(),
    sources: results,
    totalNew: results.reduce((sum, r) => sum + r.new, 0),
    totalDuplicates: results.reduce((sum, r) => sum + r.duplicates, 0),
    totalFound: results.reduce((sum, r) => sum + r.found, 0),
  };
}

export async function isStale(maxAgeMinutes = 15) {
  const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;

  for (const source of SOURCE_REGISTRY) {
    const lastFetch = await getLastFetchTime(source.id);
    if (lastFetch && new Date(lastFetch.replace(' ', 'T') + 'Z').getTime() >= cutoff) {
      return false;
    }
  }

  return true;
}
