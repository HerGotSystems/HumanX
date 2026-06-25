export async function graphStatus(request, env, helpers) {
  const { json } = helpers;

  // D-168B: reduced to only the six tables the public graphBox() UI displays.
  // Internal inventory (users, rateLimits, duplicateSignatures, etc.) removed
  // from the public response — aggregate counts of internal tables are not
  // product-visible data and should not be unauthenticated signals.
  const tables = [
    ['claims', 'claims'],
    ['evidence', 'evidence'],
    ['truths', 'truths'],
    ['evidence_claim_links', 'evidenceClaimLinks'],
    ['claim_votes', 'claimVotes'],
    ['reports', 'reports'],
  ];

  const counts = {};
  const errors = {};

  for (const [table, key] of tables) {
    try {
      const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first();
      counts[key] = row?.n || 0;
    } catch (err) {
      counts[key] = null;
      errors[key] = String(err && err.message ? err.message : err);
    }
  }

  return json({
    ok: Object.keys(errors).length === 0,
    graph: counts,
    errors,
  });
}
