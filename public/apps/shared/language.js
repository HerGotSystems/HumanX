export const SUPPORTED_LANGUAGES = Object.freeze([
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'cs', label: 'Čeština', htmlLang: 'cs' }
]);

const supportedCodes = new Set(SUPPORTED_LANGUAGES.map(language => language.code));

export function resolveLanguage({ search = '', browserLanguage = '' } = {}) {
  const requested = new URLSearchParams(search).get('lang');
  if (requested && supportedCodes.has(requested.toLowerCase())) return requested.toLowerCase();
  return String(browserLanguage).toLowerCase().startsWith('cs') ? 'cs' : 'en';
}

export function languageHref(code, href) {
  const language = supportedCodes.has(code) ? code : 'en';
  const url = new URL(href, 'https://humanx.local');
  url.searchParams.set('lang', language);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function pathWithLanguage(path, language) {
  return languageHref(language, path);
}

export function createTranslator(catalog, language) {
  const selected = catalog[language] || catalog.en || {};
  const fallback = catalog.en || {};
  return (key, values = {}) => {
    const raw = selected[key] ?? fallback[key] ?? key;
    return String(raw).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
  };
}

export function languageSwitcherMarkup(language, label = 'Language') {
  const links = SUPPORTED_LANGUAGES.map(item => `<a class="language-option${language === item.code ? ' active' : ''}" href="${languageHref(item.code, globalThis.location?.href || '/') }" lang="${item.htmlLang}" hreflang="${item.htmlLang}"${language === item.code ? ' aria-current="true"' : ''}>${item.label}</a>`).join('');
  return `<nav class="language-switch" aria-label="${label}"><span>${label}</span>${links}</nav>`;
}
