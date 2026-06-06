const SEED_TRUTHS = [
  {statement:'Money is evil',category:'culture',origin:'common saying',truth_type:'common',confidence_label:'claimed'},
  {statement:'Hard work always pays off',category:'culture',origin:'family / school',truth_type:'cultural',confidence_label:'claimed'},
  {statement:'Everything happens for a reason',category:'belief',origin:'religion / self-help',truth_type:'religious',confidence_label:'claimed'},
  {statement:'Trust the experts',category:'institution',origin:'media / government',truth_type:'institutional',confidence_label:'claimed'},
  {statement:'Never trust the experts',category:'institution',origin:'counterculture / internet',truth_type:'common',confidence_label:'claimed'},
  {statement:'The customer is always right',category:'business',origin:'commerce',truth_type:'common',confidence_label:'claimed'},
  {statement:'Children should always obey adults',category:'family',origin:'family / school',truth_type:'family',confidence_label:'claimed'},
  {statement:'Science has proven it',category:'science',origin:'public debate',truth_type:'scientific',confidence_label:'claimed'},
  {statement:'My religion is the only true path',category:'religion',origin:'religious doctrine',truth_type:'religious',confidence_label:'claimed'},
  {statement:'People are basically good',category:'human nature',origin:'philosophy / culture',truth_type:'common',confidence_label:'claimed'},
  {statement:'People are stupid',category:'human nature',origin:'cynicism / internet',truth_type:'common',confidence_label:'claimed'},
  {statement:'You can be anything you want',category:'identity',origin:'school / self-help',truth_type:'cultural',confidence_label:'claimed'}
];

// D-59: importTruthSeeds now accepts an options object.
// dryRun (default true): when true, returns a structured report without writing to DB.
// reviewState (default 'review'): review_state assigned to new truths on apply.
export async function importTruthSeeds(env, { dryRun = true, reviewState = 'review' } = {}) {
  const report = {
    ok: true,
    mode: dryRun ? 'dry-run' : 'apply',
    review_state: reviewState,
    truths: { would_create: 0, would_skip: 0, would_increment: 0, created: 0, skipped: 0, incremented: 0 },
    warnings: []
  };

  const now = Date.now();

  if (!dryRun) {
    await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at, trust_score, is_admin) VALUES (?, ?, ?, ?, ?)`).bind('usr_truth_seed','truth-seed',now,100,1).run();
  }

  for (const t of SEED_TRUTHS) {
    const normalized = normalize(t.statement);
    const existing = await env.DB.prepare(`SELECT id, repetition_score FROM truths WHERE normalized_statement=?`).bind(normalized).first();
    if (existing) {
      report.truths.would_skip += 1;
      report.truths.would_increment += 1;
      if (!dryRun) {
        await env.DB.prepare(`UPDATE truths SET repetition_score=repetition_score+1, updated_at=? WHERE id=?`).bind(now, existing.id).run();
        report.truths.skipped += 1;
        report.truths.incremented += 1;
      }
      continue;
    }
    report.truths.would_create += 1;
    if (!dryRun) {
      const id = `tru_seed_${crypto.randomUUID().replaceAll('-','').slice(0,12)}`;
      await env.DB.prepare(`INSERT INTO truths (id,user_id,statement,normalized_statement,category,origin,truth_type,confidence_label,repetition_score,pressure_score,created_at,updated_at,review_state) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,'usr_truth_seed',t.statement,normalized,t.category,t.origin,t.truth_type,t.confidence_label,1,0,now,now,reviewState).run();
      report.truths.created += 1;
    }
  }

  return report;
}

function normalize(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
