import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en.ts';
import { ja } from '../src/i18n/ja.ts';
import { tr } from '../src/i18n/tr.ts';
import { entryName, getLocale, setLocale, t } from '../src/i18n/index.ts';

const TRANSLATED: Record<string, Record<string, string>> = { tr, ja };

describe('interface strings', () => {
  it('has a translated string for every English key in every edition, and no empty ones beyond the deliberate joins', () => {
    const enKeys = Object.keys(en).sort();
    const joins = new Set(['about.dataNote.c', 'content.noContent.before']);
    for (const [lang, table] of Object.entries(TRANSLATED)) {
      expect(Object.keys(table).sort(), lang).toEqual(enKeys);
      for (const k of enKeys) if (!joins.has(k)) expect(table[k], `${lang} ${k}`).not.toBe('');
    }
  });
  it('keeps the {placeholders} of each English string in every translation', () => {
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [lang, table] of Object.entries(TRANSLATED)) for (const [k, v] of Object.entries(en)) expect(vars(table[k]!), `${lang} ${k}`).toEqual(vars(v));
  });
  it('interpolates and falls back to English', () => {
    setLocale('en');                                      // jsdom reports the machine's language, which may be a translated edition's
    expect(getLocale()).toBe('en');
    expect(t('status.structures', { n: 662 })).toBe('662 structures');
    expect(t('quiz.title', { n: 1, total: 60 })).toBe('Clinical vignette 1 of 60');
  });
});

describe('entryName', () => {
  const brainstem = { name: 'Brainstem', latin: 'Truncus encephali', names: { tr: 'Truncus encephali', ja: '脳幹' } };
  it('leaves English alone', () => {
    expect(entryName(brainstem, '', 'en')).toEqual({ primary: 'Brainstem', secondary: null });
  });
  it('puts the Latin term first in Turkish, English underneath', () => {
    expect(entryName(brainstem, '', 'tr')).toEqual({ primary: 'Truncus encephali', secondary: 'Brainstem' });
    expect(entryName({ name: 'Insula', latin: 'Insula' }, '', 'tr')).toEqual({ primary: 'Insula', secondary: null });
    expect(entryName({ name: 'Wallenberg syndrome' }, '', 'tr')).toEqual({ primary: 'Wallenberg syndrome', secondary: null });
    expect(entryName(undefined, 'amygdala-l', 'tr')).toEqual({ primary: 'amygdala-l', secondary: null });
  });
  it('puts the Japanese term first in Japanese, English underneath, and never falls back to Latin', () => {
    expect(entryName(brainstem, '', 'ja')).toEqual({ primary: '脳幹', secondary: 'Brainstem' });
    expect(entryName({ name: 'Insula', latin: 'Insula' }, '', 'ja')).toEqual({ primary: 'Insula', secondary: null });
    expect(entryName({ name: 'Wallenberg syndrome' }, '', 'ja')).toEqual({ primary: 'Wallenberg syndrome', secondary: null });
  });
});
