export async function listEvidenceVault(request, env, helpers) {
  const { json } = helpers;
  const url = new URL(request.url);
  const q = `%${String(url.searchParams.get('q') || '').slice(0, 80)}%`;
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 60)));

  const rows = await env.DB.prepare(`
    SELECT
      e.id,
      e.claim_id,
      e.stance,
      e.quality,
      e.title,
      e.body,
      e.source_url,
      e.media_type,
      e.reliability_score,
      e.votes,
      e.created_at,
      e.duplicate_signature,
      c.claim,
      c.status,
      c.category,
      u.handle
    FROM evidence e
    LEFT JOIN claims c ON c.id=e.claim_id
    LEFT JOIN users u ON u.id=e.user_id
    WHERE COALESCE(c.review_state,'public')='public' AND (e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?)
    ORDER BY e.reliability_score DESC, e.created_at DESC
    LIMIT ?
  `).bind(q, q, q, limit).all();

  const evidence = (rows.results || []).map(row => ({
    id: row.id,
    claimId: row.claim_id,
    stance: row.stance,
    quality: row.quality,
    title: row.title,
    body: row.body,
    sourceUrl: row.source_url,
    mediaType: row.media_type || 'text',
    reliabilityScore: row.reliability_score || 20,
    votes: row.votes || 0,
    duplicateSignature: row.duplicate_signature,
    createdAt: row.created_at,
    claim: row.claim,
    claimStatus: row.status,
    category: row.category,
    handle: row.handle || 'anon'
  }));

  return json({ evidence });
}
