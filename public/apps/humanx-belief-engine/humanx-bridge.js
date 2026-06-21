(() => {
  const HUMANX_USER_KEY = 'humanx_public_user_v1';

  function getOrCreateHumanXUser() {
    try {
      const existing = JSON.parse(localStorage.getItem(HUMANX_USER_KEY) || 'null');
      if (existing && existing.id) return existing;
    } catch {}
    const user = {
      id: 'usr_' + crypto.randomUUID().replaceAll('-', '').slice(0, 18),
      handle: 'anon-' + Math.random().toString(36).slice(2, 8)
    };
    localStorage.setItem(HUMANX_USER_KEY, JSON.stringify(user));
    return user;
  }

  function score(obj, key, fallback = 50) {
    const n = Number(obj && obj[key]);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback;
  }

  function topDimension(scores) {
    const entries = Object.entries(scores || {}).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
    return entries[0] ? `${entries[0][0]} ${entries[0][1]}/100` : 'unknown pattern';
  }

  function buildHumanXBeliefSnapshot() {
    const s = window.state || {};
    const scores = s.scores || {};
    const alignments = Array.isArray(s.alignments) ? s.alignments : [];
    const contradictions = Array.isArray(s.contradictions) ? s.contradictions : [];
    const meta = s.metaReport || {};
    const timeline = s.timeline || {};
    const identity = s.identity || {};

    const stability = Math.round((score(scores, 'EVID') + score(scores, 'HUMI') + (100 - score(scores, 'RIGD')) + score(scores, 'OPEN')) / 4);
    const openness = Math.round((score(scores, 'OPEN') + score(scores, 'HUMI') + score(scores, 'SELF') + (100 - score(scores, 'DOGM'))) / 4);
    const pressure = Math.round((score(scores, 'FUSE') + score(scores, 'TRIB') + score(scores, 'PAIN') + score(scores, 'DOGM')) / 4);

    const topAlignments = alignments.slice(0, 7).map(a => ({
      name: a.name || '',
      similarity: a.similarity || 0,
      description: a.desc || a.description || ''
    }));

    const contradictionTexts = contradictions.map(c => `${c.title || 'Contradiction'}: ${c.desc || ''}`.trim());
    // Raw free-text timeline answers (fearTrue, isolate, identity) are excluded from the
    // default payload — they contain sensitive personal content typed by the user and must
    // not leave the browser without explicit opt-in. Only derived moral-scenario labels
    // from meta.stress are included (those come from predefined choice buttons, not text).
    const stressPoints = [];
    if (meta.stress && Array.isArray(meta.stress)) stressPoints.push(...meta.stress.map(x => Array.isArray(x) ? x.join(': ') : String(x)));

    const label = topAlignments[0]?.name ? `Belief Engine Profile — ${topAlignments[0].name}` : 'Belief Engine Full Profile';
    const summary = `Full 77-statement HumanX Belief Engine profile. Dominant dimension: ${topDimension(scores)}. Top alignment: ${topAlignments[0]?.name || 'unknown'}. Contradictions detected: ${contradictions.length}.`;

    return {
      label,
      engineVersion: 'humanx-belief-engine-v2.0',
      source: 'standalone-humanx-belief-engine',
      includesTimeline: false,
      runMode: s.profileMode || 'main',
      dominantPattern: topAlignments[0]?.name || topDimension(scores),
      summary,
      beliefCount: 77,
      contradictionCount: contradictions.length,
      stabilityScore: stability,
      opennessScore: openness,
      pressureScore: pressure,
      dimensions: scores,
      topBeliefs: topAlignments,
      contradictions: contradictionTexts,
      stressPoints,
      raw: {
        scores,
        alignments,
        contradictions,
        // raw.timeline excluded — contains sensitive free-text typed by the user
        identity,
        answers: s.answers || {},
        profileMode: s.profileMode || 'main',
        metaReport: meta,
        exportedAt: new Date().toISOString()
      }
    };
  }

  async function sendBeliefEngineToHumanX() {
    const btn = document.getElementById('send-humanx-btn');
    const old = btn ? btn.textContent : '';
    try {
      if (!window.state || !window.state.scores) throw new Error('No completed Belief Engine result found. Finish the report first.');
      const user = getOrCreateHumanXUser();
      const snapshot = buildHumanXBeliefSnapshot();
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending…';
      }
      const res = await fetch('/api/belief-snapshots', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-humanx-user': user.id,
          // D-145B: advisory-mode owner token, sent whenever it's already
          // present in the shared humanx_public_user_v1 localStorage object
          // (minted by the main app's POST /api/session call). Empty when
          // absent — getOrCreateHumanXUser() never strips this field since
          // it only writes localStorage for brand-new users, never rewrites
          // an existing stored user object.
          'x-humanx-owner-token': user.ownerToken || ''
        },
        body: JSON.stringify({
          snapshot,
          label: snapshot.label,
          source: snapshot.source,
          engineVersion: snapshot.engineVersion
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || 'HumanX save failed');
      if (btn) btn.textContent = 'Saved to HumanX ✓';
      alert('Snapshot saved to HumanX. Open the main app → Drift to see it. It is not published; turning it into a Truth or Claim enters Review before becoming visible to others. Nothing has been proven or verified.');
      return data;
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = old || 'Send to HumanX';
      }
      alert(err.message || String(err));
      throw err;
    }
  }

  function injectHumanXButton() {
    const actions = document.querySelector('.results-actions');
    if (!actions || document.getElementById('send-humanx-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'send-humanx-btn';
    btn.className = 'btn-action';
    btn.type = 'button';
    btn.textContent = 'Send to HumanX';
    btn.onclick = sendBeliefEngineToHumanX;
    const note = document.createElement('p');
    note.id = 'send-humanx-note';
    note.style.cssText = 'font-size:11px;color:#8c97ad;line-height:1.5;margin:10px 0 4px;';
    note.textContent = 'Saved: dimension scores, alignment patterns, contradiction summary, and moral-scenario responses. Not saved: private timeline text or free-text answers you typed. Nothing is published — the snapshot enters your Drift for your own review only.';
    actions.insertBefore(btn, actions.firstChild);
    if (!document.getElementById('send-humanx-note')) actions.insertBefore(note, btn);
  }

  window.buildHumanXBeliefSnapshot = buildHumanXBeliefSnapshot;
  window.sendBeliefEngineToHumanX = sendBeliefEngineToHumanX;
  window.injectHumanXButton = injectHumanXButton;

  const observer = new MutationObserver(injectHumanXButton);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectHumanXButton);
  else injectHumanXButton();
})();
