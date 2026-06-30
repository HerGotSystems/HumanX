(() => {
  const escX = v => String(v ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  const shortX = (v, n = 220) => {
    const s = String(v || '').trim();
    return s.length > n ? s.slice(0, n) + '…' : s;
  };
  const isFullX = s => /standalone-humanx-belief-engine|humanx-belief-engine|Belief Engine Profile/i.test(`${s?.source || ''} ${s?.engineVersion || ''} ${s?.label || ''}`);
  const valX = (s, k) => Math.round(Math.max(0, Math.min(100, Number(s?.[k] || 0))));
  const dimsX = s => s && s.dimensions && typeof s.dimensions === 'object' ? s.dimensions : {};
  const dimLabelX = k => ({ META: 'Metaphysical', EVID: 'Evidence', AUTH: 'Authority', COLL: 'Collective', RITE: 'Ritual', ABSO: 'Absolutism', RIGD: 'Rigidity', PROG: 'Progress', TRAN: 'Transcendence', INHR: 'Inherited', SELF: 'Self-built', TRIB: 'Tribal load', PAIN: 'Pain', DOGM: 'Dogma', OPEN: 'Revision openness', FUSE: 'Identity fusion', HUMI: 'Humility', STRS: 'Stress ethics' }[k] || k);
  const cleanX = s => typeof cleanClaimLabel === 'function' ? cleanClaimLabel(s) : String(s || '').trim();
  const titleX = s => cleanX(s?.label || s?.dominantPattern || s?.source || 'Belief record');
  const positionX = s => {
    const raw = s?.raw || {};
    const top = Array.isArray(s?.topBeliefs) ? s.topBeliefs[0] : null;
    return cleanX(raw.statement || raw.claim || raw.belief || top?.statement || top?.name || s?.dominantPattern || s?.label || 'Belief position');
  };
  const meterX = (n, v) => typeof meter === 'function' ? meter(n, v) : `<div class="meter"><span>${escX(n)} <b class="meter-val">${escX(v || 0)}</b></span><div class="bar"><div class="fill" style="width:${Math.max(0, Math.min(100, Number(v || 0)))}%"></div></div></div>`;
  const deltaX = (n, v) => typeof deltaMeter === 'function' ? deltaMeter(n, v) : meterX(`${n} ${v > 0 ? '+' : ''}${v}`, Math.abs(v || 0));
  const topDimsX = (s, n = 4) => Object.entries(dimsX(s)).filter(([, v]) => Number.isFinite(Number(v))).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, n).map(([k, v]) => ({ k, label: dimLabelX(k), value: Math.round(Number(v)) }));
  const moveX = (a, b) => [...new Set([...Object.keys(dimsX(a)), ...Object.keys(dimsX(b))])].map(k => ({ label: dimLabelX(k), a: Math.round(Number(dimsX(a)[k] || 0)), b: Math.round(Number(dimsX(b)[k] || 0)), d: Math.round(Number(dimsX(b)[k] || 0) - Number(dimsX(a)[k] || 0)) })).filter(x => x.a || x.b || x.d).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 5);

  function cssX() {
    if (document.getElementById('driftx-css')) return;
    const s = document.createElement('style');
    s.id = 'driftx-css';
    s.textContent = `.driftx-pass,.driftx-story,.driftx-path{margin-bottom:18px}.driftx-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.driftx-head h2{margin:7px 0 4px;font-size:clamp(24px,4vw,38px)}.driftx-score{border:1px solid var(--line);border-radius:18px;padding:14px;min-width:96px;text-align:center;background:rgba(87,184,255,.06)}.driftx-score b{display:block;font-size:34px;line-height:1}.driftx-score span,.driftx-stat small,.driftx-path span{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}.driftx-grid{display:grid;grid-template-columns:1.1fr 1fr 1fr 1fr;gap:14px}.driftx-chips{display:flex;flex-wrap:wrap;gap:6px}.driftx-stat{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.driftx-stat span,.driftx-move div,.driftx-path div{border:1px solid var(--line);border-radius:14px;padding:10px;background:rgba(255,255,255,.03)}.driftx-stat b{display:block;font-size:20px}.driftx-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.driftx-move{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:10px}.driftx-move span,.driftx-move small{display:block}.driftx-path-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:12px 0}.driftx-position-grid .card{min-height:250px}.driftx-modal-field{margin:8px 0 10px}.driftx-modal-field label{display:block;margin-bottom:4px;color:var(--muted);font-size:12px}.driftx-modal-field input,.driftx-modal-field textarea,.driftx-modal-field select{width:100%}.driftx-modal-note{border:1px solid var(--line);border-radius:12px;padding:10px;background:rgba(255,255,255,.03)}@media(max-width:980px){.driftx-grid,.driftx-move,.driftx-path-grid{grid-template-columns:1fr 1fr}.driftx-head{flex-direction:column}.driftx-score{width:100%;text-align:left}}@media(max-width:620px){.driftx-grid,.driftx-move,.driftx-path-grid,.driftx-stat{grid-template-columns:1fr}}`;
    document.head.appendChild(s);
  }

  function badgesX(s) {
    const d = dimsX(s), a = [];
    if (valX(s, 'opennessScore') >= 70 || Number(d.OPEN || 0) >= 70) a.push(['Revision-open', 'b-green']);
    if (valX(s, 'pressureScore') >= 60) a.push(['Under pressure', 'b-yellow']);
    if (valX(s, 'contradictionCount') > 0) a.push(['Contradiction faced', 'b-blue']);
    if (Number(d.EVID || 0) >= 70) a.push(['Evidence-heavy', 'b-green']);
    if (Number(d.HUMI || 0) >= 65) a.push(['Humility signal', 'b-green']);
    return a.length ? a : [['Baseline mapped', 'b-blue']];
  }

  function passportX(full, quick) {
    const s = full.at(-1) || quick.at(-1);
    if (!s) return '';
    return `<section class="panel driftx-pass"><div class="driftx-head"><div><span class="badge b-blue">Belief Passport</span><h2>${escX(s.dominantPattern || titleX(s))}</h2><p class="small">Private reflection card. Pressure behaviour, not truth, intelligence, or morality.</p></div><div class="driftx-score"><b>${escX(valX(s, 'opennessScore'))}</b><span>openness</span></div></div><div class="driftx-grid"><div>${meterX('Stability', s.stabilityScore)}${meterX('Open', s.opennessScore)}${meterX('Pressure', s.pressureScore)}${meterX('Tension', s.contradictionCount)}</div><div><h3>Strongest signals</h3><div class="driftx-chips">${topDimsX(s).map(x => `<span class="badge b-blue">${escX(x.label)} ${escX(x.value)}</span>`).join('') || '<span class="badge">no dimensions</span>'}</div></div><div><h3>Behaviour badges</h3><div class="driftx-chips">${badgesX(s).map(x => `<span class="badge ${x[1]}">${escX(x[0])}</span>`).join('')}</div></div><div><h3>HumanX trail</h3><div class="driftx-stat"><span><b>${full.length}</b><small>full profiles</small></span><span><b>${quick.length}</b><small>quick records</small></span><span><b>${(Array.isArray(claims) ? claims : []).length}</b><small>claims loaded</small></span><span><b>${(Array.isArray(truths) ? truths : []).length}</b><small>truths loaded</small></span></div></div></div><div class="driftx-actions"><button class="primary" data-action="copyBeliefPassport" data-id="${escX(s.id || '')}">Copy Passport</button><button data-action="navBeliefEngine">Open Belief Engine</button></div></section>`;
  }

  function storyX(full) {
    if (!full.length) return '';
    const first = full[0], last = full.at(-1);
    if (full.length < 2) return `<section class="panel driftx-story"><span class="badge b-blue">Drift Story</span><h2>Baseline captured</h2><p class="small">Add another full profile later and Drift will show what moved.</p></section>`;
    const ds = valX(last, 'stabilityScore') - valX(first, 'stabilityScore');
    const op = valX(last, 'opennessScore') - valX(first, 'opennessScore');
    const pr = valX(last, 'pressureScore') - valX(first, 'pressureScore');
    const cn = valX(last, 'contradictionCount') - valX(first, 'contradictionCount');
    const bits = [];
    if (op > 10) bits.push('openness rising');
    if (op < -10) bits.push('openness tightening');
    if (ds > 10) bits.push('stability rising');
    if (ds < -10) bits.push('less settled');
    if (pr > 10) bits.push('pressure increasing');
    if (pr < -10) bits.push('pressure easing');
    if (cn > 0) bits.push('more contradictions surfaced');
    if (cn < 0) bits.push('fewer contradictions detected');
    return `<section class="panel driftx-story"><span class="badge b-yellow">Drift Story</span><h2>${escX(titleX(first))} → ${escX(titleX(last))}</h2><p class="small">${escX(bits.length ? bits.join('; ') + '.' : 'No major movement yet.')}</p><div class="meters">${deltaX('Stability', ds)}${deltaX('Openness', op)}${deltaX('Pressure', pr)}${deltaX('Contradictions', cn)}</div><div class="driftx-move">${moveX(first, last).map(x => `<div><span>${escX(x.label)}</span><b class="badge ${x.d >= 12 ? 'b-green' : x.d <= -12 ? 'b-red' : 'b-yellow'}">${x.d > 0 ? '+' : ''}${escX(x.d)}</b><small>${escX(x.a)} → ${escX(x.b)}</small></div>`).join('') || '<p class="small">No dimension deltas.</p>'}</div></section>`;
  }

  function pathX() {
    return `<section class="panel driftx-path"><span class="badge b-purple">Expression layer</span><h2>From private map to public pressure</h2><div class="driftx-path-grid"><div><b>1 · Belief</b><span>private structure</span></div><div><b>2 · Position</b><span>current stance</span></div><div><b>3 · Truth</b><span>repeated as true</span></div><div><b>4 · Claim</b><span>testable publicly</span></div><div><b>5 · Evidence</b><span>support / pressure</span></div></div><p class="small review-first-note">Uses existing Review and promote routes. Nothing becomes public automatically.</p></section>`;
  }

  function cardX(s) {
    return typeof beliefSnapshotCard === 'function' ? beliefSnapshotCard(s) : `<article class="card belief-card"><h3>${escX(titleX(s))}</h3><p class="small">${escX(shortX(s.summary, 240))}</p><div class="actions"><button data-action="promoteBelief" data-id="${escX(s.id)}" data-value="truth">Save as Truth</button><button class="primary" data-action="promoteBelief" data-id="${escX(s.id)}" data-value="claim">Pressure-test as Claim</button></div></article>`;
  }

  function positionsX(rows) {
    return `<section><div class="drift-section-head"><h3>Position Cards</h3><span class="badge b-blue">draftable expression</span><span class="drift-section-note">clean the wording before it enters Truths or Claims</span></div><div class="grid driftx-position-grid">${rows.slice().reverse().slice(0, 6).map(s => `<article class="card drift-position-card"><div class="belief-card-badges"><span class="badge ${isFullX(s) ? 'b-blue' : 'b-yellow'}">${isFullX(s) ? 'full profile' : 'quick record'}</span>${s.contradictionCount ? `<span class="badge b-yellow">${escX(s.contradictionCount)} tension</span>` : ''}</div><h3>${escX(positionX(s))}</h3><p class="small">${escX(shortX(s.summary || titleX(s), 220))}</p><div class="driftx-chips">${topDimsX(s, 3).map(x => `<span class="badge">${escX(x.label)} ${escX(x.value)}</span>`).join('') || '<span class="badge">no dimensions</span>'}</div><div class="actions"><button data-action="copyPositionCard" data-id="${escX(s.id || '')}">Copy Position</button><button data-action="promoteBelief" data-id="${escX(s.id)}" data-value="truth">Save as Truth</button><button class="primary" data-action="promoteBelief" data-id="${escX(s.id)}" data-value="claim">Pressure-test as Claim</button></div><p class="small drift-promote-note">You can edit the public statement before Review.</p></article>`).join('')}</div></section>`;
  }

  async function renderDriftX() {
    document.body.classList.remove('study-mode');
    const side = document.getElementById('side-tools');
    if (side) side.style.display = 'none';
    const cf = document.getElementById('casefile');
    if (cf) cf.innerHTML = '<p class="small"><b>Drift</b> turns saved belief maps into a passport, position cards, and a movement story.</p><p class="small review-first-note">Nothing here proves a belief. Public actions still enter Review.</p>';
    const main = document.getElementById('main');
    if (!main) return;
    main.innerHTML = '<div class="panel"><h2>Loading Drift…</h2></div>';
    try { await loadBeliefSnapshots(); } catch { beliefSnapshots = []; }
    const rows = (Array.isArray(beliefSnapshots) ? beliefSnapshots : []).slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    if (!rows.length) {
      main.innerHTML = `<div class="drift-header"><h2>Drift</h2><span class="badge b-blue">belief story</span></div>${pathX()}<div class="panel"><p>No belief snapshots yet.</p><p class="small">Open the Belief Engine and send a snapshot back to HumanX.</p><button class="primary" data-action="navBeliefEngine">Open Belief Engine</button></div>`;
      return;
    }
    const full = rows.filter(isFullX), quick = rows.filter(s => !isFullX(s));
    main.innerHTML = `<div class="drift-header"><div><h2>Drift</h2><p class="small">Belief Engine maps the person. Drift tells the story. Truths record what people repeat. Claims test what survives.</p></div><span class="badge b-blue">${full.length} full · ${quick.length} quick</span></div>${passportX(full, quick)}${storyX(full)}${pathX()}${positionsX(rows)}<div class="drift-section-head"><h3>Full Belief Engine Profiles</h3><span class="badge b-blue">77-statement profiles</span></div>${full.length ? `<div class="grid">${full.slice().reverse().map(cardX).join('')}</div>` : '<div class="panel"><p class="small">No full profile saved yet.</p><button class="primary" data-action="navBeliefEngine">Open Belief Engine</button></div>'}${quick.length ? `<div class="drift-section-head"><h3>Quick Belief Records</h3><span class="badge">${quick.length}</span></div><div class="grid">${quick.slice().reverse().map(cardX).join('')}</div>` : ''}`;
  }

  const findX = id => (Array.isArray(beliefSnapshots) ? beliefSnapshots : []).find(s => String(s.id) === String(id));
  const passportTextX = s => s ? ['HumanX Belief Passport', `Pattern: ${s.dominantPattern || titleX(s)}`, `Stability: ${valX(s, 'stabilityScore')}/100`, `Openness: ${valX(s, 'opennessScore')}/100`, `Pressure: ${valX(s, 'pressureScore')}/100`, `Contradictions: ${valX(s, 'contradictionCount')}`, `Signals: ${topDimsX(s, 5).map(x => `${x.label} ${x.value}`).join(', ') || 'no dimension data'}`, 'Note: reflection signals, not truth, intelligence, or morality rankings.'].join('\n') : 'No snapshot selected.';
  const positionTextX = s => s ? ['HumanX Position Card', `Position: ${positionX(s)}`, `Snapshot: ${titleX(s)}`, `Summary: ${shortX(s.summary, 360)}`, `Signals: ${topDimsX(s, 3).map(x => `${x.label} ${x.value}`).join(', ') || 'no dimension data'}`, 'Review route: can be saved as Truth or pressure-tested as Claim.'].join('\n') : 'No position selected.';
  async function copyX(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); } catch { toast('Copy failed'); }
  }

  async function promoteCleanX(snapshotId, target) {
    const s = findX(snapshotId);
    if (!s) return toast('Snapshot not found.');
    const targetLabel = target === 'truth' ? 'Truth' : 'Claim';
    const body = `<div class="driftx-modal-note"><p class="small"><b>${escX(targetLabel)} route</b></p><p class="small">Clean the statement before it enters Review. HumanX records/asserts/tests it — this does not prove it.</p></div><div class="driftx-modal-field"><label for="driftxStatement">Public statement</label><textarea id="driftxStatement" rows="4">${escX(positionX(s))}</textarea></div><div class="driftx-modal-field"><label for="driftxCategory">Category</label><input id="driftxCategory" value="Belief"></div>${target === 'claim' ? `<div class="driftx-modal-field"><label for="driftxType">Claim type</label><select id="driftxType"><option>Belief/Testable</option><option>Religious/Belief</option><option>Historical</option><option>Physical/Testable</option><option>Politics</option><option>Social Claim</option></select></div>` : `<div class="driftx-modal-field"><label for="driftxTruthType">Truth type</label><select id="driftxTruthType"><option value="personal-belief">Personal belief</option><option value="cultural">Cultural truth</option><option value="political">Political truth</option><option value="religious">Religious truth</option><option value="common">Common truth</option></select></div>`}<p class="small review-first-note">After submit, it enters Review before public visibility.</p>`;
    hxModal({
      title: target === 'truth' ? 'Save Position as Truth' : 'Pressure-test Position as Claim',
      body,
      confirmLabel: target === 'truth' ? 'Submit Truth to Review' : 'Submit Claim to Review',
      onConfirm: async close => {
        const statement = (document.getElementById('driftxStatement')?.value || '').trim();
        const category = (document.getElementById('driftxCategory')?.value || 'Belief').trim();
        if (statement.length < 4) return toast('Statement is too short.');
        try {
          await ensureSession();
          const payload = { snapshotId, target, statement, category, origin: 'Drift Position Card' };
          if (target === 'claim') payload.type = document.getElementById('driftxType')?.value || 'Belief/Testable';
          else payload.truthType = document.getElementById('driftxTruthType')?.value || 'personal-belief';
          const data = await api('/api/belief-promote', { method: 'POST', body: JSON.stringify(payload) });
          close();
          if (target === 'truth') {
            toast(data.existing ? 'Truth reinforced — already in Truths.' : 'Truth submitted to Review.');
            mode = 'truths';
            document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
            document.getElementById('tab-truths')?.classList.add('active');
            await loadGraphStatus();
            await renderTruths();
            return;
          }
          if (data.claimId) {
            toast(data.existing ? 'Existing claim opened in Study.' : 'Claim submitted to Review.');
            mode = 'arena';
            document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
            document.getElementById('tab-arena')?.classList.add('active');
            await loadGraphStatus();
            await loadClaims(false);
            await selectClaim(data.claimId);
            return;
          }
          toast('Belief promoted.');
        } catch (e) {
          toast(e.message || `${targetLabel} promotion failed.`);
        }
      }
    });
  }

  function installX() {
    cssX();
    window.renderDrift = renderDriftX;
    try { renderDrift = renderDriftX; } catch {}
    document.addEventListener('click', ev => {
      const b = ev.target.closest('[data-action]');
      if (!b) return;
      const a = b.dataset.action;
      if (a === 'copyBeliefPassport') { ev.preventDefault(); ev.stopImmediatePropagation(); copyX(passportTextX(findX(b.dataset.id) || (Array.isArray(beliefSnapshots) ? beliefSnapshots.at(-1) : null)), 'Belief Passport copied.'); }
      if (a === 'copyPositionCard') { ev.preventDefault(); ev.stopImmediatePropagation(); copyX(positionTextX(findX(b.dataset.id)), 'Position Card copied.'); }
      if (a === 'promoteBelief') { ev.preventDefault(); ev.stopImmediatePropagation(); promoteCleanX(b.dataset.id, b.dataset.value || 'truth'); }
    }, true);
    if (document.body.classList.contains('mode-drift')) renderDriftX();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', installX) : installX();
})();
