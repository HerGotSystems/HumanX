import { PERSPECTIVE_LENSES, PERSPECTIVE_MOVEMENTS, PERSPECTIVE_SCENARIOS, scorePerspectiveShift } from './perspective-core.js';

const app = document.getElementById('app');
const state = { index: 0, phase: 'first', responses: {} };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function lensLabel(key) {
  return PERSPECTIVE_LENSES.find(lens => lens.key === key)?.label || key;
}

function movementLabel(key) {
  return PERSPECTIVE_MOVEMENTS.find(movement => movement.key === key)?.label || key;
}

function currentResponse(scenarioId) {
  return state.responses[scenarioId] || { initialLens: null, finalLens: null, settled: 3, movement: null, unresolved: false };
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">the same conflict, another position</span><h1>Perspective Shift</h1><p class="lead">What changes in your reading when the same human conflict is shown from another person’s position?</p><div class="boundary"><strong>Another account is not the answer—and neither account is the whole event.</strong><p class="muted">Each pair is constructed and incomplete. The second position may add context, responsibility, impact, or uncertainty. It does not automatically cancel the first.</p></div><p>Across six situations, mark what carries the most weight in your first reading and how settled it feels. Then see another person’s position, choose what carries the most weight now, and record the movement.</p><div class="actions"><button class="btn btn-primary" id="startShift">Start private session</button></div><p class="muted privacy-note"><span class="badge badge-private">session only</span> Nothing is sent, saved, published, or added to My HumanX. Closing or reloading this page clears the session.</p></section>`;
  document.getElementById('startShift').addEventListener('click', () => {
    state.index = 0;
    state.phase = 'first';
    state.responses = {};
    firstScreen();
  });
}

function progressMarkup(stage) {
  const complete = state.index * 2 + (state.phase === 'second' ? 2 : 1);
  const total = PERSPECTIVE_SCENARIOS.length * 2;
  const progress = Math.round((complete / total) * 100);
  return `<div class="progress-row"><span>Situation ${state.index + 1} of ${PERSPECTIVE_SCENARIOS.length} · ${stage}</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress}%"></div></div>`;
}

function lensChoices(selected, attribute) {
  return PERSPECTIVE_LENSES.map(lens => `<button class="choice${selected === lens.key ? ' selected' : ''}" type="button" ${attribute}="${esc(lens.key)}"><strong>${esc(lens.label)}</strong><span>${esc(lens.description)}</span></button>`).join('');
}

function firstScreen() {
  const scenario = PERSPECTIVE_SCENARIOS[state.index];
  const response = currentResponse(scenario.id);
  app.innerHTML = `<section class="card">${progressMarkup('first position')}<span class="badge">one position · incomplete</span><h2>${esc(scenario.title)}</h2><div class="account account-first"><div class="account-head"><b>${esc(scenario.first.position)}’s position</b><span class="muted">Account 1 of 2</span></div><p>${esc(scenario.first.account)}</p></div><p class="stage-question">With only this account, what carries the most weight in your reading?</p><div class="choice-grid">${lensChoices(response.initialLens, 'data-initial-lens')}</div><div class="settled-box"><div class="settled-head"><label for="settled">How settled does this first reading feel?</label><span class="settled-value" id="settledValue">${response.settled} / 5</span></div><input class="settled-input" id="settled" type="range" min="1" max="5" step="1" value="${response.settled}" ${!response.initialLens || response.unresolved ? 'disabled' : ''}><div class="settled-scale"><span>1 · barely formed</span><span>3 · provisional</span><span>5 · strongly settled</span></div></div><p class="muted">This records the weight of your current reading, not whether it is correct.</p><div class="actions"><button class="btn btn-quiet" id="backSituation" ${state.index === 0 ? 'disabled' : ''}>← Back</button><button class="btn" id="leaveUnresolved">Leave this situation unresolved</button><button class="btn btn-primary" id="revealPosition" ${!response.initialLens || response.unresolved ? 'disabled' : ''}>See another position →</button></div></section>`;

  document.querySelectorAll('[data-initial-lens]').forEach(button => button.addEventListener('click', () => {
    state.responses[scenario.id] = { initialLens: button.dataset.initialLens, finalLens: null, settled: response.settled ?? 3, movement: null, unresolved: false };
    firstScreen();
  }));
  document.getElementById('settled').addEventListener('input', event => {
    const saved = currentResponse(scenario.id);
    saved.settled = Number(event.target.value);
    saved.unresolved = false;
    state.responses[scenario.id] = saved;
    document.getElementById('settledValue').textContent = `${saved.settled} / 5`;
  });
  document.getElementById('leaveUnresolved').addEventListener('click', () => {
    state.responses[scenario.id] = { initialLens: null, finalLens: null, settled: 3, movement: null, unresolved: true };
    advance();
  });
  document.getElementById('backSituation').addEventListener('click', () => {
    if (state.index > 0) {
      state.index -= 1;
      state.phase = currentResponse(PERSPECTIVE_SCENARIOS[state.index].id).unresolved ? 'first' : 'second';
      state.phase === 'second' ? secondScreen() : firstScreen();
    }
  });
  document.getElementById('revealPosition').addEventListener('click', () => {
    state.phase = 'second';
    secondScreen();
  });
}

