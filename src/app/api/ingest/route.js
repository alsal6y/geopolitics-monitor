import { runIngestion } from '@/lib/ingest';

export async function POST(request) {
  const secret = process.env.INGEST_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let options = {};
  try {
    options = await request.json();
  } catch {
    // no body or invalid JSON — use defaults
  }

  try {
    const result = await runIngestion(options);
    return Response.json(result);
  } catch (err) {
    console.error('[ingest] route error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
