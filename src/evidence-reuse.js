import { recalcClaimScore } from './claim-scoring.js';

export async function attachEvidenceToClaim(request, env, helpers) {
  const { readJson, cleanId, cleanText, json, requireUser, makeId } = helpers;
  const userId = requireUser(request);
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

  await recalcClaimScore(env, claimId);
  const updatedClaim = await env.DB.prepare(`SELECT * FROM claims WHERE id=?`).bind(claimId).first();

  return json({
    ok: true,
    link: {
      id,
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
