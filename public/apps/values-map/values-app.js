import { VALUE_CONSIDERATIONS, VALUE_SCENARIOS, scoreValuesMap } from './values-core.js';

const app = document.getElementById('app');
const state = { index: 0, responses: {} };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function valueLabel(key) {
  return VALUE_CONSIDERATIONS.find(value => value.key === key)?.label || key;
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">values under trade-off</span><h1>Values Map</h1><p class="lead">What do you protect when two legitimate considerations cannot both win?</p><div class="boundary"><strong>This is not a test of whether your values are good, coherent, or correct.</strong><p class="muted">Each scenario removes an easy answer. Your choices show what won here—and which cost you accepted—not a permanent hierarchy of who you are.</p></div><p>Work through 10 paired trade-offs. Choose the consideration you would protect, mark how difficult the decision felt, or leave the conflict unresolved.</p><div class="actions"><button class="btn btn-primary" id="startMap">Start private session</button></div><p class="muted privacy-note"><span class="badge badge-private">session only</span> Nothing is sent, saved, published, or added to My HumanX. Closing or reloading this page clears the session.</p></section>`;
  document.getElementById('startMap').addEventListener('click', () => {
    state.index = 0;
    state.responses = {};
    scenarioScreen();
  });
}

function currentResponse(scenarioId) {
  return state.responses[scenarioId] || { choiceId: null, difficulty: 3, unresolved: false };
}

function scenarioScreen() {
  const scenario = VALUE_SCENARIOS[state.index];
  const response = currentResponse(scenario.id);
  const progress = Math.round(((state.index + 1) / VALUE_SCENARIOS.length) * 100);
  const choices = scenario.choices.map(choice => `<button class="choice${response.choiceId === choice.id && !response.unresolved ? ' selected' : ''}" type="button" data-choice="${esc(choice.id)}"><span class="choice-value">${esc(valueLabel(choice.value))}</span><strong>${esc(choice.label)}</strong><span class="choice-cost">Accept: ${esc(choice.cost)}</span></button>`).join('');
  app.innerHTML = `<section class="card"><div class="progress-row"><span>Trade-off ${state.index + 1} of ${VALUE_SCENARIOS.length}</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress}%"></div></div><span class="badge">choose what wins here</span><h2>${esc(scenario.prompt)}</h2><div class="choice-grid">${choices}</div><div class="difficulty-box"><div class="difficulty-head"><label for="difficulty">How difficult was this choice?</label><span class="difficulty-value" id="difficultyValue">${response.difficulty} / 5</span></div><input class="difficulty-input" id="difficulty" type="range" min="1" max="5" step="1" value="${response.difficulty}" ${response.unresolved || !response.choiceId ? 'disabled' : ''}><div class="difficulty-scale"><span>1 · easy</span><span>3 · mixed</span><span>5 · difficult</span></div></div><p class="defer-note">A choice is not an endorsement of its cost. Leaving a conflict unresolved is recorded separately.</p><div class="actions"><button class="btn btn-quiet" id="backScenario" ${state.index === 0 ? 'disabled' : ''}>← Back</button><button class="btn" id="unresolvedScenario">Keep unresolved</button><button class="btn btn-primary" id="nextScenario" ${!response.choiceId && !response.unresolved ? 'disabled' : ''}>${state.index === VALUE_SCENARIOS.length - 1 ? 'See session map →' : 'Next →'}</button></div></section>`;

  document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
    state.responses[scenario.id] = { choiceId: button.dataset.choice, difficulty: response.difficulty ?? 3, unresolved: false };
    scenarioScreen();
  }));
  document.getElementById('difficulty').addEventListener('input', event => {
    const saved = currentResponse(scenario.id);
    saved.difficulty = Number(event.target.value);
    saved.unresolved = false;
    state.responses[scenario.id] = saved;
    document.getElementById('difficultyValue').textContent = `${saved.difficulty} / 5`;
  });
  document.getElementById('unresolvedScenario').addEventListener('click', () => {
    state.responses[scenario.id] = { choiceId: null, difficulty: 3, unresolved: true };
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
  if (state.index < VALUE_SCENARIOS.length - 1) {
    state.index += 1;
    scenarioScreen();
  } else {
    resultScreen();
  }
}

function resultScreen() {
  const result = scoreValuesMap(state.responses);
  const mapRows = result.valueRows.map(row => {
    const width = Math.round((row.selected / row.opportunities) * 100);
    const unresolved = row.unresolved ? ` · ${row.unresolved} unresolved appearance${row.unresolved === 1 ? '' : 's'}` : '';
    return `<div class="value-row"><div class="value-head"><span><b>${esc(row.label)}</b><small>${esc(row.description)}</small></span><strong>${row.selected} / ${row.opportunities}</strong></div><div class="value-track"><span style="width:${width}%"></span></div><p>${row.selected} selected${unresolved}</p></div>`;
  }).join('');
  const hardChoices = result.hardChoices.length ? result.hardChoices.map(row => `<div class="hard-choice"><span class="badge">${row.difficulty} / 5 difficulty</span><h4>${esc(row.prompt)}</h4><p><b>${esc(valueLabel(row.selectedValue))}</b> won here. Accepted cost: ${esc(row.selectedCost)}</p></div>`).join('') : '<p class="muted">No resolved choice was marked 4 or 5 for difficulty.</p>';
  const trail = result.details.map((row, index) => {
    if (row.unresolved) return `<details class="trail-item"><summary><span>${index + 1}. ${esc(row.prompt)}</span><strong class="result-unresolved">Unresolved</strong></summary><p>You chose not to force one consideration above the other.</p></details>`;
    return `<details class="trail-item"><summary><span>${index + 1}. ${esc(row.prompt)}</span><strong>${esc(valueLabel(row.selectedValue))}</strong></summary><p>You chose: <b>${esc(row.selectedLabel)}</b></p><p>Accepted cost: ${esc(row.selectedCost)}</p><p class="muted">Difficulty ${row.difficulty} / 5 · Other consideration: ${esc(valueLabel(row.otherValue))}</p></details>`;
  }).join('');
  app.innerHTML = `<section class="card"><span class="eyebrow">session map</span><h2>What won in these trade-offs</h2><p class="muted">Counts show how often each consideration was selected in its two appearances. They are not scores.</p><div class="metric-grid"><div class="metric"><b>${result.resolved}</b><span>resolved choices</span></div><div class="metric"><b>${result.unresolved}</b><span>unresolved conflicts</span></div><div class="metric"><b>${result.hardChoices.length}</b><span>difficult choices</span></div></div><section><h3>What happened in this session</h3><ul class="observation-list">${result.observations.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>Consideration map</h3><div class="value-map">${mapRows}</div></section><section><h3>Hardest resolved conflicts</h3><div class="hard-grid">${hardChoices}</div></section><section><h3>Decision trail</h3><div class="trail-list">${trail}</div></section><div class="boundary privacy-note"><strong>Map, not verdict.</strong><p class="muted">HumanX is showing your selections and accepted costs from this session. It is not deciding what you truly value, whether your choices are moral, or how you will act in another context.</p></div><div class="actions"><button class="btn btn-primary" id="retakeMap">Run another session</button><a class="btn" href="/">Return to HumanX</a></div></section>`;
  document.getElementById('retakeMap').addEventListener('click', introScreen);
}

introScreen();
