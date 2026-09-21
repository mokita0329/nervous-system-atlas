// The translated editions of the prose, discovered from the tree: every directory under content/i18n/ except
// review/ is a language (tr, ja, …), and the content build writes one bundle per language,
// public/data/content.<lang>.json. The build, the public gate and the private build all take the list from here
// so that adding a language is a directory, not an edit in four allowlists.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const I18N_DIR = resolve(import.meta.dirname, '../../content/i18n');

/** Language codes, sorted: `['ja', 'tr']`. */
export const LANGS: string[] = existsSync(I18N_DIR)
  ? readdirSync(I18N_DIR).filter((d) => d !== 'review' && statSync(join(I18N_DIR, d)).isDirectory()).sort()
  : [];

/** The public file names of the translated bundles: `content.ja.json`, `content.tr.json`. */
export const TRANSLATED_BUNDLES: string[] = LANGS.map((lang) => `content.${lang}.json`);