function secondScreen() {
  const scenario = PERSPECTIVE_SCENARIOS[state.index];
  const response = currentResponse(scenario.id);
  if (!response.initialLens || response.unresolved) {
    state.phase = 'first';
    return firstScreen();
  }
  const movements = PERSPECTIVE_MOVEMENTS.map(movement => `<button class="movement${response.movement === movement.key ? ' selected' : ''}" type="button" data-movement="${esc(movement.key)}"><strong>${esc(movement.label)}</strong><span>${esc(movement.description)}</span></button>`).join('');
  app.innerHTML = `<section class="card">${progressMarkup('another position')}<span class="badge badge-second">added position · not a verdict</span><h2>${esc(scenario.title)}</h2><div class="initial-record">Your first reading: <b>${esc(lensLabel(response.initialLens))}</b> · settled ${response.settled} / 5</div><div class="account account-second"><div class="account-head"><b>${esc(scenario.second.position)}’s position</b><span class="muted">Account 2 of 2</span></div><p>${esc(scenario.second.account)}</p></div><p class="muted">This account adds a position. It does not prove intent, erase impact, or settle responsibility.</p><p class="stage-question">With both positions visible, what carries the most weight now?</p><div class="choice-grid">${lensChoices(response.finalLens, 'data-final-lens')}</div><p class="stage-question">What happened to your reading?</p><div class="movement-grid">${movements}</div><div class="actions"><button class="btn btn-quiet" id="reviewFirst">← Review first position</button><button class="btn btn-primary" id="nextSituation" ${!response.finalLens || !response.movement ? 'disabled' : ''}>${state.index === PERSPECTIVE_SCENARIOS.length - 1 ? 'See session movement →' : 'Next situation →'}</button></div></section>`;

  document.querySelectorAll('[data-final-lens]').forEach(button => button.addEventListener('click', () => {
    const saved = currentResponse(scenario.id);
    saved.finalLens = button.dataset.finalLens;
    saved.unresolved = false;
    state.responses[scenario.id] = saved;
    secondScreen();
  }));
  document.querySelectorAll('[data-movement]').forEach(button => button.addEventListener('click', () => {
    const saved = currentResponse(scenario.id);
    saved.movement = button.dataset.movement;
    saved.unresolved = false;
    state.responses[scenario.id] = saved;
    secondScreen();
  }));
  document.getElementById('reviewFirst').addEventListener('click', () => {
    state.phase = 'first';
    firstScreen();
  });
  document.getElementById('nextSituation').addEventListener('click', advance);
}

