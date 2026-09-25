import { BELIEF_CATEGORIES_CS, BELIEF_EXACT_CS, BELIEF_PLACEHOLDERS_CS, BELIEF_QUESTIONS_CS, BELIEF_TIMELINE_CS } from './belief-copy.js';
import { BELIEF_IDENTITY_OPTIONS_CS, BELIEF_WORLDVIEW_GROUPS_CS, BELIEF_WORLDVIEWS_CS } from './belief-worldviews-cs.js';
import { BELIEF_CONTRADICTIONS_CS, BELIEF_DIMENSIONS_CS, BELIEF_FORENSIC_EXACT_CS, BELIEF_SYSTEMS_CS } from './belief-results-cs.js';
import { languageSwitcherMarkup, pathWithLanguage, resolveLanguage } from '../shared/language.js';

const language = resolveLanguage({ search: location.search, browserLanguage: navigator.language });
let applying = false;
let queued = false;

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function preserveSpacing(source, replacement) {
  const start = source.match(/^\s*/)?.[0] || '';
  const end = source.match(/\s*$/)?.[0] || '';
  return `${start}${replacement}${end}`;
}

function translateDynamic(value) {
  const text = String(value || '').trim();
  if (BELIEF_EXACT_CS[text]) return BELIEF_EXACT_CS[text];
  if (BELIEF_IDENTITY_OPTIONS_CS[text]) return BELIEF_IDENTITY_OPTIONS_CS[text];
  if (BELIEF_WORLDVIEW_GROUPS_CS[text]) return BELIEF_WORLDVIEW_GROUPS_CS[text].label;
  for (const group of Object.values(BELIEF_WORLDVIEW_GROUPS_CS)) {
    if (group.sourceNote && text === group.sourceNote) return group.note;
  }
  if (BELIEF_WORLDVIEWS_CS[text]) return BELIEF_WORLDVIEWS_CS[text].label;
  if (BELIEF_DIMENSIONS_CS[text]) return BELIEF_DIMENSIONS_CS[text].label;
  if (BELIEF_SYSTEMS_CS[text]) return BELIEF_SYSTEMS_CS[text].label;
  if (BELIEF_CONTRADICTIONS_CS[text]) return BELIEF_CONTRADICTIONS_CS[text].label;
  if (BELIEF_FORENSIC_EXACT_CS[text]) return BELIEF_FORENSIC_EXACT_CS[text];
  let match = text.match(/^Category (\d+) of (\d+)$/);
  if (match) return `Kategorie ${match[1]} z ${match[2]}`;
  match = text.match(/^(\d+)\/(\d+) answered$/);
  if (match) return `zodpovězeno ${match[1]}/${match[2]}`;
  match = text.match(/^Run mode:\s*(.+?)\s*·\s*(counts as real voice|excluded from public charts)$/);
  if (match) return `Režim: ${match[1]} · ${match[2] === 'counts as real voice' ? 'počítá se jako skutečný hlas' : 'nezahrnuje se do veřejných přehledů'}`;
  match = text.match(/^No (major )?internal contradictions detected in your responses\.$/);
  if (match) return 'Ve vašich odpovědích nebyly zjištěny žádné významné vnitřní rozpory.';
  match = text.match(/^Hot nodes: (.+)$/);
  if (match) return `Aktivní uzly: ${match[1]}`;
  return null;
}

function translateTextNodes(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    if (node.parentElement?.closest('script,style,textarea')) return;
    const translated = translateDynamic(node.nodeValue);
    if (translated && translated !== node.nodeValue.trim()) node.nodeValue = preserveSpacing(node.nodeValue, translated);
  });
}

function questionId(card) {
  const likert = card.querySelector('.q-responses[data-qid]')?.dataset.qid;
  if (likert) return likert;
  return card.querySelector('.choice-btn')?.getAttribute('onclick')?.match(/answerChoice\('([^']+)'/)?.[1] || null;
}

function translateQuestions() {
  document.querySelectorAll('#questions-list .q-card').forEach(card => {
    const id = questionId(card);
    const copy = BELIEF_QUESTIONS_CS[id];
    if (!copy) return;
    const prompt = card.querySelector('.q-text');
    setText(prompt, copy.text);
    if (copy.choices) card.querySelectorAll('.choice-btn').forEach((button, index) => {
      if (copy.choices[index]) setText(button, copy.choices[index]);
    });
  });
}

function translateTimelineQuestions() {
  document.querySelectorAll('#tl-scored-qs > div').forEach(block => {
    const id = block.querySelector('.choice-btn')?.getAttribute('onclick')?.match(/answerTimelineQ\('([^']+)'/)?.[1];
    const copy = BELIEF_TIMELINE_CS[id];
    if (!copy) return;
    const prompt = block.querySelector('p');
    setText(prompt, copy.label);
    block.querySelectorAll('.choice-btn').forEach((button, index) => {
      if (copy.choices[index]) setText(button, copy.choices[index]);
    });
  });
}

