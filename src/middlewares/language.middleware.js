const SUPPORTED_LANGS = new Set(['fr', 'en', 'ar']);

function extractLang(value) {
  if (!value || typeof value !== 'string') return null;
  const token = value.split(',')[0]?.trim();
  if (!token) return null;
  const lang = token.split('-')[0].toLowerCase();
  return SUPPORTED_LANGS.has(lang) ? lang : null;
}

export function detectLanguage(req, _res, next) {
  const queryLang = extractLang(req.query?.lang);
  const headerLang = extractLang(req.headers['x-lang']);
  const acceptLang = extractLang(req.headers['accept-language']);
  req.lang = queryLang || headerLang || acceptLang || 'fr';
  next();
}
