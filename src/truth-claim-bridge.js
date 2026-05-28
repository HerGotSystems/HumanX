export async function convertTruthToClaim(request, env, helpers) {
  const { readJson, cleanId, cleanText, json, requireUser, makeId } = helpers;
  const userId = requireUser(request);
  const body = await readJson(request);

  const truthId = cleanId(body.truthId || body.truth_id || '');
  if (!truthId) return json({ error: 'TRUTH_ID_REQUIRED' }, 400);

  const truth = await env.DB.prepare(`SELECT * FROM truths WHERE id=?`).bind(truthId).first();
  if (!truth) return json({ error: 'TRUTH_NOT_FOUND' }, 404);

  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`)
    .bind(userId, `anon-${userId.slice(-6)}`, Date.now())
    .run();

  const now = Date.now();
  const claimId = makeId('clm');

  const generatedClaim = cleanText(
    body.claim || `${truth.statement} — this statement reflects reality consistently enough to survive evidence and repeatable pressure testing.`,
    1200
  );

  await env.DB.prepare(`
    INSERT INTO claims (
      id,user_id,claim,category,type,status,
      evidence_score,survivability,testability,contradictions,
      created_at,updated_at,review_state
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    claimId,
    userId,
    generatedClaim,
    truth.category || 'truth-derived',
    'Truth-Derived',
    'Plausible',
    5,
    50,
    50,
    0,
    now,
    now,
    'public'
  ).run();

  const linkId = makeId('tcl');

  await env.DB.prepare(`
    INSERT OR IGNORE INTO truth_claim_links (
      id,truth_id,claim_id,user_id,bridge_note,created_at
    ) VALUES (?,?,?,?,?,?)
  `).bind(
    linkId,
    truthId,
    claimId,
    userId,
    cleanText(body.bridgeNote || 'Converted from repeated truth statement into pressure-testable claim.', 400),
    now
  ).run();

  await env.DB.prepare(`UPDATE truths SET converted_claim_count=COALESCE(converted_claim_count,0)+1, updated_at=? WHERE id=?`).bind(now, truthId).run();

  const claim = await env.DB.prepare(`SELECT * FROM claims WHERE id=?`).bind(claimId).first();

  return json({
    ok: true,
    truth: {
      id: truth.id,
      statement: truth.statement
    },
    claim,
    bridge: {
      truthId,
      claimId,
      linkId
    }
  });
}