function translateCategory() {
  const number = document.getElementById('cat-num');
  const title = document.getElementById('cat-title');
  const description = document.getElementById('cat-desc');
  if (!number || !title || !description) return;
  const match = number.textContent.match(/(?:Category|Kategorie)\s+(\d+)/);
  const index = Number(match?.[1] || 0) - 1;
  const copy = BELIEF_CATEGORIES_CS[index];
  if (!copy) return;
  setText(number, `Kategorie ${index + 1} z ${BELIEF_CATEGORIES_CS.length}`);
  setText(title, copy[0]);
  setText(description, copy[1]);
}

function translatePlaceholders() {
  document.querySelectorAll('[placeholder]').forEach(element => {
    const replacement = BELIEF_PLACEHOLDERS_CS[element.getAttribute('placeholder')];
    if (replacement) element.setAttribute('placeholder', replacement);
  });
  document.querySelectorAll('[title]').forEach(element => {
    const replacement = BELIEF_EXACT_CS[element.getAttribute('title')];
    if (replacement && element.getAttribute('title') !== replacement) element.setAttribute('title', replacement);
  });
}

function addBetaNotice() {
  const intro = document.getElementById('screen-intro');
  if (!intro || document.getElementById('czech-core-note')) return;
  const note = document.createElement('p');
  note.id = 'czech-core-note';
  note.className = 'czech-core-note';
  note.textContent = 'Česká beta: otázky, volitelné světonázory a hlavní ovládání jsou česky. Některé podrobné analytické komentáře ve výsledku zatím zůstávají anglicky.';
  intro.querySelector('.intro-logo')?.insertAdjacentElement('afterend', note);
}

function applyCzech() {
  if (language !== 'cs' || applying) return;
  applying = true;
  document.documentElement.lang = 'cs';
  document.title = 'HumanX — Mapa přesvědčení';
  translateCategory();
  translateQuestions();
  translateTimelineQuestions();
  translatePlaceholders();
  translateTextNodes();
  addBetaNotice();
  applying = false;
}

function scheduleApply() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; applyCzech(); });
}

function setupSelector() {
  const wrap = document.createElement('div');
  wrap.className = 'belief-language-wrap';
  wrap.innerHTML = languageSwitcherMarkup(language, language === 'cs' ? 'Jazyk' : 'Language');
  document.body.appendChild(wrap);
  document.querySelectorAll('a[href="/"]').forEach(link => { link.href = pathWithLanguage('/', language); });
}

window.HX_BELIEF_I18N = Object.freeze({
  language,
  translate(value) {
    return language === 'cs' ? (translateDynamic(value) || value) : value;
  },
  worldview(label, fallbackDescription = '') {
    if (language !== 'cs') return { label, desc: fallbackDescription };
    return BELIEF_WORLDVIEWS_CS[label] || { label, desc: fallbackDescription };
  },
  dimension(label, fallbackDescription = '') {
    if (language !== 'cs') return { label, desc: fallbackDescription };
    return BELIEF_DIMENSIONS_CS[label] || { label, desc: fallbackDescription };
  },
  system(name, fallbackDescription = '') {
    if (language !== 'cs') return { label: name, desc: fallbackDescription };
    return BELIEF_SYSTEMS_CS[name] || { label: name, desc: fallbackDescription };
  },
  contradiction(title, fallbackDescription = '') {
    if (language !== 'cs') return { label: title, desc: fallbackDescription };
    return BELIEF_CONTRADICTIONS_CS[title] || { label: title, desc: fallbackDescription };
  },
  text(key, english) {
    if (language !== 'cs') return english;
    const strings = {
      noResult: 'Nebyl nalezen dokončený výsledek Mapy přesvědčení. Nejdříve dokončete zprávu.',
      sending: 'Odesílám…', saved: 'Uloženo do HumanX ✓', send: 'Odeslat do HumanX', saveFailed: 'Uložení do HumanX se nezdařilo',
      savedAlert: 'Snímek byl uložen do HumanX. Najdete ho v hlavní aplikaci v části Drift. Není zveřejněný; jeho převedení na opakovanou „pravdu“ nebo tvrzení nejdříve vstoupí do kontroly. Nic nebylo prokázáno ani ověřeno.',
      bridgeNote: 'Ukládá se: rozměry, vzorce shody, souhrn rozporů a odpovědi na morální situace. Neukládá se: soukromý text časové osy ani volné odpovědi. Nic se nezveřejňuje — snímek vstoupí pouze do vašeho soukromého přehledu Drift.'
    };
    return strings[key] || english;
  }
});

setupSelector();
applyCzech();
new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true, characterData: true });
