import { REVISION_RESPONSES, REVISION_THRESHOLDS, REVISION_TRIGGERS, analyseRevisionConditions } from './revision-core.js';

const app = document.getElementById('app');
const blankEntry = () => ({ position: '', certainty: 50, trigger: null, threshold: null, response: null });
const state = { index: 0, entries: [blankEntry()] };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function isComplete(entry) {
  return Boolean(entry.position.trim() && entry.trigger && entry.threshold && entry.response);
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">revision conditions</span><h1>Change My Mind</h1><p class="lead">For a position you actually hold, can you name what would make you reconsider—and what you would do first if it appeared?</p><div class="boundary"><strong>This does not test whether your belief is correct or whether your condition is demanding enough.</strong><p class="muted">A stated condition is a working commitment, not a prediction or guarantee. HumanX shows exactly what you entered without turning it into a label.</p></div><p>Create one to three private revision cards. Each records the position, current certainty, a possible change trigger, the amount of counterevidence you expect to need, and your intended first response.</p><div class="actions"><button class="btn btn-primary" id="startLab">Create first revision card</button></div><p class="muted privacy-note"><span class="badge badge-private">session only</span> Your position text never leaves this page. Nothing is sent, saved, published, or added to My HumanX. Closing or reloading clears the session.</p></section>`;
  document.getElementById('startLab').addEventListener('click', () => {
    state.index = 0;
    state.entries = [blankEntry()];
    editorScreen();
  });
}

function choiceButtons(options, selected, attribute) {
  return options.map(option => `<button type="button" class="choice${selected === option.key ? ' selected' : ''}" ${attribute}="${esc(option.key)}"><strong>${esc(option.label)}</strong><span>${esc(option.description)}</span></button>`).join('');
}

function editorScreen() {
  const entry = state.entries[state.index];
  const triggerChoices = choiceButtons(REVISION_TRIGGERS, entry.trigger, 'data-trigger');
  const thresholdChoices = choiceButtons(REVISION_THRESHOLDS, entry.threshold, 'data-threshold');
  const responseChoices = choiceButtons(REVISION_RESPONSES, entry.response, 'data-response');
  const complete = isComplete(entry);
  const canAdd = state.index < 2 && complete;
  app.innerHTML = `<section class="card"><div class="progress-row"><span>Revision card ${state.index + 1} of up to 3</span><span>${state.entries.filter(isComplete).length} complete</span></div><span class="badge">position ${state.index + 1}</span><h2>State one position in your own words</h2><label class="field-label" for="positionText">A belief, expectation, interpretation, or decision you currently hold</label><textarea id="positionText" maxlength="240" placeholder="Example: I currently think…">${esc(entry.position)}</textarea><div class="text-count"><span>Private session text</span><span id="positionCount">${entry.position.length} / 240</span></div><div class="certainty-box"><div class="certainty-head"><label for="certainty">Current certainty</label><span class="certainty-value" id="certaintyValue">${entry.certainty}%</span></div><input class="certainty-input" id="certainty" type="range" min="0" max="100" step="5" value="${entry.certainty}"><div class="certainty-scale"><span>0% unsure</span><span>100% certain</span></div></div><section class="editor-section"><h3>What kind of event could make you reconsider?</h3><p class="muted">Choose the condition that comes closest. “I cannot name one yet” is a valid record.</p><div class="choice-grid trigger-grid">${triggerChoices}</div></section><section class="editor-section"><h3>How much counterevidence would you expect to need?</h3><div class="choice-grid">${thresholdChoices}</div></section><section class="editor-section"><h3>If that condition appeared, what would you intend to do first?</h3><div class="choice-grid">${responseChoices}</div></section><p class="completion-note" id="completionNote">${complete ? 'Revision card complete.' : 'Complete all four parts to continue.'}</p><div class="actions"><button class="btn btn-quiet" id="backCard" ${state.index === 0 ? 'disabled' : ''}>← Previous card</button><button class="btn" id="addCard" ${canAdd ? '' : 'disabled'}>Add another position</button><button class="btn btn-primary" id="finishLab" ${complete ? '' : 'disabled'}>See revision conditions →</button></div></section>`;

  const textInput = document.getElementById('positionText');
  textInput.addEventListener('input', event => {
    entry.position = event.target.value.slice(0, 240);
    document.getElementById('positionCount').textContent = `${entry.position.length} / 240`;
    syncCompletion();
  });
  document.getElementById('certainty').addEventListener('input', event => {
    entry.certainty = Number(event.target.value);
    document.getElementById('certaintyValue').textContent = `${entry.certainty}%`;
  });
  document.querySelectorAll('[data-trigger]').forEach(button => button.addEventListener('click', () => {
    entry.trigger = button.dataset.trigger;
    editorScreen();
  }));
  document.querySelectorAll('[data-threshold]').forEach(button => button.addEventListener('click', () => {
    entry.threshold = button.dataset.threshold;
    editorScreen();
  }));
  document.querySelectorAll('[data-response]').forEach(button => button.addEventListener('click', () => {
    entry.response = button.dataset.response;
    editorScreen();
  }));
  document.getElementById('backCard').addEventListener('click', () => {
    if (state.index > 0) {
      state.index -= 1;
      editorScreen();
    }
  });
  document.getElementById('addCard').addEventListener('click', () => {
    if (!isComplete(entry) || state.index >= 2) return;
    state.index += 1;
    if (!state.entries[state.index]) state.entries.push(blankEntry());
    editorScreen();
  });
  document.getElementById('finishLab').addEventListener('click', () => {
    if (isComplete(entry)) resultScreen();
  });
}

