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

export async function importTruthSeeds(env) {
  const now = Date.now();
  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at, trust_score, is_admin) VALUES (?, ?, ?, ?, ?)`).bind('usr_truth_seed','truth-seed',now,100,1).run();
  const imported = [];
  for (const t of SEED_TRUTHS) {
    const normalized = normalize(t.statement);
    const existing = await env.DB.prepare(`SELECT id, repetition_score FROM truths WHERE normalized_statement=?`).bind(normalized).first();
    if (existing) {
      await env.DB.prepare(`UPDATE truths SET repetition_score=repetition_score+1, updated_at=? WHERE id=?`).bind(now, existing.id).run();
      imported.push({statement:t.statement, repeated:true, id:existing.id});
      continue;
    }
    const id = `tru_seed_${crypto.randomUUID().replaceAll('-','').slice(0,12)}`;
    await env.DB.prepare(`INSERT INTO truths (id,user_id,statement,normalized_statement,category,origin,truth_type,confidence_label,repetition_score,pressure_score,created_at,updated_at,review_state) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,'usr_truth_seed',t.statement,normalized,t.category,t.origin,t.truth_type,t.confidence_label,1,0,now,now,'public').run();
    imported.push({statement:t.statement, repeated:false, id});
  }
  return {ok:true, imported_count: imported.length, imported};
}

function normalize(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
