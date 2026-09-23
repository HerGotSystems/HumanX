import { UNCERTAINTY_MODES, UNCERTAINTY_SCENARIOS, scoreMissingInformation } from './uncertainty-core.js';

const app = document.getElementById('app');
const state = { index: 0, phase: 'initial', responses: {} };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function modeLabel(key) {
  return UNCERTAINTY_MODES.find(mode => mode.key === key)?.label || key;
}

function currentResponse(scenarioId) {
  return state.responses[scenarioId] || { initialActionId: null, finalActionId: null, readiness: 3, unresolved: false };
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">uncertainty in motion</span><h1>Missing Information</h1><p class="lead">What do you do before the picture is complete—and what changes when one new fact arrives?</p><div class="boundary"><strong>This is not a test of courage, caution, intelligence, or decision quality.</strong><p class="muted">Seeking information, taking a reversible step, waiting, and committing can each make sense in different conditions. The lab records movement without declaring a correct style.</p></div><p>Each of six situations has two stages. Choose an initial approach, mark how ready you feel to act, then see one additional fact and choose again.</p><div class="actions"><button class="btn btn-primary" id="startLab">Start private session</button></div><p class="muted privacy-note"><span class="badge badge-private">session only</span> Nothing is sent, saved, published, or added to My HumanX. Closing or reloading this page clears the session.</p></section>`;
  document.getElementById('startLab').addEventListener('click', () => {
    state.index = 0;
    state.phase = 'initial';
    state.responses = {};
    renderStage();
  });
}

function actionCards(scenario, selectedId, attribute) {
  return scenario.actions.map(action => `<button class="choice${selectedId === action.id ? ' selected' : ''}" type="button" ${attribute}="${esc(action.id)}"><span class="choice-mode">${esc(modeLabel(action.mode))}</span><strong>${esc(action.label)}</strong><span class="choice-tradeoff">Trade-off: ${esc(action.tradeoff)}</span></button>`).join('');
}

function progressMarkup(stageLabel) {
  const completedStages = state.index * 2 + (state.phase === 'reveal' ? 2 : 1);
  const totalStages = UNCERTAINTY_SCENARIOS.length * 2;
  const progress = Math.round((completedStages / totalStages) * 100);
  return `<div class="progress-row"><span>Situation ${state.index + 1} of ${UNCERTAINTY_SCENARIOS.length} · ${stageLabel}</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress}%"></div></div>`;
}

function renderStage() {
  if (state.phase === 'reveal') revealScreen();
  else initialScreen();
}

function initialScreen() {
  const scenario = UNCERTAINTY_SCENARIOS[state.index];
  const response = currentResponse(scenario.id);
  const choices = actionCards(scenario, response.initialActionId, 'data-initial-action');
  const nextLabel = response.unresolved ? 'Continue unresolved →' : 'Reveal one new fact →';
  app.innerHTML = `<section class="card">${progressMarkup('initial information')}<span class="badge">before the missing fact</span><h2>${esc(scenario.prompt)}</h2><p class="stage-question">What is your approach with the information currently available?</p><div class="choice-grid">${choices}</div><div class="readiness-box"><div class="readiness-head"><label for="readiness">How ready are you to act on this approach?</label><span class="readiness-value" id="readinessValue">${response.readiness} / 5</span></div><input class="readiness-input" id="readiness" type="range" min="1" max="5" step="1" value="${response.readiness}" ${response.unresolved || !response.initialActionId ? 'disabled' : ''}><div class="readiness-scale"><span>1 · not ready</span><span>3 · provisional</span><span>5 · ready</span></div></div>${response.unresolved ? '<p class="unresolved-note">This situation is currently marked unresolved. Choose an approach to reopen it.</p>' : '<p class="defer-note">Readiness records your starting position. It is not confidence that the approach is correct.</p>'}<div class="actions"><button class="btn btn-quiet" id="backStage" ${state.index === 0 ? 'disabled' : ''}>← Back</button><button class="btn" id="leaveUnresolved">Leave this situation unresolved</button><button class="btn btn-primary" id="revealFact" ${!response.initialActionId && !response.unresolved ? 'disabled' : ''}>${nextLabel}</button></div></section>`;

  document.querySelectorAll('[data-initial-action]').forEach(button => button.addEventListener('click', () => {
    state.responses[scenario.id] = { initialActionId: button.dataset.initialAction, finalActionId: null, readiness: response.readiness ?? 3, unresolved: false };
    initialScreen();
  }));
  document.getElementById('readiness').addEventListener('input', event => {
    const saved = currentResponse(scenario.id);
    saved.readiness = Number(event.target.value);
    saved.unresolved = false;
    state.responses[scenario.id] = saved;
    document.getElementById('readinessValue').textContent = `${saved.readiness} / 5`;
  });
  document.getElementById('leaveUnresolved').addEventListener('click', () => {
    state.responses[scenario.id] = { initialActionId: null, finalActionId: null, readiness: 3, unresolved: true };
    advanceScenario();
  });
  document.getElementById('backStage').addEventListener('click', () => {
    if (state.index > 0) {
      state.index -= 1;
      const previous = currentResponse(UNCERTAINTY_SCENARIOS[state.index].id);
      state.phase = previous.unresolved ? 'initial' : 'reveal';
      renderStage();
    }
  });
  document.getElementById('revealFact').addEventListener('click', () => {
    const saved = currentResponse(scenario.id);
    if (saved.unresolved) return advanceScenario();
    if (!saved.finalActionId) saved.finalActionId = saved.initialActionId;
    state.responses[scenario.id] = saved;
    state.phase = 'reveal';
    revealScreen();
  });
}

