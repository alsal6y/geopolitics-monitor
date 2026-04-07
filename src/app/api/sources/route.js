import { getSourceStats } from '@/lib/db';
import { SOURCE_REGISTRY } from '@/lib/sources/index';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getSourceStats();

    const sources = SOURCE_REGISTRY.map((reg) => {
      const stat = stats.find((s) => s.source === reg.id);
      return {
        id: reg.id,
        name: reg.name,
        handle: reg.handle,
        color: reg.color,
        badgeLetter: reg.badgeLetter,
        articleCount: stat?.articleCount || 0,
        lastFetch: stat?.lastFetch || null,
      };
    });

    return Response.json({ sources });
  } catch (err) {
    console.error('[sources] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
