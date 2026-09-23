import { EVIDENCE_SCENARIOS, EVIDENCE_SOURCES, scoreEvidenceReflex } from './evidence-core.js';

const app = document.getElementById('app');
const state = { index: 0, responses: {} };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function sourceLabel(key) {
  return EVIDENCE_SOURCES.find(source => source.key === key)?.label || key;
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">first evidence move</span><h1>Evidence Reflex</h1><p class="lead">When several kinds of evidence are available, which one do you inspect first—and how much initial weight do you give it?</p><div class="boundary"><strong>This lab does not rank evidence sources universally.</strong><p class="muted">A measurement, original record, repeated observation, expert analysis, witness account, or lived experience can each matter differently by context. Choosing one first does not reject the others.</p></div><p>Work through eight disputed situations. Choose the source you would inspect first, record its initial weight before checking the others, or leave the choice unresolved.</p><div class="actions"><button class="btn btn-primary" id="startReflex">Start private session</button></div><p class="muted privacy-note"><span class="badge badge-private">session only</span> Nothing is sent, saved, published, or added to My HumanX. Closing or reloading this page clears the session.</p></section>`;
  document.getElementById('startReflex').addEventListener('click', () => {
    state.index = 0;
    state.responses = {};
    scenarioScreen();
  });
}

function currentResponse(scenarioId) {
  return state.responses[scenarioId] || { choiceId: null, weight: 3, unresolved: false };
}

function scenarioScreen() {
  const scenario = EVIDENCE_SCENARIOS[state.index];
  const response = currentResponse(scenario.id);
  const progress = Math.round(((state.index + 1) / EVIDENCE_SCENARIOS.length) * 100);
  const choices = scenario.choices.map(choice => `<button class="choice${response.choiceId === choice.id && !response.unresolved ? ' selected' : ''}" type="button" data-choice="${esc(choice.id)}"><span class="choice-source">${esc(sourceLabel(choice.source))}</span><strong>${esc(choice.label)}</strong><span class="choice-limit">Check its limit: ${esc(choice.limitation)}</span></button>`).join('');
  app.innerHTML = `<section class="card"><div class="progress-row"><span>Situation ${state.index + 1} of ${EVIDENCE_SCENARIOS.length}</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress}%"></div></div><span class="badge">choose what you inspect first</span><h2>${esc(scenario.prompt)}</h2><div class="choice-grid">${choices}</div><div class="weight-box"><div class="weight-head"><label for="weight">Before checking the other sources, how much initial weight would you give this one?</label><span class="weight-value" id="weightValue">${response.weight} / 5</span></div><input class="weight-input" id="weight" type="range" min="1" max="5" step="1" value="${response.weight}" ${response.unresolved || !response.choiceId ? 'disabled' : ''}><div class="weight-scale"><span>1 · slight</span><span>3 · meaningful</span><span>5 · strong</span></div></div><p class="defer-note">Initial weight is not a final conclusion. The visible limitation remains part of the record.</p><div class="actions"><button class="btn btn-quiet" id="backScenario" ${state.index === 0 ? 'disabled' : ''}>← Back</button><button class="btn" id="unresolvedScenario">Not sure what I’d inspect first</button><button class="btn btn-primary" id="nextScenario" ${!response.choiceId && !response.unresolved ? 'disabled' : ''}>${state.index === EVIDENCE_SCENARIOS.length - 1 ? 'See session reflex →' : 'Next →'}</button></div></section>`;

  document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
    state.responses[scenario.id] = { choiceId: button.dataset.choice, weight: response.weight ?? 3, unresolved: false };
    scenarioScreen();
  }));
  document.getElementById('weight').addEventListener('input', event => {
    const saved = currentResponse(scenario.id);
    saved.weight = Number(event.target.value);
    saved.unresolved = false;
    state.responses[scenario.id] = saved;
    document.getElementById('weightValue').textContent = `${saved.weight} / 5`;
  });
  document.getElementById('unresolvedScenario').addEventListener('click', () => {
    state.responses[scenario.id] = { choiceId: null, weight: 3, unresolved: true };
    advance();
  });
  document.getElementById('backScenario').addEventListener('click', () => {
    if (state.index > 0) {
      state.index -= 1;
      scenarioScreen();
    }
  });
  document.getElementById('nextScenario').addEventListener('click', advance);
}

