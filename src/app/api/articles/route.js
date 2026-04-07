import { queryArticles, getArticleCount } from '@/lib/db';
import { isStale, runIngestion } from '@/lib/ingest';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const fromDate = searchParams.get('from') || '2026-01-01';
  const toDate = searchParams.get('to') || new Date().toISOString().split('T')[0];
  const source = searchParams.get('source') || 'all';
  const eventType = searchParams.get('eventType') || null;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Auto-ingestion on first page load when data is stale
  try {
    const stale = await isStale(15);
    if (stale) {
      await runIngestion({ fromDate, toDate });
    }
  } catch (err) {
    console.error('[articles] auto-ingestion failed:', err.message);
  }

  const filters = {
    source: source !== 'all' ? source : undefined,
    eventType: eventType || undefined,
    fromDate,
    toDate,
    limit,
    offset,
  };

  try {
    const articles = await queryArticles(filters);
    const total = await getArticleCount(filters);

    return Response.json({
      articles,
      total,
      limit,
      offset,
      hasMore: offset + articles.length < total,
    });
  } catch (err) {
    console.error('[articles] query error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
