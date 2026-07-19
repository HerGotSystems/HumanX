const VERSION = 'untested-v1';

const COPY = {
  opening_text: 'This does not test what you would actually do. Nobody knows that until it happens — including you. It tests how your prediction of yourself shifts when the situation changes. That shift is real information. It is not proof of anything else.',
  closing_text: 'Context explains a shift in your answer. It does not make either answer right. The situation changed what was possible — not what was owed.',
  confidence_prompt_text: 'How confident are you that this is what you would actually choose?',
  results_intro_text: 'Your answers are compared only within each scenario. There is no consistency score and no verdict about who you are.'
};

const CONFIDENCE = [
  { certainty_value: 0, label_text: 'Not confident', display_order: 0 },
  { certainty_value: 1, label_text: 'Unsure', display_order: 1 },
  { certainty_value: 2, label_text: 'Confident', display_order: 2 }
];

const SCENARIOS = [
  scenario(1, 'loyalty', 'Loyalty',
    variant('mild', 'A close friend asks you to keep something from their partner — nothing dangerous, just private.', [
      choice('loyalty_mild_keep', 'Keep it private and stay out of it.', 'maintain_confidence', 0, 0, 'loyalty-to-friend'),
      choice('loyalty_mild_challenge', "Tell your friend you won't carry the secret and they need to address it themselves.", 'challenge_or_disclose', 1, 1, 'relational-honesty')
    ]),
    variant('pressure', 'The same friend tells you something that could genuinely hurt their partner if it continued, but you only have their side. It is ambiguous whether it counts as wrong, and speaking up might end a relationship over something you are not sure about.', [
      choice('loyalty_pressure_keep', 'Keep the confidence.', 'maintain_confidence', 0, 1, 'loyalty-to-friend'),
      choice('loyalty_pressure_disclose', 'Raise the concern with their partner — knowing your interpretation could be wrong.', 'challenge_or_disclose', 2, 2, 'protection-of-third-party')
    ])),
  scenario(2, 'non-violence', 'Non-violence',
    variant('mild', 'Someone insults you loudly in public.', [
      choice('nonviolence_mild_walk', 'Walk away without replying.', 'disengage', 0, 1, 'de-escalation'),
      choice('nonviolence_mild_answer', 'Answer them verbally.', 'engage', 1, 1, 'self-assertion')
    ]),
    variant('pressure', 'The same person turns on someone else nearby — words only, no weapon, and it is unclear whether anything physical will happen. Stepping in could make it worse and draw the confrontation onto you; staying out risks allowing it to escalate unchecked.', [
      choice('nonviolence_pressure_intervene', 'Intervene verbally.', 'engage', 2, 2, 'protection-of-third-party'),
      choice('nonviolence_pressure_stayout', 'Stay out of it.', 'disengage', 0, 1, 'de-escalation')
    ])),
  scenario(3, 'honesty', 'Honesty',
    variant('mild', 'A colleague asks if you like their work.', [
      choice('honesty_mild_plain', 'Tell them plainly what you think.', 'state_directly', 1, 1, 'candour'),
      choice('honesty_mild_soften', 'Soften your answer.', 'withhold_or_soften', 1, 0, 'care')
    ]),
    variant('pressure', 'Someone asks your honest opinion about a decision they have already committed to and cannot undo. Telling the truth changes nothing about the outcome but might change how they feel about a choice that is already locked in.', [
      choice('honesty_pressure_state', 'Say what you actually think.', 'state_directly', 1, 2, 'candour'),
      choice('honesty_pressure_letgo', 'Let it go since it cannot change anything.', 'withhold_or_soften', 0, 1, 'care')
    ])),
  scenario(4, 'incorruptibility', 'Incorruptibility',
    variant('mild', 'Someone offers you a small advantage you did not earn.', [
      choice('incorruptibility_mild_accept', 'Accept it because the consequence is negligible.', 'accept_advantage', 1, 0, 'pragmatism'),
      choice('incorruptibility_mild_refuse', 'Refuse because the advantage was not fairly available to everyone.', 'refuse_advantage', 0, 1, 'fairness')
    ]),
    variant('pressure', 'Someone offers you access to resources that would materially improve your situation through a workaround unavailable to most people. Wider consequences are uncertain, and no individual victim is identifiable.', [
      choice('incorruptibility_pressure_accept', 'Accept the workaround.', 'accept_advantage', 2, 1, 'pragmatism'),
      choice('incorruptibility_pressure_refuse', 'Refuse because unequal access matters even when its effects cannot be traced.', 'refuse_advantage', 0, 3, 'fairness')
    ])),
  scenario(5, 'courage', 'Courage / self-preservation',
    variant('mild', 'Someone asks you to stand beside them during a confrontation. It costs time, discomfort and some criticism aimed at you, but there is little physical danger.', [
      choice('courage_mild_stay', 'Stay with them.', 'stay', 2, 1, 'solidarity'),
      choice('courage_mild_leave', 'Step away because your presence may not improve anything.', 'step_away', 0, 0, 'self-preservation')
    ]),
    variant('pressure', 'The confrontation now carries real personal risk, and it is unclear whether your presence changes the outcome.', [
      choice('courage_pressure_stay', 'Stay because it still might matter.', 'stay', 3, 3, 'solidarity'),
      choice('courage_pressure_leave', 'Leave because uncertain benefit does not justify serious danger.', 'step_away', 0, 1, 'self-preservation')
    ]))
];

