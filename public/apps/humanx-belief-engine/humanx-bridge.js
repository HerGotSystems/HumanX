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
    const stressPoints = [];
    if (timeline.fearTrue) stressPoints.push(`Afraid might be true: ${timeline.fearTrue}`);
    if (timeline.isolate) stressPoints.push(`Would isolate you: ${timeline.isolate}`);
    if (timeline.identity) stressPoints.push(`Would break identity: ${timeline.identity}`);
    if (meta.stress && Array.isArray(meta.stress)) stressPoints.push(...meta.stress.map(x => Array.isArray(x) ? x.join(': ') : String(x)));

    const label = topAlignments[0]?.name ? `Belief Engine Profile — ${topAlignments[0].name}` : 'Belief Engine Full Profile';
    const summary = `Full 77-statement HumanX Belief Engine profile. Dominant dimension: ${topDimension(scores)}. Top alignment: ${topAlignments[0]?.name || 'unknown'}. Contradictions detected: ${contradictions.length}.`;

    return {
      label,
      engineVersion: 'humanx-belief-engine-v1.0-bridge',
      source: 'standalone-humanx-belief-engine',
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
        timeline,
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
          'x-humanx-user': user.id
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
      alert('Saved to HumanX. Open the main HumanX app → Belief / Drift to see the snapshot.');
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
    actions.insertBefore(btn, actions.firstChild);
  }

  window.buildHumanXBeliefSnapshot = buildHumanXBeliefSnapshot;
  window.sendBeliefEngineToHumanX = sendBeliefEngineToHumanX;
  window.injectHumanXButton = injectHumanXButton;

  const observer = new MutationObserver(injectHumanXButton);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectHumanXButton);
  else injectHumanXButton();
})();
