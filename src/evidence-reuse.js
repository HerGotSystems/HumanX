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

  await env.DB.prepare(`
    INSERT OR IGNORE INTO evidence_claim_links (
      id,evidence_id,claim_id,user_id,stance,link_note,created_at
    ) VALUES (?,?,?,?,?,?,?)
  `).bind(
    id,
    evidenceId,
    claimId,
    userId,
    cleanText(body.stance || 'support', 40),
    cleanText(body.linkNote || 'Reusable evidence attached to additional claim.', 300),
    now
  ).run();

  return json({
    ok: true,
    link: {
      id,
      evidenceId,
      claimId
    },
    evidence: {
      id: evidence.id,
      title: evidence.title
    },
    claim: {
      id: claim.id,
      claim: claim.claim
    }
  });
}