function choice(choice_id, choice_text, action_orientation, involvement_level, personal_cost_accepted, value_prioritized) {
  return { choice_id, choice_text, action_orientation, involvement_level, personal_cost_accepted, value_prioritized };
}
function variant(name, prompt_text, choices) { return { variant: name, prompt_text, choices }; }
function scenario(scenario_id, scenario_key, title, mild, pressure) { return { scenario_id, scenario_key, title, variants: [mild, pressure] }; }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
function id(prefix) { return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`; }
function clean(value, max = 100) { return String(value || '').trim().slice(0, max); }

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
async function sha256(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(stable(value)));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function authoredBundle() {
  return { instrument_version: VERSION, copy: COPY, confidence: CONFIDENCE, scenarios: SCENARIOS };
}

async function loadBundle(db, version = VERSION) {
  const rows = await db.batch([
    db.prepare('SELECT instrument_version,content_hash,draft_revision,sealed_at FROM untested_instrument_versions WHERE instrument_version=?').bind(version),
    db.prepare('SELECT opening_text,closing_text,confidence_prompt_text,results_intro_text FROM untested_instrument_copy WHERE instrument_version=?').bind(version),
    db.prepare('SELECT certainty_value,label_text,display_order FROM untested_confidence_definitions WHERE instrument_version=? ORDER BY certainty_value').bind(version),
    db.prepare('SELECT scenario_id,scenario_key,title FROM untested_scenario_definitions WHERE instrument_version=? ORDER BY scenario_id').bind(version),
    db.prepare("SELECT scenario_id,variant,prompt_text FROM untested_variant_definitions WHERE instrument_version=? ORDER BY scenario_id,CASE variant WHEN 'mild' THEN 0 ELSE 1 END").bind(version),
    db.prepare("SELECT choice_id,scenario_id,variant,choice_text,action_orientation,involvement_level,personal_cost_accepted,value_prioritized FROM untested_choice_definitions WHERE instrument_version=? ORDER BY scenario_id,CASE variant WHEN 'mild' THEN 0 ELSE 1 END,choice_id").bind(version)
  ]);
  const v = rows[0].results?.[0];
  if (!v) return null;
  const copy = rows[1].results?.[0];
  const confidence = rows[2].results || [];
  const variants = rows[4].results || [];
  const choices = rows[5].results || [];
  const scenarios = (rows[3].results || []).map(s => ({
    ...s,
    variants: variants.filter(vr => vr.scenario_id === s.scenario_id).map(vr => ({
      variant: vr.variant,
      prompt_text: vr.prompt_text,
      choices: choices.filter(c => c.scenario_id === s.scenario_id && c.variant === vr.variant).map(({ scenario_id, variant, ...c }) => c)
    }))
  }));
  return { version: v, bundle: { instrument_version: version, copy, confidence, scenarios } };
}

function validateBundle(bundle) {
  if (!bundle.copy || bundle.confidence.length !== 3 || bundle.scenarios.length !== 5) throw new Error('UNTESTED_INVALID_STRUCTURE');
  for (const s of bundle.scenarios) {
    if (s.variants.length !== 2 || s.variants[0].variant !== 'mild' || s.variants[1].variant !== 'pressure') throw new Error('UNTESTED_INVALID_STRUCTURE');
    for (const v of s.variants) if (v.choices.length !== 2) throw new Error('UNTESTED_INVALID_STRUCTURE');
  }
}

async function bootstrap(env) {
  const existing = await env.DB.prepare('SELECT sealed_at FROM untested_instrument_versions WHERE instrument_version=?').bind(VERSION).first();
  if (existing?.sealed_at) return { ok: true, existing: true, instrument_version: VERSION };
  const now = Date.now();
  await env.DB.prepare('INSERT OR IGNORE INTO untested_instrument_versions (instrument_version,created_at) VALUES (?,?)').bind(VERSION, now).run();
  const statements = [
    env.DB.prepare('INSERT OR REPLACE INTO untested_instrument_copy VALUES (?,?,?,?,?)').bind(VERSION, COPY.opening_text, COPY.closing_text, COPY.confidence_prompt_text, COPY.results_intro_text),
    ...CONFIDENCE.map(c => env.DB.prepare('INSERT OR REPLACE INTO untested_confidence_definitions VALUES (?,?,?,?)').bind(VERSION, c.certainty_value, c.label_text, c.display_order))
  ];
  for (const s of SCENARIOS) {
    statements.push(env.DB.prepare('INSERT OR REPLACE INTO untested_scenario_definitions VALUES (?,?,?,?)').bind(VERSION, s.scenario_id, s.scenario_key, s.title));
    for (const v of s.variants) {
      statements.push(env.DB.prepare('INSERT OR REPLACE INTO untested_variant_definitions VALUES (?,?,?,?)').bind(VERSION, s.scenario_id, v.variant, v.prompt_text));
      for (const c of v.choices) statements.push(env.DB.prepare('INSERT OR REPLACE INTO untested_choice_definitions VALUES (?,?,?,?,?,?,?,?,?)').bind(VERSION, c.choice_id, s.scenario_id, v.variant, c.choice_text, c.action_orientation, c.involvement_level, c.personal_cost_accepted, c.value_prioritized));
    }
  }
  await env.DB.batch(statements);
  const snapshot = await loadBundle(env.DB, VERSION);
  validateBundle(snapshot.bundle);
  const hash = await sha256(snapshot.bundle);
  const result = await env.DB.prepare('UPDATE untested_instrument_versions SET content_hash=?,sealed_at=? WHERE instrument_version=? AND sealed_at IS NULL AND draft_revision=?').bind(hash, Date.now(), VERSION, snapshot.version.draft_revision).run();
  if (result.meta?.changes !== 1) throw new Error('UNTESTED_SEAL_CONFLICT');
  return { ok: true, existing: false, instrument_version: VERSION, content_hash: hash };
}

async function createSession(request, env) {
  const body = await request.json().catch(() => ({}));
  const version = clean(body.instrument_version || VERSION, 60);
  const row = await env.DB.prepare('SELECT content_hash,sealed_at FROM untested_instrument_versions WHERE instrument_version=?').bind(version).first();
  if (!row?.sealed_at || !row.content_hash) return json({ error: 'INSTRUMENT_NOT_READY' }, 503);
  const session_id = id('unt');
  await env.DB.prepare('INSERT INTO untested_sessions (session_id,instrument_version,created_at) VALUES (?,?,?)').bind(session_id, version, Date.now()).run();
  return json({ ok: true, session_id, instrument_version: version });
}

async function saveResponse(request, env) {
  const body = await request.json().catch(() => ({}));
  const session_id = clean(body.session_id, 80);
  const scenario_id = Number(body.scenario_id);
  const variantName = clean(body.variant, 20);
  const choice_id = clean(body.choice_id, 100);
  const certainty = Number(body.certainty_stated);
  if (!session_id || !Number.isInteger(scenario_id) || !['mild','pressure'].includes(variantName) || !choice_id || ![0,1,2].includes(certainty)) return json({ error: 'BAD_RESPONSE' }, 400);
  const session = await env.DB.prepare('SELECT instrument_version FROM untested_sessions WHERE session_id=?').bind(session_id).first();
  if (!session) return json({ error: 'SESSION_NOT_FOUND' }, 404);
  try {
    await env.DB.prepare('INSERT INTO untested_responses (session_id,instrument_version,scenario_id,variant,choice_id,certainty_stated,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(session_id,scenario_id,variant) DO UPDATE SET choice_id=excluded.choice_id,certainty_stated=excluded.certainty_stated,created_at=excluded.created_at').bind(session_id, session.instrument_version, scenario_id, variantName, choice_id, certainty, Date.now()).run();
  } catch (error) {
    if (String(error).includes('FOREIGN KEY')) return json({ error: 'CHOICE_MISMATCH' }, 400);
    throw error;
  }
  return json({ ok: true });
}

async function results(request, env) {
  const session_id = clean(new URL(request.url).searchParams.get('session_id'), 80);
  const session = await env.DB.prepare('SELECT instrument_version FROM untested_sessions WHERE session_id=?').bind(session_id).first();
  if (!session) return json({ error: 'SESSION_NOT_FOUND' }, 404);
  const rows = await env.DB.prepare(`SELECT r.scenario_id,r.variant,r.certainty_stated,c.choice_id,c.action_orientation,c.involvement_level,c.personal_cost_accepted,c.value_prioritized,s.title
    FROM untested_responses r JOIN untested_choice_definitions c ON c.instrument_version=r.instrument_version AND c.choice_id=r.choice_id
    JOIN untested_scenario_definitions s ON s.instrument_version=r.instrument_version AND s.scenario_id=r.scenario_id
    WHERE r.session_id=? ORDER BY r.scenario_id,CASE r.variant WHEN 'mild' THEN 0 ELSE 1 END`).bind(session_id).all();
  const grouped = [];
  for (let scenario_id=1; scenario_id<=5; scenario_id++) {
    const pair = (rows.results || []).filter(r => r.scenario_id === scenario_id);
    if (pair.length !== 2) continue;
    const [mild, pressure] = pair;
    grouped.push({ scenario_id, title: mild.title, mild, pressure, movements: {
      action_orientation_changed: mild.action_orientation !== pressure.action_orientation,
      value_changed: mild.value_prioritized !== pressure.value_prioritized,
      involvement_delta: pressure.involvement_level - mild.involvement_level,
      personal_cost_delta: pressure.personal_cost_accepted - mild.personal_cost_accepted,
      confidence_delta: pressure.certainty_stated - mild.certainty_stated
    }});
  }
  return json({ ok: true, session_id, instrument_version: session.instrument_version, scenarios: grouped });
}

export async function handleUntestedRequest(request, env, { isAdmin = false } = {}) {
  const path = new URL(request.url).pathname;
  if (path === '/api/untested/instrument' && request.method === 'GET') {
    const loaded = await loadBundle(env.DB, new URL(request.url).searchParams.get('version') || VERSION);
    if (!loaded?.version?.sealed_at) return json({ error: 'INSTRUMENT_NOT_FOUND' }, 404);
    return json({ ok: true, content_hash: loaded.version.content_hash, ...loaded.bundle });
  }
  if (path === '/api/untested/session' && request.method === 'POST') return createSession(request, env);
  if (path === '/api/untested/response' && request.method === 'POST') return saveResponse(request, env);
  if (path === '/api/untested/results' && request.method === 'GET') return results(request, env);
  if (path === '/api/untested/admin/bootstrap' && request.method === 'POST') {
    if (!isAdmin) return json({ error: 'FORBIDDEN' }, 403);
    return json(await bootstrap(env));
  }
  return json({ error: 'NOT_FOUND' }, 404);
}

export const UNTESTED_TESTING = { authoredBundle, stable, sha256, validateBundle, loadBundle };
