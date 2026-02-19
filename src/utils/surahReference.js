import surahReference from '../data/surah_reference.json' assert { type: 'json' };

function normalizeName(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, ' ');
}

const normalizedReference = surahReference.map((surah) => ({
  ...surah,
  name_fr_norm: normalizeName(surah.name_fr),
  name_phonetic_norm: normalizeName(surah.name_phonetic),
  name_ar_norm: normalizeName(surah.name_ar)
}));

const byNumber = new Map(normalizedReference.map((surah) => [surah.number, surah]));

export function getSurahReference() {
  return surahReference;
}

export function getSurahByNumber(number) {
  return byNumber.get(Number(number)) || null;
}

export function resolveSurahName(number, name) {
  const surah = getSurahByNumber(number);
  if (!surah) return null;
  if (!name) return surah.name_ar;

  const normalized = normalizeName(name);
  const matches =
    normalized === surah.name_fr_norm ||
    normalized === surah.name_phonetic_norm ||
    normalized === surah.name_ar_norm;

  return matches ? surah.name_ar : null;
}

export function normalizeVerseRange(start, end) {
  if (start === undefined && end === undefined) {
    return { start: undefined, end: undefined };
  }
  const normalizedStart = start !== undefined ? Number(start) : undefined;
  const normalizedEnd = end !== undefined ? Number(end) : normalizedStart;
  return { start: normalizedStart, end: normalizedEnd };
}

export function validateVerseRange(number, start, end) {
  const surah = getSurahByNumber(number);
  if (!surah) return false;
  if (start === undefined && end === undefined) return true;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  if (start < 1 || end < 1) return false;
  if (start > end) return false;
  return end <= surah.verses;
}