function advance() {
  if (state.index < EVIDENCE_SCENARIOS.length - 1) {
    state.index += 1;
    scenarioScreen();
  } else {
    resultScreen();
  }
}

function resultScreen() {
  const result = scoreEvidenceReflex(state.responses);
  const sourceRows = result.sourceRows.map(row => {
    const width = Math.round((row.selected / row.opportunities) * 100);
    const weight = row.averageWeight === null ? 'no weight recorded' : `average initial weight ${row.averageWeight} / 5`;
    const unresolved = row.unresolved ? ` · ${row.unresolved} unresolved appearance${row.unresolved === 1 ? '' : 's'}` : '';
    return `<div class="source-row"><div class="source-head"><span><b>${esc(row.label)}</b><small>${esc(row.description)}</small></span><strong>${row.selected} / ${row.opportunities}</strong></div><div class="source-track"><span style="width:${width}%"></span></div><p>${esc(weight)}${unresolved}</p></div>`;
  }).join('');
  const highWeight = result.highWeightChoices.length ? result.highWeightChoices.map(row => `<div class="high-choice"><span class="badge">${row.weight} / 5 initial weight</span><h4>${esc(row.prompt)}</h4><p><b>${esc(row.sourceLabel)}</b> · ${esc(row.choiceLabel)}</p><p class="muted">Visible limit: ${esc(row.limitation)}</p></div>`).join('') : '<p class="muted">No first choice received an initial weight of 4 or 5.</p>';
  const trail = result.details.map((row, index) => {
    if (row.unresolved) return `<details class="trail-item"><summary><span>${index + 1}. ${esc(row.prompt)}</span><strong class="result-unresolved">Unresolved</strong></summary><p>You chose not to force a first evidence source.</p></details>`;
    return `<details class="trail-item"><summary><span>${index + 1}. ${esc(row.prompt)}</span><strong>${esc(row.sourceLabel)}</strong></summary><p>First inspection: <b>${esc(row.choiceLabel)}</b></p><p>Initial weight: ${row.weight} / 5</p><p class="muted">Visible limit: ${esc(row.limitation)}</p></details>`;
  }).join('');
  const averageWeight = result.averageWeight === null ? '—' : `${result.averageWeight}`;
  app.innerHTML = `<section class="card"><span class="eyebrow">session reflex</span><h2>What you chose to inspect first</h2><p class="muted">Counts show first-inspection choices from this session. They do not rank evidence quality.</p><div class="metric-grid"><div class="metric"><b>${result.resolved}</b><span>resolved situations</span></div><div class="metric"><b>${result.unresolved}</b><span>unresolved choices</span></div><div class="metric"><b>${averageWeight}</b><span>average initial weight / 5</span></div></div><section><h3>What happened in this session</h3><ul class="observation-list">${result.observations.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>Source-type pattern</h3><div class="source-map">${sourceRows}</div></section><section><h3>High initial-weight choices</h3><div class="high-grid">${highWeight}</div></section><section><h3>Decision trail</h3><div class="trail-list">${trail}</div></section><div class="boundary privacy-note"><strong>Reflex, not verdict.</strong><p class="muted">HumanX is showing which source you chose to inspect first and the weight you reported before checking the others. It is not deciding whether you are rational, whether a source is true, or what your final judgement should be.</p></div><div class="actions"><button class="btn btn-primary" id="retakeReflex">Run another session</button><a class="btn" href="/">Return to HumanX</a></div></section>`;
  document.getElementById('retakeReflex').addEventListener('click', introScreen);
}

introScreen();
