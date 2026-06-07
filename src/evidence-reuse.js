import { recalcClaimScore } from './claim-scoring.js';

export async function attachEvidenceToClaim(request, env, helpers) {
  const { readJson, cleanId, cleanText, json, requireUser, makeId } = helpers;
  const userId = await requireUser(request);
  await safeRateLimit(request, env, `evidence-attach:${ip(request)}`, 20, 3600000);
  const body = await readJson(request);

  const evidenceId = cleanId(body.evidenceId || body.evidence_id || '');
  const claimId = cleanId(body.claimId || body.claim_id || '');

  if (!evidenceId || !claimId) {
    return json({ error: 'EVIDENCE_AND_CLAIM_REQUIRED' }, 400);
  }

  const evidence = await env.DB.prepare(`SELECT * FROM evidence WHERE id=?`).bind(evidenceId).first();
  if (!evidence) return json({ error: 'EVIDENCE_NOT_FOUND' }, 404);

  const claim = await env.DB.prepare(`SELECT * FROM claims WHERE id=?`).bind(claimId).first();
  if (!claim) return json({ error: 'CLAIM_NOT_FOUND' }, 404);

  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`)
    .bind(userId, `anon-${userId.slice(-6)}`, Date.now())
    .run();

  const id = makeId('ecl');
  const now = Date.now();
  const stance = cleanText(body.stance || 'support', 40);

  await env.DB.prepare(`
    INSERT OR IGNORE INTO evidence_claim_links (
      id,evidence_id,claim_id,user_id,stance,link_note,created_at
    ) VALUES (?,?,?,?,?,?,?)
  `).bind(
    id,
    evidenceId,
    claimId,
    userId,
    stance,
    cleanText(body.linkNote || 'Reusable evidence attached to additional claim.', 300),
    now
  ).run();

  // Fetch the actual row (may differ from generated id if insert was ignored)
  const linkRow = await env.DB.prepare(`SELECT id FROM evidence_claim_links WHERE evidence_id=? AND claim_id=? LIMIT 1`).bind(evidenceId, claimId).first();
  const actualLinkId = linkRow?.id || id;

  await recalcClaimScore(env, claimId);
  const updatedClaim = await env.DB.prepare(`SELECT * FROM claims WHERE id=?`).bind(claimId).first();

  return json({
    ok: true,
    link: {
      id: actualLinkId,
      evidenceId,
      claimId,
      stance
    },
    evidence: {
      id: evidence.id,
      title: evidence.title
    },
    claim: mapClaim(updatedClaim || claim)
  });
}

async function safeRateLimit(request, env, rateKey, maxHits, windowMs) {
  try {
    const now = Date.now();
    const row = await env.DB.prepare(`SELECT hits, window_start FROM rate_limits WHERE "key"=?`).bind(rateKey).first();
    if (!row || now - row.window_start > windowMs) {
      await env.DB.prepare(`INSERT OR REPLACE INTO rate_limits ("key",hits,window_start) VALUES (?,?,?)`).bind(rateKey, 1, now).run();
      return;
    }
    if (row.hits >= maxHits) throw new Error('RATE_LIMITED');
    await env.DB.prepare(`UPDATE rate_limits SET hits=hits+1 WHERE "key"=?`).bind(rateKey).run();
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    if (message.includes('RATE_LIMITED')) throw err;
    throw new Error(`RATE_LIMIT_UNAVAILABLE: ${message}`);
  }
}

function ip(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
}

function mapClaim(c) {
  if (!c) return null;
  return {
    id: c.id,
    claim: c.claim,
    category: c.category,
    type: c.type,
    status: c.status,
    evidenceScore: c.evidence_score ?? c.evidenceScore,
    survivability: c.survivability,
    testability: c.testability,
    contradictions: c.contradictions,
    reportCount: c.report_count || 0,
    reviewState: c.review_state || 'public',
    beliefYes: c.belief_yes || 0,
    beliefNo: c.belief_no || 0,
    uncertainty: c.uncertainty || 0,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    handle: c.handle || 'anon'
  };
}
