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

  await recalcClaimWithReusableEvidence(env, claimId);
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

async function recalcClaimWithReusableEvidence(env, claimId) {
  const directEvidence = await env.DB.prepare(`SELECT quality, stance FROM evidence WHERE claim_id=?`).bind(claimId).all();
  const reusedEvidence = await env.DB.prepare(`
    SELECT e.quality, l.stance
    FROM evidence_claim_links l
    JOIN evidence e ON e.id=l.evidence_id
    WHERE l.claim_id=?
  `).bind(claimId).all();
  const pressure = await env.DB.prepare(`SELECT severity FROM pressure_points WHERE claim_id=?`).bind(claimId).all();
  const claim = await env.DB.prepare(`SELECT type,testability FROM claims WHERE id=?`).bind(claimId).first();

  const evidenceRows = [...(directEvidence.results || []), ...(reusedEvidence.results || [])];
  const supportRows = evidenceRows.filter(e => String(e.stance || 'support').toLowerCase() !== 'pressure');
  const pressureEvidenceRows = evidenceRows.filter(e => String(e.stance || '').toLowerCase() === 'pressure');
  const qualities = supportRows.map(x => qualityScore(x.quality));
  const avg = qualities.length ? Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length) : 5;
  const pressureSeverity = (pressure.results || []).reduce((a, p) => a + Number(p.severity || 1), 0) + pressureEvidenceRows.length;
  const contradictions = (pressure.results || []).length + pressureEvidenceRows.length;
  const testability = Number(claim?.testability || 50);
  const survivability = clamp(Math.round(avg - pressureSeverity * 1.8 + testability * 0.22), 0, 100);
  const status = verdict(claim?.type || '', avg, testability, survivability, contradictions);

  await env.DB.prepare(`UPDATE claims SET evidence_score=?, survivability=?, contradictions=?, status=?, updated_at=? WHERE id=?`)
    .bind(avg, survivability, contradictions, status, Date.now(), claimId)
    .run();
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

function verdict(type, avg, testability, survivability, contradictions) {
  if (type.includes('Religious') || testability < 15) return 'Untestable';
  if (avg >= 80 && survivability >= 75) return 'Proven';
  if (avg >= 65 && survivability >= 55) return 'Strongly Supported';
  if (avg <= 12 && testability >= 80 && contradictions >= 5) return 'Reality Collapse';
  if (avg <= 22) return 'Weak Evidence';
  return 'Plausible';
}

function qualityScore(q) {
  return ({ repeatable: 85, documented: 68, media: 38, testimony: 24, vibes: 8 }[q] || 20);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