function syncCompletion() {
  const complete = isComplete(state.entries[state.index]);
  document.getElementById('finishLab').disabled = !complete;
  document.getElementById('addCard').disabled = !complete || state.index >= 2;
  document.getElementById('completionNote').textContent = complete ? 'Revision card complete.' : 'Complete all four parts to continue.';
}

function resultScreen() {
  const result = analyseRevisionConditions(state.entries);
  const triggerRows = result.triggerRows.filter(row => row.count > 0).map(row => `<div class="trigger-row"><span><b>${esc(row.label)}</b><small>${esc(row.description)}</small></span><strong>${row.count}</strong></div>`).join('');
  const cards = result.details.map(item => `<article class="revision-card"><div class="revision-head"><span>Position ${item.number}</span><strong>${item.certainty}% certainty</strong></div><h3>“${esc(item.position)}”</h3><div class="certainty-track"><span style="width:${item.certainty}%"></span></div><div class="condition"><span>If this appeared</span><b>${esc(item.triggerLabel)}</b><small>${esc(item.triggerDescription)}</small></div><div class="condition"><span>Expected threshold</span><b>${esc(item.thresholdLabel)}</b><small>${esc(item.thresholdDescription)}</small></div><div class="condition"><span>Intended first response</span><b>${esc(item.responseLabel)}</b><small>${esc(item.responseDescription)}</small></div></article>`).join('');
  app.innerHTML = `<section class="card"><span class="eyebrow">revision map</span><h2>Your stated change conditions</h2><p class="muted">These cards preserve what you said in this session. They do not test the position or predict what you will do.</p><div class="metric-grid"><div class="metric"><b>${result.total}</b><span>positions mapped</span></div><div class="metric"><b>${result.averageCertainty}%</b><span>average stated certainty</span></div><div class="metric"><b>${result.namedConditions}</b><span>named change conditions</span></div><div class="metric"><b>${result.unnamedConditions}</b><span>conditions not yet named</span></div></div><section><h3>What happened in this session</h3><ul class="observation-list">${result.observations.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>Revision trigger selections</h3><div class="trigger-map">${triggerRows || '<p class="muted">No revision trigger was selected.</p>'}</div></section><section><h3>Revision cards</h3><div class="revision-grid">${cards}</div></section><div class="boundary privacy-note"><strong>Condition, not guarantee.</strong><p class="muted">Naming what could change your mind does not prove openness, correctness, or future behaviour. HumanX keeps the position, threshold, and intended response together so the condition remains inspectable.</p></div><div class="actions"><button class="btn btn-primary" id="retakeLab">Create new cards</button><a class="btn" href="/">Return to HumanX</a></div></section>`;
  document.getElementById('retakeLab').addEventListener('click', introScreen);
}

introScreen();
