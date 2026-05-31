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

  const existing = await findExistingClaim(env, truthId, truth);
  if (existing) {
    return json({ ok: true, existing: true, truth: { id: truth.id, statement: truth.statement }, claim: existing, bridge: { truthId, claimId: existing.id, linkId: existing.link_id || null } });
  }

  const now = Date.now();
  const claimId = makeId('clm');
  const generatedClaim = cleanText(body.claim || truth.statement, 1200);
  const normalizedClaim = normalizeClaim(generatedClaim);

  await insertClaimWithNormalizedKey(env, {
    claimId,
    userId,
    generatedClaim,
    category: truth.category || 'truth-derived',
    now,
    normalizedClaim
  });

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

  await env.DB.prepare(`
    UPDATE truths
    SET converted_claim_count=COALESCE(converted_claim_count,0)+1,
        linked_claim_id=COALESCE(linked_claim_id, ?),
        updated_at=?
    WHERE id=?
  `).bind(claimId, now, truthId).run();

  const claim = await env.DB.prepare(`SELECT * FROM claims WHERE id=?`).bind(claimId).first();

  return json({ ok: true, existing: false, truth: { id: truth.id, statement: truth.statement }, claim, bridge: { truthId, claimId, linkId } });
}

async function insertClaimWithNormalizedKey(env, c) {
  await env.DB.prepare(`
    INSERT INTO claims (
      id,user_id,claim,category,type,status,
      evidence_score,survivability,testability,contradictions,
      created_at,updated_at,review_state,normalized_claim
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(c.claimId, c.userId, c.generatedClaim, c.category, 'Truth-Derived', 'Plausible', 5, 50, 50, 0, c.now, c.now, 'public', c.normalizedClaim).run();
}

async function findExistingClaim(env, truthId, truth) {
  if (truth.linked_claim_id) {
    const linked = await env.DB.prepare(`SELECT *, NULL AS link_id FROM claims WHERE id=?`).bind(truth.linked_claim_id).first();
    if (linked) return linked;
  }

  const linkedByTable = await env.DB.prepare(`
    SELECT c.*, l.id AS link_id
    FROM truth_claim_links l
    JOIN claims c ON c.id=l.claim_id
    WHERE l.truth_id=?
    ORDER BY l.created_at ASC
    LIMIT 1
  `).bind(truthId).first();
  if (linkedByTable) return linkedByTable;

  const cleanClaim = truth.statement;
  const legacyClaim = `${truth.statement} — this statement reflects reality consistently enough to survive evidence and repeatable pressure testing.`;
  const accidentalXClaim = `${truth.statement} — X`;

  const byKey = await env.DB.prepare(`
    SELECT *, NULL AS link_id
    FROM claims
    WHERE normalized_claim=? AND type='Truth-Derived'
    ORDER BY created_at ASC
    LIMIT 1
  `).bind(normalizeClaim(cleanClaim)).first();
  if (byKey) return byKey;

  const sameText = await env.DB.prepare(`
    SELECT *, NULL AS link_id
    FROM claims
    WHERE claim IN (?, ?, ?) AND type='Truth-Derived'
    ORDER BY created_at ASC
    LIMIT 1
  `).bind(cleanClaim, legacyClaim, accidentalXClaim).first();
  if (sameText) return sameText;

  return null;
}

function normalize(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeClaim(v) {
  return normalize(v)
    .replace(/\bthis statement reflects reality consistently enough to survive evidence and repeatable pressure testing\b/g, '')
    .replace(/\bx\b/g, '')
    .replace(/\bclaim\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
