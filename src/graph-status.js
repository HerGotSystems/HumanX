export async function graphStatus(request, env, helpers) {
  const { json } = helpers;

  const tables = [
    ['claims', 'claims'],
    ['evidence', 'evidence'],
    ['pressure_points', 'pressure'],
    ['home_tests', 'tests'],
    ['truths', 'truths'],
    ['truth_claim_links', 'truthClaimLinks'],
    ['evidence_claim_links', 'evidenceClaimLinks'],
    ['claim_votes', 'claimVotes'],
    ['reports', 'reports']
  ];

  const counts = {};

  for (const [table, key] of tables) {
    try {
      const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first();
      counts[key] = row?.n || 0;
    } catch (err) {
      counts[key] = 0;
    }
  }

  return json({
    ok: true,
    graph: counts,
    summary: {
      claimPressureObjects: counts.claims + counts.pressure + counts.tests,
      evidenceGraphObjects: counts.evidence + counts.evidenceClaimLinks,
      beliefTruthObjects: counts.truths + counts.truthClaimLinks,
      publicActivityObjects: counts.claimVotes + counts.reports
    }
  });
}
