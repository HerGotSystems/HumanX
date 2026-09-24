(function setupHumanXLanguage(global) {
  const supported = new Set(['en', 'cs']);
  const requested = new URLSearchParams(global.location.search).get('lang');
  let remembered = '';
  try { remembered = global.sessionStorage.getItem('humanx_language') || ''; } catch (_) {}
  const browser = String(global.navigator.language || '').toLowerCase();
  const code = supported.has(String(requested || '').toLowerCase())
    ? String(requested).toLowerCase()
    : supported.has(remembered)
      ? remembered
      : browser.startsWith('cs') ? 'cs' : 'en';

  try { global.sessionStorage.setItem('humanx_language', code); } catch (_) {}

  function href(path, language = code) {
    const url = new URL(path, global.location.origin);
    url.searchParams.set('lang', supported.has(language) ? language : 'en');
    return `${url.pathname}${url.search}${url.hash}`;
  }

  global.HX_LANGUAGE = Object.freeze({ code, href });
  document.documentElement.lang = code;

  const labels = code === 'cs' ? {
    title: 'HumanX — Poznejte sebe → Přesvědčení → Tvrzení → Důkazy',
    description: 'Než začnete zkoumat, co považujete za pravdivé, prozkoumejte způsob svého uvažování. Zmapujte osobní přesvědčení, formulujte ověřitelná tvrzení a vystavte je důkazům.',
    home: 'Domů', self: 'Poznejte sebe', belief: 'Přesvědčení', drift: 'Vývoj', claims: 'Tvrzení', submit: 'Přidat', evidence: 'Důkazy', truths: 'Pravdy', me: 'Moje HumanX', review: 'Kontrola', runpack: 'RunPack', search: 'Hledat v této části…', starting: 'Spouštím…', language: 'Jazyk'
  } : {
    title: 'HumanX — Know Yourself → Belief → Claim → Evidence',
    description: 'Examine how you think before examining what you think you know. Map personal belief, form testable claims, and pressure-test them with evidence.',
    home: 'Home', self: 'Know Yourself', belief: 'Belief Engine', drift: 'Drift', claims: 'Claims', submit: 'Submit', evidence: 'Evidence', truths: 'Truths', me: 'My HumanX', review: 'Review', runpack: 'RunPack', search: 'Search current workspace...', starting: 'Starting…', language: 'Language'
  };

  document.title = labels.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', labels.description);
  const text = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
  text('tab-home', labels.home);
  text('tab-self', labels.self);
  text('tab-belief', labels.belief);
  text('tab-drift', labels.drift);
  text('tab-arena', labels.claims);
  text('tab-submit', labels.submit);
  text('tab-vault', labels.evidence);
  text('tab-truths', labels.truths);
  text('tab-me', labels.me);
  text('tab-review', labels.review);
  text('tab-export', labels.runpack);
  text('status', labels.starting);
  const search = document.getElementById('search');
  if (search) search.placeholder = labels.search;
  const switcher = document.getElementById('main-language-switch');
  if (switcher) {
    switcher.setAttribute('aria-label', labels.language);
    switcher.querySelectorAll('[data-lang]').forEach(link => {
      const language = link.dataset.lang;
      link.href = href(`${global.location.pathname}${global.location.search}${global.location.hash}`, language);
      link.classList.toggle('active', language === code);
      if (language === code) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }
  const belief = document.getElementById('tab-belief');
  if (belief) belief.onclick = () => { global.location.href = href('/apps/humanx-belief-engine/'); };
})(window);
