import { meaningKey } from './meaning-key.js';

export async function convertTruthToClaim(request, env, helpers) {
  const { readJson, cleanId, cleanText, json, requireUser, makeId } = helpers;
  const userId = requireUser(request);
  await safeRateLimit(request, env, `truth-claim:${ip(request)}`, 8, 3600000);
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
    const now = Date.now();
    const linkId = await ensureTruthClaimLink(env, helpers, truthId, existing.id, userId, body.bridgeNote || 'Matched existing claim during truth conversion.', now);
    await syncTruthLinkState(env, truthId, existing.id, now);
    return json({ ok: true, existing: true, truth: { id: truth.id, statement: truth.statement }, claim: existing, bridge: { truthId, claimId: existing.id, linkId } });
  }

  const now = Date.now();
  const claimId = makeId('clm');
  const generatedClaim = cleanText(body.claim || truth.statement, 1200);
  const normalizedClaim = normalizeClaim(generatedClaim);

  try {
    await insertClaimWithNormalizedKey(env, {
      claimId,
      userId,
      generatedClaim,
      category: truth.category || 'truth-derived',
      now,
      normalizedClaim
    });
  } catch (err) {
    if (!isUniqueConstraintError(err)) throw err;
    const raced = await findExistingClaimByNormalizedKey(env, normalizedClaim);
    if (!raced) throw err;
    const linkId = await ensureTruthClaimLink(env, helpers, truthId, raced.id, userId, body.bridgeNote || 'Matched raced claim during truth conversion.', now);
    await syncTruthLinkState(env, truthId, raced.id, now);
    return json({ ok: true, existing: true, raced: true, truth: { id: truth.id, statement: truth.statement }, claim: raced, bridge: { truthId, claimId: raced.id, linkId } });
  }

  let linkId;
  try {
    linkId = await ensureTruthClaimLink(env, helpers, truthId, claimId, userId, body.bridgeNote || 'Converted from repeated truth statement into pressure-testable claim.', now);
    await syncTruthLinkState(env, truthId, claimId, now);
  } catch (linkErr) {
    await env.DB.prepare(`DELETE FROM claims WHERE id=?`).bind(claimId).run().catch(() => {});
    return json({ error: 'TRUTH_LINK_FAILED', message: String(linkErr && linkErr.message ? linkErr.message : linkErr) }, 500);
  }

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
  `).bind(c.claimId, c.userId, c.generatedClaim, c.category, 'Truth-Derived', 'Plausible', 5, 50, 50, 0, c.now, c.now, 'review', c.normalizedClaim).run();
}

async function ensureTruthClaimLink(env, helpers, truthId, claimId, userId, note, now) {
  const { cleanText, makeId } = helpers;
  const existing = await env.DB.prepare(`SELECT id FROM truth_claim_links WHERE truth_id=? AND claim_id=? LIMIT 1`).bind(truthId, claimId).first();
  if (existing?.id) return existing.id;

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
    cleanText(note, 400),
    now
  ).run();

  const row = await env.DB.prepare(`SELECT id FROM truth_claim_links WHERE truth_id=? AND claim_id=? LIMIT 1`).bind(truthId, claimId).first();
  return row?.id || linkId;
}

async function syncTruthLinkState(env, truthId, claimId, now) {
  const countRow = await env.DB.prepare(`SELECT COUNT(*) AS n FROM truth_claim_links WHERE truth_id=?`).bind(truthId).first();
  await env.DB.prepare(`
    UPDATE truths
    SET converted_claim_count=?,
        linked_claim_id=COALESCE(linked_claim_id, ?),
        updated_at=?
    WHERE id=?
  `).bind(countRow?.n || 0, claimId, now, truthId).run();
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

async function findExistingClaimByNormalizedKey(env, normalizedClaim) {
  return await env.DB.prepare(`SELECT *, NULL AS link_id FROM claims WHERE normalized_claim=? ORDER BY created_at ASC LIMIT 1`).bind(normalizedClaim).first();
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

function isUniqueConstraintError(err) {
  const message = String(err && err.message ? err.message : err).toLowerCase();
  if (message.includes('foreign key')) return false;
  return message.includes('unique') || message.includes('constraint failed');
}

function normalizeClaim(v) {
  return meaningKey(v);
}