function advance() {
  if (state.index < PERSPECTIVE_SCENARIOS.length - 1) {
    state.index += 1;
    state.phase = 'first';
    firstScreen();
  } else {
    resultScreen();
  }
}

function resultScreen() {
  const result = scorePerspectiveShift(state.responses);
  const lensRows = result.lensRows.map(row => `<div class="lens-row"><div class="lens-head"><span><b>${esc(row.label)}</b><small>${esc(row.description)}</small></span><strong>${row.initial} → ${row.after}</strong></div><p>first account ${row.initial} · after another position ${row.after}</p></div>`).join('');
  const movementRows = result.movementRows.map(row => `<div class="movement-row"><div class="movement-head"><b>${esc(row.label)}</b><strong>${row.count}</strong></div><p>${esc(row.description)}</p></div>`).join('');
  const changed = result.details.filter(row => !row.unresolved && row.lensChanged);
  const shiftCards = changed.length ? changed.map(row => `<div class="shift-card"><span class="badge">started ${row.settled} / 5 settled</span><h4>${esc(row.title)}</h4><p><b>${esc(lensLabel(row.initialLens))}</b> → <b>${esc(lensLabel(row.finalLens))}</b></p><p class="muted">${esc(movementLabel(row.movement))}</p></div>`).join('') : '<p class="muted">No resolved situation changed which consideration carried the most weight.</p>';
  const trail = result.details.map((row, index) => {
    if (row.unresolved) return `<details class="trail-item"><summary><span>${index + 1}. ${esc(row.title)}</span><strong class="result-unresolved">Unresolved</strong></summary><p>You chose not to force a reading from this pair.</p></details>`;
    return `<details class="trail-item"><summary><span>${index + 1}. ${esc(row.title)}</span><strong>${esc(lensLabel(row.initialLens))} → ${esc(lensLabel(row.finalLens))}</strong></summary><p><b>${esc(row.first.position)}:</b> ${esc(row.first.account)}</p><p><b>${esc(row.second.position)}:</b> ${esc(row.second.account)}</p><p>First reading: ${esc(lensLabel(row.initialLens))} · settled ${row.settled} / 5</p><p>After another position: ${esc(lensLabel(row.finalLens))} · ${esc(movementLabel(row.movement))}</p></details>`;
  }).join('');
  app.innerHTML = `<section class="card"><span class="eyebrow">session perspective movement</span><h2>What changed when another position appeared</h2><p class="muted">This is a transparent record of six constructed conflicts. There is no ideal number of changes.</p><div class="metric-grid"><div class="metric"><b>${result.resolved}</b><span>resolved pairs</span></div><div class="metric"><b>${result.unresolved}</b><span>unresolved pairs</span></div><div class="metric"><b>${result.lensChanges}</b><span>leading consideration changes</span></div><div class="metric"><b>${result.reconsidered}</b><span>less settled, mixed, or withheld</span></div></div><section><h3>What happened in this session</h3><ul class="observation-list">${result.observations.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>What carried weight before and after</h3><div class="lens-map">${lensRows}</div></section><section><h3>How you described the movement</h3><div class="movement-map">${movementRows}</div></section><section><h3>Where the leading consideration changed</h3><div class="shift-list">${shiftCards}</div></section><section><h3>Full response trail</h3><div class="trail-list">${trail}</div></section><div class="boundary privacy-note"><strong>Perspective movement, not a perspective score.</strong><p class="muted">HumanX is showing what you selected before and after another position became visible. It is not deciding that changing is virtuous, staying is stubborn, either account is true, or your response represents your character.</p></div><div class="actions"><button class="btn btn-primary" id="retakeShift">Run another session</button><a class="btn" href="/">Return to HumanX</a></div></section>`;
  document.getElementById('retakeShift').addEventListener('click', introScreen);
}

introScreen();
