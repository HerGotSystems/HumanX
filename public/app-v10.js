const API = '';
const LS_USER = 'humanx_public_user_v1';

let claims = [];
let evidenceVault = [];
let truths = [];
let beliefSnapshots = [];
let graphStatus = null;
let selected = null;
let mode = 'home';
let lastPacket = '';
let live = false;
let user = null;
let lastBeliefSnapshot = null;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

function toast(t) {
  const e = document.createElement('div');
  e.className = 'toast';
  e.textContent = t;
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 1800);
}

function headers() {
  return {
    'content-type': 'application/json',
    'x-humanx-user': user?.id || ''
  };
}

async function api(path, opts = {}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { ...headers(), ...(opts.headers || {}) }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

function localUser() {
  let u = JSON.parse(localStorage.getItem(LS_USER) || 'null');
  if (!u) {
    u = {
      id: 'usr_' + crypto.randomUUID().replaceAll('-', '').slice(0, 18),
      handle: 'anon-' + Math.random().toString(36).slice(2, 8)
    };
    localStorage.setItem(LS_USER, JSON.stringify(u));
  }
  return u;
}

function sourceLink(url) {
  if (!url) return '';
  const safe = esc(url);
  return `<p class="small source"><a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a></p>`;
}

function cleanStance(v) {
  v = String(v || 'support').toLowerCase().trim();
  return v === 'pressure' ? 'pressure' : 'support';
}

function parseAnalysis(text) {
  try {
    const o = JSON.parse(String(text || ''));
    if (o && typeof o === 'object' && (o.verdict || o.strongest_support || o.strongest_pressure || o.missing_tests)) return o;
  } catch {}
  return null;
}

function shortText(s, n = 420) {
  s = String(s || '').trim();
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function listBits(arr) {
  return Array.isArray(arr) ? `<ul>${arr.slice(0, 4).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
}

async function boot() {
  user = localUser();
  document.getElementById('who').textContent = user.handle;
  try {
    const h = await api('/api/health');
    live = h.mode === 'd1-live';
    setStatus(live ? 'D1 live' : 'Demo fallback', live);
    try {
      const s = await api('/api/session', { method: 'POST', body: JSON.stringify(user) });
      if (s.user) {
        user = { ...user, ...s.user };
        document.getElementById('who').textContent = user.handle;
        localStorage.setItem(LS_USER, JSON.stringify(user));
      }
    } catch {}
    await Promise.all([loadGraphStatus(), loadClaims(false)]);
    render();
  } catch (e) {
    setStatus('Backend unreachable', false, true);
    renderError(e);
  }
}

function setStatus(t, ok, bad = false) {
  document.getElementById('status').textContent = t;
  const d = document.getElementById('dot');
  d.className = 'dot ' + (bad ? 'bad' : ok ? 'live' : '');
}

async function loadGraphStatus() {
  try { graphStatus = await api('/api/graph-status'); } catch { graphStatus = null; }
}

function q() {
  return encodeURIComponent(document.getElementById('search')?.value || '');
}

async function loadClaims(doRender = true) {
  try {
    const f = encodeURIComponent(document.getElementById('filter')?.value || 'all');
    const data = await api(`/api/claims?q=${q()}&status=${f}`);
    claims = data.claims || [];
    if (data.warning) setStatus(data.warning, false);
    if (doRender) render();
  } catch (e) { renderError(e); }
}

async function loadEvidenceVault() {
  const data = await api(`/api/evidence-vault?q=${q()}`);
  evidenceVault = data.evidence || [];
}

async function loadTruths() {
  const data = await api(`/api/truths?q=${q()}`);
  truths = data.truths || [];
}

async function loadBeliefSnapshots() {
  const data = await api('/api/belief-snapshots?limit=30');
  beliefSnapshots = data.snapshots || [];
}

async function searchCurrent() {
  if (mode === 'vault') return renderVault();
  if (mode === 'truths') return renderTruths();
  if (mode === 'belief') return renderBelief();
  if (mode === 'drift') return renderDrift();
  if (mode === 'home') return renderHome();
  await loadClaims(true);
}

function setMode(m) {
  mode = m;
  if (m !== 'export') selected = null;
  document.body.classList.remove('study-mode');
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.getElementById('tab-' + m)?.classList.add('active');
  render();
}

function cls(s) {
  if (s === 'Proven' || String(s).includes('Supported') || String(s).includes('rising')) return 'b-green';
  if (String(s).includes('Disproven') || String(s).includes('Collapse') || String(s).includes('falling')) return 'b-red';
  if (s === 'Plausible') return 'b-blue';
  return 'b-yellow';
}

function meter(n, v) {
  v = Math.max(0, Math.min(100, Number(v || 0)));
  return `<div class="meter"><span>${n}</span><div class="bar"><div class="fill" style="width:${v}%"></div></div></div>`;
}

function deltaMeter(n, v) {
  const sign = v > 0 ? '+' : '';
  return `<div class="meter"><span>${n} ${sign}${esc(v)}</span><div class="bar"><div class="fill" style="width:${Math.min(100, Math.abs(Number(v || 0)))}%"></div></div></div>`;
}

function graphBox() {
  const g = graphStatus?.graph || {};
  const items = [['Claims', g.claims], ['Evidence', g.evidence], ['Truths', g.truths], ['Links', g.evidenceClaimLinks], ['Votes', g.claimVotes], ['Reports', g.reports]];
  return `<div class="graph-status">${items.map(([k, v]) => `<span><b>${v || 0}</b><small>${k}</small></span>`).join('')}</div>`;
}

function helperText() {
  if (mode === 'drift') return '<p class="small">Drift shows how your recorded belief states move over time. It compares oldest and newest saved records.</p>';
  if (mode === 'belief') return '<p class="small">Belief Mirror: record belief structure, source, identity load, inheritance, pressure, and what could change your mind.</p>';
  if (mode === 'home') return '<p class="small">HumanX separates belief, repeated truth, public claims and reusable evidence.</p>' + graphBox();
  if (mode === 'vault') return '<p class="small">Evidence Vault: attach one evidence object to many claims as support or pressure.</p>' + graphBox();
  if (mode === 'truths') return '<p class="small">Truths: repeated certainties, slogans and doctrines. Convert useful ones into pressure-testable claims.</p>' + graphBox();
  if (mode === 'export') return selected ? `<p class="small">Selected for AIP:<br><b>${esc(selected.claim)}</b></p>` : '<p class="small">No selected claim. Open a claim first, then generate an AIP packet.</p>';
  if (mode === 'submit') return '<p class="small">Submit one clear claim. Add evidence later in study mode.</p>';
  return '<p class="small">Claims: browse, open Study Claim, inspect evidence, pressure, tests, votes and AIP.</p>' + graphBox();
}

function render() {
  if (mode === 'home') return renderHome();
  if (mode === 'belief') return renderBelief();
  if (mode === 'drift') return renderDrift();
  if (mode === 'submit') return renderSubmit();
  if (mode === 'vault') return renderVault();
  if (mode === 'truths') return renderTruths();
  if (mode === 'export') return renderExport();
  renderArena();
}

function renderHome() {
  document.body.classList.remove('study-mode');
  document.getElementById('casefile').innerHTML = helperText();
  document.getElementById('side-tools').style.display = 'none';
  document.getElementById('main').innerHTML = `<div class="home-grid"><section class="home-hero"><span class="badge b-green">working system</span><h1>HumanX</h1><p>Map belief. Capture repeated truth. Pressure-test claims. Reuse evidence. Separate human confidence from proof.</p>${graphBox()}</section><button class="home-tile" onclick="setMode('belief')"><b>Belief Engine</b><span>Personal mirror, identity load, contradiction pressure and drift snapshots.</span></button><button class="home-tile" onclick="setMode('drift')"><b>Drift</b><span>See what changed in your belief records over time.</span></button><button class="home-tile" onclick="setMode('truths')"><b>Truths</b><span>Repeated certainties, slogans, doctrines and inherited statements.</span></button><button class="home-tile" onclick="setMode('arena')"><b>Claim Engine</b><span>Defend, attack and test public claims with evidence.</span></button><button class="home-tile" onclick="setMode('vault')"><b>Evidence Vault</b><span>Reusable documents, videos, datasets, tests and sources.</span></button></div>`;
}

async function renderBelief() {
  document.body.classList.remove('study-mode');
  document.getElementById('casefile').innerHTML = helperText();
  document.getElementById('side-tools').style.display = 'none';
  document.getElementById('main').innerHTML = '<div class="panel"><h2>Loading Belief Mirror…</h2></div>';
  try { await loadBeliefSnapshots(); } catch (e) { beliefSnapshots = []; }

  document.getElementById('main').innerHTML = `
    <div class="section-head"><h2>Belief Mirror</h2><span class="badge b-blue">personal · pseudonymous</span></div>
    <div class="panel form-panel">
      <p class="small">Write one belief as honestly as possible. HumanX records structure, not moral judgement.</p>
      <div class="claimbox">
        <input id="bStatement" placeholder="I believe that...">
        <select id="bSource">
          <option value="self">Source: my own experience</option>
          <option value="family">Source: family / upbringing</option>
          <option value="culture">Source: culture / community</option>
          <option value="religion">Source: religion / doctrine</option>
          <option value="education">Source: education / experts</option>
          <option value="media">Source: media / internet</option>
          <option value="unknown">Source: not sure</option>
        </select>
        <select id="bStructure" onchange="beliefPreview()">
          <option value="chosen">Chosen / examined</option>
          <option value="inherited">Inherited / absorbed</option>
          <option value="pain-shaped">Pain-shaped</option>
          <option value="tribal">Tribal / group-loaded</option>
          <option value="evidence-based">Evidence-based</option>
          <option value="identity-fused">Identity-fused</option>
        </select>
        <label class="small">Confidence <input id="bConfidence" type="range" min="0" max="100" value="70" oninput="beliefPreview()"></label>
        <label class="small">Identity fusion <input id="bIdentity" type="range" min="0" max="100" value="50" oninput="beliefPreview()"></label>
        <label class="small">Evidence strength <input id="bEvidence" type="range" min="0" max="100" value="30" oninput="beliefPreview()"></label>
        <label class="small">Contradiction pressure <input id="bPressure" type="range" min="0" max="100" value="30" oninput="beliefPreview()"></label>
        <label class="small">Inheritance load <input id="bInheritance" type="range" min="0" max="100" value="40" oninput="beliefPreview()"></label>
        <label class="small">Pain load <input id="bPain" type="range" min="0" max="100" value="20" oninput="beliefPreview()"></label>
        <label class="small">Tribal load <input id="bTribal" type="range" min="0" max="100" value="20" oninput="beliefPreview()"></label>
        <label class="small">Testability <input id="bTestability" type="range" min="0" max="100" value="50" oninput="beliefPreview()"></label>
        <textarea id="bNotes" placeholder="Why do you believe it? Where did it come from?"></textarea>
        <textarea id="bChange" placeholder="What evidence, experience, or pressure would change your mind?"></textarea>
        <div class="actions"><button class="primary" onclick="saveBeliefMirror()">Save Belief Record</button><button onclick="beliefPreview()">Preview</button></div>
      </div>
      <div id="beliefResult" class="output">Move sliders or save a record to see the mirror.</div>
    </div>
    <div class="section-head"><h2>Belief Record History</h2><span class="badge">${beliefSnapshots.length} saved</span></div>
    <div class="grid">${beliefSnapshots.map(beliefSnapshotCard).join('') || '<div class="panel">No belief records yet.</div>'}</div>`;
  beliefPreview();
}

async function renderDrift() {
  document.body.classList.remove('study-mode');
  document.getElementById('casefile').innerHTML = helperText();
  document.getElementById('side-tools').style.display = 'none';
  document.getElementById('main').innerHTML = '<div class="panel"><h2>Loading Drift…</h2></div>';
  try { await loadBeliefSnapshots(); } catch (e) { beliefSnapshots = []; }
  const ordered = [...beliefSnapshots].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  if (ordered.length < 2) {
    document.getElementById('main').innerHTML = `<div class="section-head"><h2>Drift</h2><span class="badge b-yellow">needs 2+ records</span></div><div class="panel"><p class="small">Save at least two Belief records to compare movement over time.</p><button class="primary" onclick="setMode('belief')">Create Belief Record</button></div><div class="grid">${beliefSnapshots.map(beliefSnapshotCard).join('')}</div>`;
    return;
  }
  const first = ordered[0], last = ordered[ordered.length - 1];
  const ds = (last.stabilityScore || 0) - (first.stabilityScore || 0);
  const doo = (last.opennessScore || 0) - (first.opennessScore || 0);
  const dp = (last.pressureScore || 0) - (first.pressureScore || 0);
  const dc = (last.contradictionCount || 0) - (first.contradictionCount || 0);
  const verdict = dp > 20 ? 'pressure rising' : ds > 20 ? 'stability rising' : doo > 20 ? 'openness rising' : ds < -20 ? 'stability falling' : 'mixed / stable drift';
  document.getElementById('main').innerHTML = `<div class="section-head"><h2>Drift</h2><span class="badge ${cls(verdict)}">${esc(verdict)}</span></div><div class="panel analysis-card"><h3>Oldest → Newest</h3><p class="small"><b>From:</b> ${esc(first.label || 'record')}<br><b>To:</b> ${esc(last.label || 'record')}</p><div class="meters">${deltaMeter('Stability', ds)}${deltaMeter('Openness', doo)}${deltaMeter('Pressure', dp)}${deltaMeter('Contradictions', dc)}</div><p class="small">${driftText(ds, doo, dp, dc)}</p></div><div class="study-grid"><section class="panel"><h3>Oldest record</h3>${beliefSnapshotMini(first)}</section><section class="panel"><h3>Newest record</h3>${beliefSnapshotMini(last)}</section></div><div class="section-head"><h2>Timeline</h2><span class="badge">${ordered.length} records</span></div><div class="grid">${ordered.map(beliefSnapshotCard).join('')}</div>`;
}

function driftText(ds, doo, dp, dc) {
  const bits = [];
  if (ds > 10) bits.push('belief stability increased');
  if (ds < -10) bits.push('belief stability weakened');
  if (doo > 10) bits.push('openness increased');
  if (doo < -10) bits.push('openness narrowed');
  if (dp > 10) bits.push('pressure increased');
  if (dp < -10) bits.push('pressure reduced');
  if (dc > 0) bits.push('more contradictions were detected');
  if (dc < 0) bits.push('fewer contradictions were detected');
  return bits.length ? bits.join('; ') + '.' : 'No major movement detected yet.';
}

function beliefSnapshotMini(s) {
  return `<span class="badge b-yellow">${esc(s.dominantPattern || s.source || 'belief')}</span><h3>${esc(s.label || 'Belief record')}</h3><p class="small">${esc(new Date(s.createdAt || Date.now()).toLocaleString())}</p><div class="meters">${meter('Stability', s.stabilityScore)}${meter('Open', s.opennessScore)}${meter('Pressure', s.pressureScore)}</div><p class="small">${esc(shortText(s.summary || '', 300))}</p>`;
}

function beliefSnapshotCard(s) {
  return `<article class="card"><span class="badge b-yellow">${esc(s.dominantPattern || s.source || 'belief')}</span><h3>${esc(s.label || 'Belief record')}</h3><p class="small">${esc(new Date(s.createdAt || Date.now()).toLocaleString())}</p><div class="meters">${meter('Stability', s.stabilityScore)}${meter('Open', s.opennessScore)}${meter('Pressure', s.pressureScore)}</div><p class="small">${esc(shortText(s.summary || '', 260))}</p><div class="actions"><button onclick="promoteBelief('${esc(s.id)}','truth')">Promote → Truth</button><button class="primary" onclick="promoteBelief('${esc(s.id)}','claim')">Promote → Claim</button></div></article>`;
}

function n(id) { return Number(document.getElementById(id)?.value || 0); }
function v(id) { return document.getElementById(id)?.value || ''; }

function buildBeliefSnapshot() {
  const statement = v('bStatement');
  const source = v('bSource') || 'unknown';
  const structure = v('bStructure') || 'chosen';
  const confidence = n('bConfidence');
  const identity = n('bIdentity');
  const evidence = n('bEvidence');
  const pressure = n('bPressure');
  const inheritance = n('bInheritance');
  const pain = n('bPain');
  const tribal = n('bTribal');
  const testability = n('bTestability');
  const notes = v('bNotes');
  const change = v('bChange');

  const structureBoost = structure === 'evidence-based' ? 18 : structure === 'identity-fused' ? -12 : structure === 'pain-shaped' ? -10 : structure === 'inherited' ? -5 : 0;
  const stability = Math.max(0, Math.min(100, Math.round((confidence + evidence + identity * 0.25 + testability * 0.15 + structureBoost - pressure * 0.65 - pain * 0.2) / 1.45)));
  const openness = Math.max(0, Math.min(100, Math.round(100 - identity * 0.35 - tribal * 0.25 - inheritance * 0.15 + pressure * 0.25 + testability * 0.2 - evidence * 0.1)));
  const contradiction = Math.max(0, Math.min(100, Math.round(pressure + (confidence - evidence) * 0.35 + identity * 0.2 + tribal * 0.15)));
  const risk = Math.max(0, Math.min(100, Math.round(identity * 0.3 + pain * 0.25 + tribal * 0.25 + inheritance * 0.15 - evidence * 0.2)));

  const pattern = classifyBelief(structure, identity, evidence, pressure, inheritance, pain, tribal, testability);
  const summary = `${statement || 'Unnamed belief'} — ${pattern}. Confidence ${confidence}/100, evidence ${evidence}/100, identity ${identity}/100, inheritance ${inheritance}/100, pain ${pain}/100, tribal ${tribal}/100, testability ${testability}/100, contradiction pressure ${pressure}/100.`;

  return {
    label: statement || 'Belief record',
    engineVersion: 'humanx-belief-v2',
    source: 'humanx-belief-mirror',
    dominantPattern: pattern,
    summary,
    beliefCount: 1,
    contradictionCount: contradiction > 55 ? 1 : 0,
    stabilityScore: stability,
    opennessScore: openness,
    pressureScore: pressure,
    dimensions: { confidence, identityLoad: identity, evidenceStrength: evidence, contradictionPressure: pressure, inheritanceLoad: inheritance, painLoad: pain, tribalLoad: tribal, testability, openness, stability, risk },
    topBeliefs: [{ statement, source, structure, confidence, identityLoad: identity, evidenceStrength: evidence, inheritanceLoad: inheritance, painLoad: pain, tribalLoad: tribal, testability }],
    contradictions: contradiction > 55 ? [`High contradiction load: belief confidence, identity, or tribal/pain pressure may exceed evidence strength.`] : [],
    stressPoints: [notes || 'No origin note entered.', change || 'No change condition entered.'],
    raw: { statement, source, structure, confidence, identity, evidence, pressure, inheritance, pain, tribal, testability, notes, change, pattern, risk, createdAt: Date.now() }
  };
}

function classifyBelief(structure, identity, evidence, pressure, inheritance, pain, tribal, testability) {
  if (structure === 'evidence-based' && evidence > 65 && testability > 55) return 'evidence-backed belief';
  if (identity > 72 && evidence < 45) return 'identity-protected belief';
  if (pain > 65) return 'pain-shaped belief';
  if (tribal > 65) return 'tribal-loaded belief';
  if (inheritance > 70 && evidence < 50) return 'inherited belief';
  if (pressure > 65) return 'belief under pressure';
  if (confidence > 75 && evidence < 35) return 'high-confidence weak-evidence belief';
  if (testability < 20) return 'low-testability belief';
  return 'open belief';
}

function beliefPreview() {
  const s = buildBeliefSnapshot();
  lastBeliefSnapshot = s;
  const out = document.getElementById('beliefResult');
  if (out) out.innerHTML = `<div class="analysis-card"><span class="badge ${cls(s.dominantPattern)}">${esc(s.dominantPattern)}</span><div class="meters">${meter('Stability', s.stabilityScore)}${meter('Open', s.opennessScore)}${meter('Pressure', s.pressureScore)}${meter('Risk', s.dimensions.risk)}</div><p class="small">${esc(s.summary)}</p>${s.contradictions.length ? `<p class="small"><b>Pressure note:</b> ${esc(s.contradictions[0])}</p>` : ''}</div>`;
}

async function saveBeliefMirror() {
  const s = buildBeliefSnapshot();
  if (!String(s.raw.statement || '').trim()) return toast('Write a belief first');
  try {
    await api('/api/belief-snapshots', { method: 'POST', body: JSON.stringify({ snapshot: s, label: s.label, source: s.source, engineVersion: s.engineVersion }) });
    toast('Belief record saved');
    await renderBelief();
  } catch (e) { toast(e.message || 'Could not save belief record'); }
}

async function promoteBelief(snapshotId, target) {
  try {
    const data = await api('/api/belief-promote', { method: 'POST', body: JSON.stringify({ snapshotId, target }) });
    if (target === 'truth') {
      toast(data.existing ? 'Truth reinforced' : 'Truth created');
      mode = 'truths';
      await loadGraphStatus();
      await renderTruths();
      return;
    }
    if (data.claimId) {
      toast(data.existing ? 'Existing claim opened' : 'Claim created');
      mode = 'arena';
      await loadGraphStatus();
      await loadClaims(false);
      await selectClaim(data.claimId);
      return;
    }
    toast('Belief promoted');
  } catch (e) { toast(e.message || 'Could not promote belief'); }
}

function renderArena(){document.body.classList.remove('study-mode');document.getElementById('casefile').innerHTML=helperText();document.getElementById('side-tools').style.display='none';document.getElementById('main').innerHTML=`<div class="section-head"><h2>Claims</h2>${graphBox()}</div><div class="grid">${claims.map(c=>card(c,true)).join('')||'<div class="panel">No claims found.</div>'}</div>`}
function card(c,actions=false){return`<article class="card"><span class="badge ${cls(c.status)}">${esc(c.status)}</span><h3>${esc(c.claim)}</h3><p class="small">${esc(c.category)} · ${esc(c.type)} · by ${esc(c.handle||'anon')}</p><div class="meters">${meter('Evidence',c.evidenceScore)}${meter('Test',c.testability)}${meter('Survive',c.survivability)}</div><p class="small"><b>${esc(c.contradictions||0)}</b> pressure · belief ${esc(c.beliefYes||0)} / reject ${esc(c.beliefNo||0)} / unsure ${esc(c.uncertainty||0)}</p>${actions?`<div class="actions"><button class="primary" onclick="selectClaim('${esc(c.id)}')">Study</button></div>`:''}</article>`}
function renderSubmit(){document.body.classList.remove('study-mode');document.getElementById('casefile').innerHTML=helperText();document.getElementById('side-tools').style.display='none';document.getElementById('main').innerHTML=`<div class="panel form-panel"><h2>Submit Claim</h2><p class="small">Make one clear public claim. No email login. Pseudonymous only.</p><div class="claimbox"><input id="cClaim" placeholder="Claim"><input id="cCategory" placeholder="Category"><select id="cType"><option>Physical/Testable</option><option>Historical</option><option>Religious/Belief</option><option>Conspiracy</option><option>Product Claim</option><option>Medical/High Risk</option></select><textarea id="cEvidence" placeholder="Initial evidence or reason"></textarea><button class="primary" onclick="saveClaim()">Submit to HumanX</button></div></div>`}
async function renderVault(){document.body.classList.remove('study-mode');document.getElementById('casefile').innerHTML=helperText();document.getElementById('side-tools').style.display='none';document.getElementById('main').innerHTML='<div class="panel"><h2>Loading Evidence…</h2></div>';try{await loadEvidenceVault();document.getElementById('casefile').innerHTML=helperText();document.getElementById('main').innerHTML=`<div class="section-head"><h2>Evidence Vault</h2>${graphBox()}</div><div class="grid evidence-grid">${evidenceVault.map(e=>evidenceCard(e)).join('')||'<div class="panel">No evidence found.</div>'}</div>`}catch(e){renderError(e)}}
function evidenceCard(e){const a=parseAnalysis(e.body);return`<article class="card evidence-card"><span class="badge b-blue">${a?'analysis':esc(e.quality)} · ${esc(e.mediaType||'text')}</span><h3>${esc(e.title)}</h3>${a?analysisSummary(a):`<p>${esc(shortText(e.body))}</p>`}${sourceLink(e.sourceUrl)}<div class="row"><span class="pill">linked claim</span><p class="small">${esc(e.claim||'No linked claim')}</p><span class="badge ${cls(e.claimStatus)}">${esc(e.claimStatus||'unknown')}</span></div><div class="actions">${e.claimId?`<button onclick="selectClaim('${esc(e.claimId)}')">Study Linked Claim</button>`:''}<button class="primary" onclick="attachEvidencePrompt('${esc(e.id)}')">Attach</button></div></article>`}
function analysisSummary(a){return`<div class="analysis-card"><span class="badge ${cls(a.verdict)}">${esc(a.verdict||'analysis')}</span><div class="meters">${meter('Evidence',a.evidence_score||a.evidenceScore||0)}${meter('Test',a.testability||0)}${meter('Survive',a.survivability||0)}</div><p class="small">${esc(a.plain_language_summary||a.plainLanguageSummary||'AI/AIP analysis result pasted as evidence. Rendered as analysis, not raw JSON.')}</p></div>`}
async function renderTruths(){document.body.classList.remove('study-mode');document.getElementById('casefile').innerHTML=helperText();document.getElementById('side-tools').style.display='none';document.getElementById('main').innerHTML='<div class="panel"><h2>Loading Truths…</h2></div>';try{await loadTruths();document.getElementById('casefile').innerHTML=helperText();document.getElementById('main').innerHTML=`<div class="section-head"><h2>Truth Statements</h2>${graphBox()}</div><div class="panel compact-form"><input id="truthStatement" placeholder="Truth statement, slogan, doctrine or inherited certainty"><input id="truthCategory" placeholder="Category"><input id="truthOrigin" placeholder="Origin"><select id="truthType"><option value="common">Common truth</option><option value="religious">Religious truth</option><option value="political">Political truth</option><option value="scientific">Scientific consensus</option><option value="family">Family truth</option><option value="cultural">Cultural truth</option></select><button class="primary" onclick="submitTruth()">Add Truth</button></div><div class="grid truth-grid">${truths.map(t=>truthCard(t)).join('')||'<div class="panel">No truth statements yet.</div>'}</div>`}catch(e){renderError(e)}}
function truthCard(t){return`<article class="card truth-card"><span class="badge b-yellow">${esc(t.truthType||'truth')} · ${esc(t.confidenceLabel||'claimed')}</span><h3>${esc(t.statement)}</h3><p class="small">${esc(t.category||'general')} · ${esc(t.origin||'unknown')} · by ${esc(t.handle||'anon')}</p><div class="meters"><div class="meter"><span>Repeated</span><b>${esc(t.repetitionScore||1)}</b></div><div class="meter"><span>Pressure</span><b>${esc(t.pressureScore||0)}</b></div><div class="meter"><span>Claim</span><b>${t.linkedClaimId?'yes':'no'}</b></div></div><div class="actions"><button class="primary" onclick="convertTruth('${esc(t.id)}')">Convert to Claim</button></div></article>`}
async function attachEvidencePrompt(evidenceId){if(!claims.length)await loadClaims(false);const options=claims.map((c,i)=>`${i+1}. ${c.claim}`).join('\n');const choice=prompt('Choose target claim number:\n\n'+options);if(!choice)return;const target=claims[Number(choice)-1];if(!target){toast('Invalid claim choice');return}const stance=cleanStance(prompt('Use as support or pressure?','support')||'support');try{await api('/api/evidence-attach',{method:'POST',body:JSON.stringify({evidenceId,claimId:target.id,stance})});await loadGraphStatus();toast(`Evidence attached as ${stance}`)}catch(e){toast(e.message||'Could not attach evidence')}}
async function submitTruth(){const statement=document.getElementById('truthStatement')?.value||'';const category=document.getElementById('truthCategory')?.value||'general';const origin=document.getElementById('truthOrigin')?.value||'unknown';const truthType=document.getElementById('truthType')?.value||'common';try{await api('/api/truths',{method:'POST',body:JSON.stringify({statement,category,origin,truthType})});await loadGraphStatus();toast('Truth recorded');await renderTruths()}catch(e){toast(e.message)}}
function renderExport(){document.body.classList.remove('study-mode');document.getElementById('casefile').innerHTML=helperText();document.getElementById('side-tools').style.display='none';document.getElementById('main').innerHTML=`<div class="panel form-panel"><h2>AIP Export</h2><p class="small">Open a claim first, generate packet, then copy into any AI. Public users do not use owner API credits.</p><div class="actions"><button class="primary" onclick="generateAIP()">Generate selected claim packet</button><button onclick="downloadJSON()">Download visible data JSON</button></div><pre class="output">${esc(selected?JSON.stringify({selected},null,2):'No selected claim. Open a claim first.')}</pre></div>`}
async function selectClaim(id){try{const data=await api('/api/claims/'+id);selected=data.claim;selected.evidence=data.evidence||[];selected.pressure=data.pressure||[];selected.tests=data.tests||data.home_tests||[];selected.analyses=data.analyses||[];renderStudy();toast('Study loaded')}catch(e){selected=claims.find(c=>c.id===id)||selected;selected.analyses=selected.analyses||[];renderStudy();toast(e.message)}}
function renderStudy(){if(!selected)return;document.body.classList.add('study-mode');document.getElementById('side-tools').style.display='block';document.getElementById('main').innerHTML=`<div class="study"><div><button onclick="backToArena()">← Back</button><span class="badge ${cls(selected.status)}">${esc(selected.status)}</span></div><h2>${esc(selected.claim)}</h2><p class="small">${esc(selected.category)} · ${esc(selected.type)} · by ${esc(selected.handle||'anon')}</p><div class="meters wide">${meter('Evidence',selected.evidenceScore)}${meter('Testability',selected.testability)}${meter('Survivability',selected.survivability)}</div><div class="actions"><button onclick="voteClaim('believe')">I believe</button><button onclick="voteClaim('reject')">I reject</button><button onclick="voteClaim('uncertain')">Uncertain</button><button class="primary" onclick="generateAIP()">Generate AIP</button></div><div class="study-grid"><section class="panel">${sectionEvidence()}</section><section class="panel">${sectionPressure()}</section><section class="panel">${sectionTests()}</section><section class="panel">${sectionAnalyses()}</section></div></div>`;renderCaseMini()}
function renderCaseMini(){document.getElementById('casefile').innerHTML=`<p class="small"><b>Selected claim</b><br>${esc(selected.claim)}</p><p class="small">Use this panel to add evidence, pressure, generate AIP or report. Analyses are now separate from evidence.</p>`}
function evidenceMeta(e){const reused=e.link_type==='reused';const stance=e.linked_stance||e.stance||'support';return`${reused?'REUSED · ':''}${esc(e.quality||e.stance)} · ${esc(e.media_type||e.mediaType||'text')} · ${esc(stance)} · reliability ${esc(e.reliability_score||e.reliabilityScore||'?')}`}
function evidenceItem(e){const a=parseAnalysis(e.body||e.note);if(a)return`<div class="row analysis-card"><span class="pill">LEGACY ANALYSIS IN EVIDENCE · ${esc(a.verdict||'analysis')}</span><b>${esc(e.title)}</b><div class="meters">${meter('Evidence',a.evidence_score||0)}${meter('Test',a.testability||0)}${meter('Survive',a.survivability||0)}</div><p class="small">${esc(a.plain_language_summary||'Structured AIP/AI analysis stored in old evidence field.')}</p><details><summary>Support / pressure / missing tests</summary><h4>Support</h4>${listBits(a.strongest_support)}<h4>Pressure</h4>${listBits(a.strongest_pressure)}<h4>Missing tests</h4>${listBits(a.missing_tests)}</details></div>`;return`<div class="row"><span class="pill">${evidenceMeta(e)}</span><b>${esc(e.title)}</b><p class="small">${esc(shortText(e.body||e.note,620))}</p>${e.link_note?`<p class="small"><b>Reuse:</b> ${esc(e.link_note)}</p>`:''}${sourceLink(e.source_url||e.sourceUrl)}</div>`}
function analysisItem(a){const raw=a.raw||a;return`<div class="row analysis-card"><span class="pill">ANALYSIS RESULT · ${esc(a.source||'aip-user')}</span><span class="badge ${cls(a.verdict||raw.verdict)}">${esc(a.verdict||raw.verdict||'analysis')}</span><div class="meters">${meter('Evidence',a.evidenceScore||raw.evidence_score||0)}${meter('Test',a.testability||raw.testability||0)}${meter('Survive',a.survivability||raw.survivability||0)}</div><p class="small">${esc(a.plainLanguageSummary||raw.plain_language_summary||'Stored analysis result.')}</p><details><summary>Support / pressure / missing tests</summary><h4>Support</h4>${listBits(a.strongestSupport||raw.strongest_support)}<h4>Pressure</h4>${listBits(a.strongestPressure||raw.strongest_pressure)}<h4>Missing tests</h4>${listBits(a.missingTests||raw.missing_tests)}</details></div>`}
function sectionEvidence(){return`<h3>Evidence</h3>${(selected.evidence||[]).map(evidenceItem).join('')||'<p class="small">No evidence yet.</p>'}`}
function sectionPressure(){return`<h3>Pressure</h3>${(selected.pressure||[]).map(p=>{const a=parseAnalysis(p.body||p.note);return a?`<div class="row analysis-card"><span class="pill">LEGACY ANALYSIS PRESSURE · ${esc(a.verdict||'analysis')}</span><b>${esc(p.title)}</b><p class="small">${esc(a.plain_language_summary||'Structured analysis pressure result.')}</p>${listBits(a.strongest_pressure)}</div>`:`<div class="row"><span class="pill">severity ${esc(p.severity||1)}</span><b>${esc(p.title)}</b><p class="small">${esc(shortText(p.body||p.note,620))}</p></div>`}).join('')||'<p class="small">No pressure yet.</p>'}`}
function sectionTests(){return`<h3>Tests</h3>${(selected.tests||[]).map(t=>`<div class="row"><span class="pill">${esc(t.difficulty||'test')} · ${esc(t.safety_level||t.safetyLevel||'normal')}</span><b>${esc(t.title)}</b><p class="small">${esc(t.instructions)}</p></div>`).join('')||'<p class="small">No tests yet.</p>'}`}
function sectionAnalyses(){return`<h3>Analysis</h3>${(selected.analyses||[]).map(analysisItem).join('')||'<p class="small">No saved analysis results yet. Generate AIP, run it externally, then later save the result here.</p>'}`}
function backToArena(){document.body.classList.remove('study-mode');selected=null;setMode('arena')}
async function voteClaim(vote){if(!selected)return toast('Select a claim first');try{const data=await api('/api/claim-vote',{method:'POST',body:JSON.stringify({claimId:selected.id,vote})});selected=data.claim||selected;toast('Vote recorded');await loadGraphStatus();await loadClaims(false);await selectClaim(selected.id)}catch(e){toast(e.message||'Vote route not wired yet')}}
async function saveClaim(){const body={claim:document.getElementById('cClaim').value,category:document.getElementById('cCategory').value,type:document.getElementById('cType').value,initialEvidence:document.getElementById('cEvidence').value};try{const data=await api('/api/claims',{method:'POST',body:JSON.stringify(body)});selected=data.claim;toast('Claim submitted');mode='arena';await loadGraphStatus();await loadClaims(false);await selectClaim(selected.id)}catch(e){toast(e.message)}}
async function addCaseItem(){if(!selected)return toast('Select a claim first');const kind=document.getElementById('eKind').value;const payload={claimId:selected.id,title:document.getElementById('eTitle').value,quality:document.getElementById('eQuality').value,body:document.getElementById('eNote').value,sourceUrl:document.getElementById('eSource')?.value||''};try{const data=await api(kind==='evidence'?'/api/evidence':'/api/pressure',{method:'POST',body:JSON.stringify(payload)});selected=data.claim||selected;await loadGraphStatus();await selectClaim(selected.id);document.getElementById('eTitle').value='';document.getElementById('eNote').value='';if(document.getElementById('eSource'))document.getElementById('eSource').value='';toast(kind==='evidence'?'Evidence attached':'Pressure attached')}catch(e){toast(e.message)}}
async function reportSelected(){if(!selected)return toast('Select a claim first');const reason=prompt('Why report this claim?');if(!reason)return;try{await api('/api/report',{method:'POST',body:JSON.stringify({targetType:'claim',targetId:selected.id,reason})});await loadGraphStatus();toast('Report sent')}catch(e){toast(e.message)}}
async function convertTruth(truthId){try{const data=await api('/api/truth-to-claim',{method:'POST',body:JSON.stringify({truthId})});toast(data.existing?'Existing claim opened':'Truth converted');mode='arena';await loadGraphStatus();await loadClaims(false);if(data.bridge?.claimId)await selectClaim(data.bridge.claimId)}catch(e){toast(e.message||'Could not convert truth')}}
async function generateAIP(){if(!selected)return toast('Open a claim first');try{const data=await api('/api/aip',{method:'POST',body:JSON.stringify({claimId:selected.id})});lastPacket=JSON.stringify(data.packet,null,2)}catch(e){lastPacket=JSON.stringify({aip_version:'1.1',app:'HumanX',mode:'claim-pressure-analysis',no_owner_api_used:true,payload:selected},null,2)}const out=document.getElementById('aip');if(out)out.textContent=lastPacket;toast('AIP ready')}
async function copyAIP(){if(!lastPacket)await generateAIP();navigator.clipboard.writeText(lastPacket);toast('Copied')}
function downloadJSON(){const blob=new Blob([JSON.stringify({user,claims,evidenceVault,truths,beliefSnapshots,graphStatus},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='humanx-visible-data.json';a.click();URL.revokeObjectURL(a.href)}
function renderError(e){document.getElementById('main').innerHTML=`<div class="panel"><h2>HumanX backend notice</h2><p class="small">${esc(e.message||e)}</p></div>`}
window.setMode=setMode;window.searchCurrent=searchCurrent;window.loadClaims=loadClaims;window.selectClaim=selectClaim;window.saveClaim=saveClaim;window.addCaseItem=addCaseItem;window.reportSelected=reportSelected;window.generateAIP=generateAIP;window.copyAIP=copyAIP;window.downloadJSON=downloadJSON;window.voteClaim=voteClaim;window.backToArena=backToArena;window.submitTruth=submitTruth;window.convertTruth=convertTruth;window.attachEvidencePrompt=attachEvidencePrompt;window.saveBeliefMirror=saveBeliefMirror;window.beliefPreview=beliefPreview;window.promoteBelief=promoteBelief;
boot();