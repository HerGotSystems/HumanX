export async function recalcClaimScore(env, claimId) {
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

  return { evidenceScore: avg, survivability, contradictions, status, testability };
}

export function verdict(type, avg, testability, survivability, contradictions) {
  if (type.includes('Religious') || testability < 15) return 'Untestable';
  if (avg >= 80 && survivability >= 75) return 'Proven';
  if (avg >= 65 && survivability >= 55) return 'Strongly Supported';
  if (avg <= 12 && testability >= 80 && contradictions >= 5) return 'Reality Collapse';
  if (avg <= 22) return 'Weak Evidence';
  return 'Plausible';
}

export function qualityScore(q) {
  return ({ repeatable: 85, documented: 68, media: 38, testimony: 24, vibes: 8 }[q] || 20);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
