function normalizeI18n(i18n) {
  if (!i18n) return {};
  if (typeof i18n === 'string') {
    try {
      return JSON.parse(i18n);
    } catch (err) {
      return {};
    }
  }
  return i18n;
}

export function applyTranslations(entity, lang, fields) {
  if (!entity || !lang) return entity;
  const i18n = normalizeI18n(entity.i18n);
  const translations = i18n?.[lang];
  if (!translations) return entity;

  const clone = { ...entity };
  fields.forEach((field) => {
    if (translations[field] !== undefined && translations[field] !== null) {
      clone[field] = translations[field];
    }
  });
  return clone;
}
