const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "has", "have", "had", "will", "would", "could", "should", "may", "might",
  "shall", "can", "do", "does", "did", "not", "no", "its", "it", "this",
  "that", "as", "into", "over", "after", "before", "about", "up", "out",
  "than", "says", "said", "also", "new"
]);

export function generateFingerprint(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 0 && !STOP_WORDS.has(word))
    .sort()
    .join(" ");
}

export async function isDuplicate(article, db) {
  const fingerprint = generateFingerprint(article.title);
  const duplicate = await db.hasFingerprint(fingerprint);
  return { isDuplicate: duplicate, fingerprint };
}

export async function registerArticle(articleId, fingerprint, db) {
  await db.insertFingerprint(fingerprint, articleId);
}
