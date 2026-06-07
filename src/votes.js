export async function voteClaim(request, env, helpers) {
  const { readJson, cleanId, json, requireUser, makeId } = helpers;
  const userId = await requireUser(request);
  await safeRateLimit(request, env, `vote:${userId}:${ip(request)}`, 120, 3600000);
  const body = await readJson(request);
  const claimId = cleanId(body.claimId);
  const vote = cleanVote(body.vote);

  if (!claimId) return json({ error: 'BAD_CLAIM_ID' }, 400);
  if (!vote) return json({ error: 'BAD_VOTE' }, 400);

  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`)
    .bind(userId, `anon-${userId.slice(-6)}`, Date.now())
    .run();

  const now = Date.now();
  const existing = await env.DB.prepare(`SELECT id FROM claim_votes WHERE claim_id=? AND user_id=?`)
    .bind(claimId, userId)
    .first();

  if (existing) {
    await env.DB.prepare(`UPDATE claim_votes SET vote=?, updated_at=? WHERE id=?`)
      .bind(vote, now, existing.id)
      .run();
  } else {
    await env.DB.prepare(`INSERT INTO claim_votes (id,claim_id,user_id,vote,created_at,updated_at) VALUES (?,?,?,?,?,?)`)
      .bind(makeId('vot'), claimId, userId, vote, now, now)
      .run();
  }

  await refreshClaimVoteCounts(env, claimId);

  const claim = await env.DB.prepare(`SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE c.id=?`)
    .bind(claimId)
    .first();

  return json({ ok: true, claim: mapClaimLocal(claim) });
}

export async function refreshClaimVoteCounts(env, claimId) {
  const rows = await env.DB.prepare(`SELECT vote, COUNT(*) AS n FROM claim_votes WHERE claim_id=? GROUP BY vote`)
    .bind(claimId)
    .all();

  let yes = 0, no = 0, unsure = 0;
  for (const row of rows.results || []) {
    if (row.vote === 'believe') yes = row.n;
    if (row.vote === 'reject') no = row.n;
    if (row.vote === 'unsure') unsure = row.n;
  }

  await env.DB.prepare(`UPDATE claims SET belief_yes=?, belief_no=?, uncertainty=?, updated_at=? WHERE id=?`)
    .bind(yes, no, unsure, Date.now(), claimId)
    .run();
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

function cleanVote(v) {
  const x = String(v || '').toLowerCase().trim();
  if (x === 'uncertain') return 'unsure';
  if (['believe','reject','unsure'].includes(x)) return x;
  return '';
}

function mapClaimLocal(c) {
  if (!c) return null;
  return {
    id: c.id,
    claim: c.claim,
    category: c.category,
    type: c.type,
    status: c.status,
    evidenceScore: c.evidence_score,
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
