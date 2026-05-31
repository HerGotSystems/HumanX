export async function graphStatus(request, env, helpers) {
  const { json } = helpers;

  const tables = [
    ['users', 'users'],
    ['claims', 'claims'],
    ['evidence', 'evidence'],
    ['pressure_points', 'pressure'],
    ['home_tests', 'tests'],
    ['truths', 'truths'],
    ['truth_claim_links', 'truthClaimLinks'],
    ['evidence_claim_links', 'evidenceClaimLinks'],
    ['claim_votes', 'claimVotes'],
    ['evidence_votes', 'evidenceVotes'],
    ['truth_votes', 'truthVotes'],
    ['reports', 'reports'],
    ['analysis_results', 'analysisResults'],
    ['belief_snapshots', 'beliefSnapshots'],
    ['aip_packets', 'runpacks'],
    ['rate_limits', 'rateLimits'],
    ['duplicate_signatures', 'duplicateSignatures']
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

  const n = key => Number(counts[key] || 0);

  return json({
    ok: Object.keys(errors).length === 0,
    graph: counts,
    errors,
    summary: {
      claimPressureObjects: n('claims') + n('pressure') + n('tests'),
      evidenceGraphObjects: n('evidence') + n('evidenceClaimLinks') + n('evidenceVotes'),
      beliefTruthObjects: n('truths') + n('truthClaimLinks') + n('truthVotes') + n('beliefSnapshots'),
      reviewObjects: n('reports') + n('claimVotes'),
      analysisObjects: n('analysisResults') + n('runpacks'),
      systemObjects: n('users') + n('rateLimits') + n('duplicateSignatures')
    }
  });
}
