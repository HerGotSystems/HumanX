import { HUMANX_SEED } from './seed-data.js';
import { meaningKey } from './meaning-key.js';

// D-59: importSeedData now accepts an options object.
// dryRun (default true): when true, returns a structured report without writing to DB.
// reviewState (default 'review'): review_state to assign to claims and evidence on apply.
// SOURCE_NEEDED guard: apply mode blocks if any evidence source_url is empty or contains
// the placeholder string 'SOURCE_NEEDED'.
export async function importSeedData(env, { dryRun = true, reviewState = 'review' } = {}) {
  const report = {
    ok: true,
    mode: dryRun ? 'dry-run' : 'apply',
    seed_version: HUMANX_SEED.version,
    review_state: reviewState,
    claims: { would_create: 0, would_skip: 0, created: 0, skipped: 0 },
    evidence: { would_create: 0, would_skip: 0, created: 0, skipped: 0, source_needed_blocked: 0 },
    pressure: { would_create: 0, would_skip: 0, created: 0, skipped: 0 },
    tests: { would_create: 0, would_skip: 0, created: 0, skipped: 0 },
    warnings: []
  };

  // SOURCE_NEEDED guard: scan all evidence before any writes.
  if (!dryRun) {
    for (const item of HUMANX_SEED.claims) {
      for (const ev of item.evidence || []) {
        const src = ev.source_url || '';
        if (!src || src.includes('SOURCE_NEEDED')) {
          report.evidence.source_needed_blocked += 1;
        }
      }
    }
    if (report.evidence.source_needed_blocked > 0) {
      return {
        ...report,
        ok: false,
        error: 'SOURCE_NEEDED_BLOCKED',
        message: `Import blocked: ${report.evidence.source_needed_blocked} evidence item(s) have empty or SOURCE_NEEDED source_url. Resolve all placeholders before applying.`
      };
    }
  }

  const now = Date.now();

  if (!dryRun) {
    await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at, trust_score, is_admin) VALUES (?, ?, ?, ?, ?)`)
      .bind('usr_seed_system', 'humanx-seed', now, 100, 1)
      .run();
  }

  for (const item of HUMANX_SEED.claims) {
    const existing = await env.DB.prepare(`SELECT id FROM claims WHERE normalized_claim=?`)
      .bind(normalize(item.claim))
      .first();

    let claimId = existing?.id;

    if (claimId) {
      report.claims.would_skip += 1;
      if (!dryRun) report.claims.skipped += 1;
    } else {
      report.claims.would_create += 1;
      if (!dryRun) {
        claimId = `clm_seed_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
        await env.DB.prepare(`
          INSERT INTO claims (
            id,user_id,claim,normalized_claim,category,type,status,
            evidence_score,survivability,testability,contradictions,
            belief_yes,belief_no,uncertainty,
            created_at,updated_at,review_state
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `)
        .bind(
          claimId,
          'usr_seed_system',
          item.claim,
          normalize(item.claim),
          item.category,
          item.type,
          item.status,
          item.evidence_score,
          item.survivability,
          item.testability,
          item.pressure.length,
          0,
          0,
          0,
          now,
          now,
          reviewState
        )
        .run();
        report.claims.created += 1;
      }
    }

    // Use a stable placeholder claimId for dry-run reporting
    const reportClaimId = claimId || `dry-run-claim-${normalize(item.claim).slice(0, 20)}`;

    for (const ev of item.evidence || []) {
      const sig = normalize(`${item.claim}|${ev.title}|${ev.body}`);
      const dup = await env.DB.prepare(`SELECT id FROM evidence WHERE duplicate_signature=?`)
        .bind(sig)
        .first();

      if (dup) {
        report.evidence.would_skip += 1;
        if (!dryRun) report.evidence.skipped += 1;
      } else {
        report.evidence.would_create += 1;
        if (!dryRun && reportClaimId) {
          await env.DB.prepare(`
            INSERT INTO evidence (
              id,claim_id,user_id,stance,quality,title,body,
              source_url,media_type,reliability_score,
              duplicate_signature,created_at,review_state
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
          `)
          .bind(
            `evd_${crypto.randomUUID().replaceAll('-', '').slice(0, 14)}`,
            reportClaimId,
            'usr_seed_system',
            ev.stance,
            ev.quality,
            ev.title,
            ev.body,
            ev.source_url || '',
            ev.media_type || 'text',
            ev.reliability_score || 20,
            sig,
            now,
            reviewState
          )
          .run();
          report.evidence.created += 1;
        }
      }
    }

    for (const pp of item.pressure || []) {
      // Pressure dedup: skip if title+claim_id already exists
      const ppDup = reportClaimId
        ? await env.DB.prepare(`SELECT id FROM pressure_points WHERE claim_id=? AND title=?`)
            .bind(reportClaimId, pp.title)
            .first()
            .catch(() => null)
        : null;

      if (ppDup) {
        report.pressure.would_skip += 1;
        if (!dryRun) report.pressure.skipped += 1;
      } else {
        report.pressure.would_create += 1;
        if (!dryRun && reportClaimId) {
          await env.DB.prepare(`
            INSERT INTO pressure_points (
              id,claim_id,user_id,title,body,severity,created_at
            ) VALUES (?,?,?,?,?,?,?)
          `)
          .bind(
            `prs_${crypto.randomUUID().replaceAll('-', '').slice(0, 14)}`,
            reportClaimId,
            'usr_seed_system',
            pp.title,
            pp.body,
            pp.severity || 1,
            now
          )
          .run();
          report.pressure.created += 1;
        }
      }
    }

    for (const test of item.tests || []) {
      // Test dedup: skip if title+claim_id already exists
      const testDup = reportClaimId
        ? await env.DB.prepare(`SELECT id FROM home_tests WHERE claim_id=? AND title=?`)
            .bind(reportClaimId, test.title)
            .first()
            .catch(() => null)
        : null;

      if (testDup) {
        report.tests.would_skip += 1;
        if (!dryRun) report.tests.skipped += 1;
      } else {
        report.tests.would_create += 1;
        if (!dryRun && reportClaimId) {
          await env.DB.prepare(`
            INSERT INTO home_tests (
              id,claim_id,user_id,title,instructions,
              safety_level,difficulty,created_at
            ) VALUES (?,?,?,?,?,?,?,?)
          `)
          .bind(
            `tst_${crypto.randomUUID().replaceAll('-', '').slice(0, 14)}`,
            reportClaimId,
            'usr_seed_system',
            test.title,
            test.instructions,
            test.safety_level || 'normal',
            test.difficulty || 'easy',
            now
          )
          .run();
          report.tests.created += 1;
        }
      }
    }
  }

  return report;
}

function normalize(v) {
  return meaningKey(v);
}