function revealScreen() {
  const scenario = UNCERTAINTY_SCENARIOS[state.index];
  const response = currentResponse(scenario.id);
  const initial = scenario.actions.find(action => action.id === response.initialActionId);
  if (!initial) {
    state.phase = 'initial';
    return initialScreen();
  }
  const choices = actionCards(scenario, response.finalActionId, 'data-final-action');
  app.innerHTML = `<section class="card">${progressMarkup('new information')}<span class="badge badge-new">new information</span><div class="reveal-box"><p>${esc(scenario.reveal)}</p></div><div class="initial-record"><span>Your initial approach</span><b>${esc(modeLabel(initial.mode))}</b><small>${esc(initial.label)} · readiness ${response.readiness} / 5</small></div><h2>With this added fact, what is your approach now?</h2><p class="stage-question">Keeping the same approach is a recorded choice. Changing it is also a recorded choice.</p><div class="choice-grid">${choices}</div><div class="actions"><button class="btn btn-quiet" id="backToInitial">← Review initial choice</button><button class="btn btn-primary" id="nextSituation" ${!response.finalActionId ? 'disabled' : ''}>${state.index === UNCERTAINTY_SCENARIOS.length - 1 ? 'See session transitions →' : 'Next situation →'}</button></div></section>`;

  document.querySelectorAll('[data-final-action]').forEach(button => button.addEventListener('click', () => {
    const saved = currentResponse(scenario.id);
    saved.finalActionId = button.dataset.finalAction;
    saved.unresolved = false;
    state.responses[scenario.id] = saved;
    revealScreen();
  }));
  document.getElementById('backToInitial').addEventListener('click', () => {
    state.phase = 'initial';
    initialScreen();
  });
  document.getElementById('nextSituation').addEventListener('click', advanceScenario);
}

function advanceScenario() {
  if (state.index < UNCERTAINTY_SCENARIOS.length - 1) {
    state.index += 1;
    state.phase = 'initial';
    initialScreen();
  } else {
    resultScreen();
  }
}

function resultScreen() {
  const result = scoreMissingInformation(state.responses);
  const modeRows = result.modeRows.map(row => `<div class="mode-row"><div class="mode-head"><span><b>${esc(row.label)}</b><small>${esc(row.description)}</small></span><strong>${row.initial} → ${row.final}</strong></div><div class="bar-pair"><div><i style="width:${Math.round((row.initial / UNCERTAINTY_SCENARIOS.length) * 100)}%"></i></div><div><i style="width:${Math.round((row.final / UNCERTAINTY_SCENARIOS.length) * 100)}%"></i></div></div><p>initial ${row.initial} · after new information ${row.final}</p></div>`).join('');
  const changes = result.details.filter(row => !row.unresolved && row.changed);
  const changeCards = changes.length ? changes.map(row => `<div class="change-card"><span class="badge">readiness ${row.readiness} / 5</span><h4>${esc(row.prompt)}</h4><p><b>${esc(modeLabel(row.initialMode))}</b> → <b>${esc(modeLabel(row.finalMode))}</b></p><p class="muted">New information: ${esc(row.reveal)}</p></div>`).join('') : '<p class="muted">No resolved approach changed after the added fact in this session.</p>';
  const trail = result.details.map((row, index) => {
    if (row.unresolved) return `<details class="trail-item"><summary><span>${index + 1}. ${esc(row.prompt)}</span><strong class="result-unresolved">Unresolved</strong></summary><p>No initial or updated approach was forced.</p></details>`;
    const transition = row.changed ? `${modeLabel(row.initialMode)} → ${modeLabel(row.finalMode)}` : `${modeLabel(row.initialMode)} stayed`;
    return `<details class="trail-item"><summary><span>${index + 1}. ${esc(row.prompt)}</span><strong>${esc(transition)}</strong></summary><p>Initial: <b>${esc(row.initialLabel)}</b> · readiness ${row.readiness} / 5</p><p>New information: ${esc(row.reveal)}</p><p>After: <b>${esc(row.finalLabel)}</b></p><p class="muted">Final trade-off: ${esc(row.finalTradeoff)}</p></details>`;
  }).join('');
  const averageReadiness = result.averageReadiness === null ? '—' : result.averageReadiness;
  app.innerHTML = `<section class="card"><span class="eyebrow">session transitions</span><h2>How your approach moved when information changed</h2><p class="muted">This map shows actions and transitions from six constructed situations. It is not a decision score.</p><div class="metric-grid"><div class="metric"><b>${result.resolved}</b><span>resolved situations</span></div><div class="metric"><b>${result.changed}</b><span>approaches changed</span></div><div class="metric"><b>${averageReadiness}</b><span>average initial readiness / 5</span></div><div class="metric"><b>${result.unresolved}</b><span>left unresolved</span></div></div><section><h3>What happened in this session</h3><ul class="observation-list">${result.observations.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>Initial → after new information</h3><div class="mode-legend"><span>first bar: initial</span><span>second bar: after</span></div><div class="mode-map">${modeRows}</div></section><section><h3>Changed approaches</h3><div class="change-grid">${changeCards}</div></section><section><h3>Situation trail</h3><div class="trail-list">${trail}</div></section><div class="boundary privacy-note"><strong>Movement, not identity.</strong><p class="muted">HumanX is showing what you chose before and after one added fact. It is not deciding whether you tolerate uncertainty well, whether a change was correct, or how you will act outside these situations.</p></div><div class="actions"><button class="btn btn-primary" id="retakeLab">Run another session</button><a class="btn" href="/">Return to HumanX</a></div></section>`;
  document.getElementById('retakeLab').addEventListener('click', introScreen);
}

introScreen();
