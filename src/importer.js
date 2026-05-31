import { HUMANX_SEED } from './seed-data.js';
import { meaningKey } from './meaning-key.js';

export async function importSeedData(env) {
  const now = Date.now();

  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at, trust_score, is_admin) VALUES (?, ?, ?, ?, ?)`)
    .bind('usr_seed_system', 'humanx-seed', now, 100, 1)
    .run();

  const imported = [];

  for (const item of HUMANX_SEED.claims) {
    const existing = await env.DB.prepare(`SELECT id FROM claims WHERE normalized_claim=?`)
      .bind(normalize(item.claim))
      .first();

    let claimId = existing?.id;

    if (!claimId) {
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
        'public'
      )
      .run();
    }

    for (const ev of item.evidence || []) {
      const sig = normalize(`${item.claim}|${ev.title}|${ev.body}`);

      const dup = await env.DB.prepare(`SELECT id FROM evidence WHERE duplicate_signature=?`)
        .bind(sig)
        .first();

      if (!dup) {
        await env.DB.prepare(`
          INSERT INTO evidence (
            id,claim_id,user_id,stance,quality,title,body,
            source_url,media_type,reliability_score,
            duplicate_signature,created_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        `)
        .bind(
          `evd_${crypto.randomUUID().replaceAll('-', '').slice(0, 14)}`,
          claimId,
          'usr_seed_system',
          ev.stance,
          ev.quality,
          ev.title,
          ev.body,
          ev.source_url || '',
          ev.media_type || 'text',
          ev.reliability_score || 20,
          sig,
          now
        )
        .run();
      }
    }

    for (const pp of item.pressure || []) {
      await env.DB.prepare(`
        INSERT INTO pressure_points (
          id,claim_id,user_id,title,body,severity,created_at
        ) VALUES (?,?,?,?,?,?,?)
      `)
      .bind(
        `prs_${crypto.randomUUID().replaceAll('-', '').slice(0, 14)}`,
        claimId,
        'usr_seed_system',
        pp.title,
        pp.body,
        pp.severity || 1,
        now
      )
      .run();
    }

    for (const test of item.tests || []) {
      await env.DB.prepare(`
        INSERT INTO home_tests (
          id,claim_id,user_id,title,instructions,
          safety_level,difficulty,created_at
        ) VALUES (?,?,?,?,?,?,?,?)
      `)
      .bind(
        `tst_${crypto.randomUUID().replaceAll('-', '').slice(0, 14)}`,
        claimId,
        'usr_seed_system',
        test.title,
        test.instructions,
        test.safety_level || 'normal',
        test.difficulty || 'easy',
        now
      )
      .run();
    }

    imported.push({
      claim: item.claim,
      claim_id: claimId,
      evidence: item.evidence.length,
      pressure: item.pressure.length,
      tests: item.tests.length
    });
  }

  return {
    ok: true,
    imported_count: imported.length,
    imported
  };
}

function normalize(v) {
  return meaningKey(v);
}
